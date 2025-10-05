import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";

// Enhanced auth middleware with Redis caching
export const redisAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cache the user data for future requests
    const userData = {
      id: decoded.id,
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
      // Add token to blacklist with expiration
      const decoded = jwt.decode(token);
      const exp = decoded.exp;
      const ttl = exp - Math.floor(Date.now() / 1000);

      if (ttl > 0) {
        await redisClient.set(`blacklist:${token}`, "true", ttl);
      }
    }

    next();
  } catch (error) {
    console.error("Token blacklist error:", error);
    next();
  }
};

// Rate limiting middleware using Redis
export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return async (req, res, next) => {
    try {
      const key = `rate_limit:${req.ip}`;
      const current = await redisClient.get(key);

      if (current === null) {
        // First request in window
        await redisClient.set(key, "1", Math.ceil(windowMs / 1000));
        return next();
      }

      const count = parseInt(current);
      if (count >= max) {
        return res.status(429).json({
          message: "Too many requests, please try again later",
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Increment counter
      await redisClient.set(
        key,
        (count + 1).toString(),
        Math.ceil(windowMs / 1000)
      );
      next();
    } catch (error) {
      console.error("Rate limit error:", error);
      // If Redis fails, allow request to proceed
      next();
    }
  };
};

// Chat rate limiting (more restrictive)
export const chatRateLimit = (windowMs = 60 * 1000, max = 5) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next();

      const key = `chat_rate_limit:${userId}`;
      const current = await redisClient.get(key);

      if (current === null) {
        await redisClient.set(key, "1", Math.ceil(windowMs / 1000));
        return next();
      }

      const count = parseInt(current);
      if (count >= max) {
        return res.status(429).json({
          message:
            "Chat rate limit exceeded, please wait before sending another message",
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      await redisClient.set(
        key,
        (count + 1).toString(),
        Math.ceil(windowMs / 1000)
      );
      next();
    } catch (error) {
      console.error("Chat rate limit error:", error);
      next();
    }
  };
};
