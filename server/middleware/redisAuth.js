import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/secrets.js";
import tokenRegistry from "../services/tokenRegistry.js";

// Enhanced auth middleware with Redis caching
export const redisAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    if (await tokenRegistry.isRevoked(token)) {
      return res.status(401).json({ message: "Token has been revoked" });
    }

    // Try to get user from Redis cache first
    const cacheKey = `user:${token}`;
    let user = await redisClient.get(cacheKey);

    if (user) {
      // User found in cache, extend cache TTL
      await redisClient.expire(cacheKey, 3600); // 1 hour
      req.user = user;
      return next();
    }

    // Token not in cache, verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cache the user data for future requests
    const userData = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      username: decoded.username,
    };

    await redisClient.set(cacheKey, userData, 3600); // Cache for 1 hour
    req.user = userData;

    next();
  } catch (error) {
    console.error("Redis Auth Error:", error);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// Token blacklist middleware for logout
export const blacklistToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      await tokenRegistry.revoke(token, jwt.decode(token)?.exp);
    }
    next();
  } catch (error) {
    console.error("Token blacklist error:", error);
    next();
  }
};

/**
 * Fixed-window limiter.
 *
 * The previous implementation re-SET the key on every request, which pushed the
 * expiry out each time and turned the "window" into a rolling one that only
 * ended once you stopped entirely — so ten messages spread across ten minutes
 * still tripped a one-minute limit. `incrementInWindow` sets the TTL once, when
 * the window opens.
 *
 * Fails open on a Redis outage: an optional cache going down must not take chat
 * with it.
 */
const windowLimiter = ({ keyFor, windowMs, max, message }) => {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      const key = keyFor(req);
      if (!key) return next();

      const result = await redisClient.incrementInWindow(key, windowSeconds);
      if (!result) return next(); // Redis unavailable — allow through.

      const remaining = Math.max(0, max - result.count);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", remaining);

      if (result.count > max) {
        const retryAfter = Math.max(1, result.ttl);
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({
          message: message(retryAfter),
          retryAfter,
        });
      }

      return next();
    } catch (error) {
      console.error("Rate limit error:", error);
      return next();
    }
  };
};

const plural = (seconds) =>
  seconds === 1 ? "1 second" : `${seconds} seconds`;

export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) =>
  windowLimiter({
    keyFor: (req) => `rate_limit:${req.ip}`,
    windowMs,
    max,
    message: (retryAfter) =>
      `Too many requests. Please try again in ${plural(retryAfter)}.`,
  });

// Chat rate limiting (more restrictive, and per user rather than per IP so
// people behind one office NAT do not share a budget)
export const chatRateLimit = (windowMs = 60 * 1000, max = 5) =>
  windowLimiter({
    keyFor: (req) => (req.user?.id ? `chat_rate_limit:${req.user.id}` : null),
    windowMs,
    max,
    message: (retryAfter) =>
      `You're sending messages faster than the limit allows. Try again in ${plural(retryAfter)}.`,
  });
