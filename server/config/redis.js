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
    try {
      const client = this.getClient();
      await client.lTrim(key, start, stop);
      return true;
    } catch (error) {
      console.error('Redis LTRIM error:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;
