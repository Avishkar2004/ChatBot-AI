import crypto from "node:crypto";
import redisClient from "../config/redis.js";

/**
 * Session revocation for stateless JWTs.
 *
 * "Sign out" used to only clear localStorage, so a copied token stayed valid for
 * its full 7-day life. Two mechanisms fix that:
 *
 *   1. Per-token blacklist — an explicit logout parks the token's fingerprint
 *      until its own expiry, so replaying it fails.
 *   2. Per-user cutoff — changing or resetting a password stamps a timestamp;
 *      every token issued before it is refused, which logs out every other
 *      device at once.
 *
 * Both live in Redis. When Redis is down we fail open (the token still works)
 * rather than locking every user out of a working app — the same trade-off the
 * rest of the cache layer makes.
 */

// Never store raw tokens: the key itself would be a working credential to
// anyone who can read the keyspace.
const fingerprint = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const blacklistKey = (token) => `revoked_token:${fingerprint(token)}`;
const cutoffKey = (userId) => `session_cutoff:${userId}`;

// Password cutoffs must outlive any token that could still be presented.
const CUTOFF_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

class TokenRegistry {
  /** Park a token until it expires on its own. `exp` is the JWT claim (seconds). */
  async revoke(token, exp) {
    if (!token) return false;
    const ttl = Math.ceil((exp || 0) - Date.now() / 1000);
    if (ttl <= 0) return true; // already expired; nothing to remember
    return redisClient.set(blacklistKey(token), "1", ttl);
  }

  async isRevoked(token) {
    if (!token) return false;
    return redisClient.exists(blacklistKey(token));
  }

  /** Invalidate every token issued before now for this user. */
  async revokeAllForUser(userId) {
    if (!userId) return false;
    return redisClient.set(
      cutoffKey(userId),
      Math.floor(Date.now() / 1000),
      CUTOFF_TTL_SECONDS,
    );
  }

  /** @returns {Promise<number|null>} unix seconds, or null when none is set. */
  async cutoffFor(userId) {
    if (!userId) return null;
    const value = await redisClient.get(cutoffKey(userId));
    return typeof value === "number" ? value : null;
  }
}

export default new TokenRegistry();
