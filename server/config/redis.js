import { createClient } from 'redis';
import 'dotenv/config';

const CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10000);
const MAX_RECONNECT_ATTEMPTS = Number(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || 3);

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.lastErrorLoggedAt = 0;
  }

  logError(message, err) {
    const now = Date.now();
    if (now - this.lastErrorLoggedAt < 5000) {
      return;
    }
    this.lastErrorLoggedAt = now;
    console.error(message, err?.message || err);
  }

  async cleanupClient() {
    if (!this.client) {
      return;
    }

    try {
      this.client.removeAllListeners();
      if (this.client.isOpen) {
        await this.client.disconnect();
      }
    } catch {
      // Ignore cleanup errors.
    } finally {
      this.client = null;
      this.isConnected = false;
    }
  }

  async connect() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(redisUrl);

    await this.cleanupClient();

    try {
      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || url.password,
        username: url.username,
        socket: {
          connectTimeout: CONNECT_TIMEOUT_MS,
          reconnectStrategy: (retries) => {
            if (retries >= MAX_RECONNECT_ATTEMPTS) {
              return false;
            }
            return Math.min(retries * 500, 2000);
          },
          tls: url.protocol === 'rediss:' ? {} : undefined,
        },
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logError('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error(`Redis connection timed out after ${CONNECT_TIMEOUT_MS}ms`)),
            CONNECT_TIMEOUT_MS,
          );
        }),
      ]);

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Redis connection failed:', error.message);
      console.warn('Starting server without Redis — caching and chat sessions will be limited.');
      await this.cleanupClient();
      return false;
    }
  }

  async disconnect() {
    await this.cleanupClient();
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  isAvailable() {
    return Boolean(this.client && this.isConnected);
  }

  // Cache methods
  async set(key, value, ttl = 3600) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await client.setEx(key, ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.isAvailable()) return null;
    try {
      const client = this.getClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key, ttl) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  // Hash operations for user sessions
  async hset(key, field, value) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis HSET error:', error);
      return false;
    }
  }

  async hget(key, field) {
    if (!this.isAvailable()) return null;
    try {
      const client = this.getClient();
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis HGET error:', error);
      return null;
    }
  }

  async hdel(key, field) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.hDel(key, field);
      return true;
    } catch (error) {
      console.error('Redis HDEL error:', error);
      return false;
    }
  }

  // List operations for chat messages
  async lpush(key, value) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis LPUSH error:', error);
      return false;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    if (!this.isAvailable()) return [];
    try {
      const client = this.getClient();
      const values = await client.lRange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      console.error('Redis LRANGE error:', error);
      return [];
    }
  }

  async ltrim(key, start, stop) {
    if (!this.isAvailable()) return false;
    try {
      const client = this.getClient();
      await client.lTrim(key, start, stop);
      return true;
    } catch (error) {
      console.error('Redis LTRIM error:', error);
      return false;
    }
  }

  /**
   * Atomically bump a counter and, only when it is newly created, give it a TTL.
   *
   * A plain GET/SET pair both races under concurrency and pushes the expiry out
   * on every hit, which silently turns a fixed window into one that never ends.
   * INCR + conditional EXPIRE keeps the window anchored to its first request.
   *
   * @returns {Promise<{ count: number, ttl: number } | null>} null when Redis
   *          is unavailable, so callers can decide to fail open.
   */
  async incrementInWindow(key, windowSeconds) {
    // Callers fail open on null. Check availability first so a server running
    // without Redis does not log a stack trace on every single request.
    if (!this.isAvailable()) return null;

    try {
      const client = this.getClient();
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, windowSeconds);
        return { count, ttl: windowSeconds };
      }
      let ttl = await client.ttl(key);
      // -1 = key exists with no expiry (lost TTL); re-anchor it rather than
      // leaking a counter that blocks the user forever.
      if (ttl < 0) {
        await client.expire(key, windowSeconds);
        ttl = windowSeconds;
      }
      return { count, ttl };
    } catch (error) {
      console.error('Redis INCR error:', error);
      return null;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;
