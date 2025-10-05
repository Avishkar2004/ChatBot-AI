import { createClient } from 'redis';
import 'dotenv/config';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Parse Redis URL for cloud connections
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const url = new URL(redisUrl);
      
      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || url.password,
        username: url.username,
        socket: {
          connectTimeout: 60000,
          lazyConnect: true,
          // Additional options for Redis Cloud
          tls: url.protocol === 'rediss:' ? {} : undefined,
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
        // Don't throw here, let the connection attempt handle it
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

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
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
