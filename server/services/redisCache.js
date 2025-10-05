import redisClient from '../config/redis.js';

class RedisCacheService {
  // Project caching
  async cacheProject(projectId, projectData, ttl = 3600) {
    const key = `project:${projectId}`;
    return await redisClient.set(key, projectData, ttl);
  }

  async getCachedProject(projectId) {
    const key = `project:${projectId}`;
    return await redisClient.get(key);
  }

  async invalidateProject(projectId) {
    const key = `project:${projectId}`;
    return await redisClient.del(key);
  }

  // User projects list caching
  async cacheUserProjects(userId, projects, ttl = 1800) {
    const key = `user_projects:${userId}`;
    return await redisClient.set(key, projects, ttl);
  }

  async getCachedUserProjects(userId) {
    const key = `user_projects:${userId}`;
    return await redisClient.get(key);
  }

  async invalidateUserProjects(userId) {
    const key = `user_projects:${userId}`;
    return await redisClient.del(key);
  }

  // Prompt caching
  async cachePrompts(projectId, prompts, ttl = 1800) {
    const key = `prompts:${projectId}`;
    return await redisClient.set(key, prompts, ttl);
  }

  async getCachedPrompts(projectId) {
    const key = `prompts:${projectId}`;
    return await redisClient.get(key);
  }

  async invalidatePrompts(projectId) {
    const key = `prompts:${projectId}`;
    return await redisClient.del(key);
  }

  // Chat session caching
  async cacheChatSession(sessionId, messages, ttl = 7200) {
    const key = `chat_session:${sessionId}`;
    // Store messages as a list
    for (const message of messages) {
      await redisClient.lpush(key, message);
    }
    await redisClient.expire(key, ttl);
    return true;
  }

  async getCachedChatSession(sessionId, limit = 50) {
    const key = `chat_session:${sessionId}`;
    const messages = await redisClient.lrange(key, 0, limit - 1);
    return messages.reverse(); // Redis lists are FIFO, reverse to get chronological order
  }

  async addMessageToSession(sessionId, message, ttl = 7200) {
    const key = `chat_session:${sessionId}`;
    await redisClient.lpush(key, message);
    await redisClient.expire(key, ttl);
    
    // Keep only last 100 messages to prevent memory issues
    await redisClient.ltrim(key, 0, 99);
    return true;
  }

  async clearChatSession(sessionId) {
    const key = `chat_session:${sessionId}`;
    return await redisClient.del(key);
  }

  // User session data
  async cacheUserSession(userId, sessionData, ttl = 3600) {
    const key = `user_session:${userId}`;
    return await redisClient.set(key, sessionData, ttl);
  }

  async getCachedUserSession(userId) {
    const key = `user_session:${userId}`;
    return await redisClient.get(key);
  }

  async updateUserSession(userId, updates, ttl = 3600) {
    const key = `user_session:${userId}`;
    const existing = await redisClient.get(key);
    
    if (existing) {
      const updated = { ...existing, ...updates };
      return await redisClient.set(key, updated, ttl);
    }
    
    return await redisClient.set(key, updates, ttl);
  }

  // API response caching with enhanced features
  async cacheApiResponse(endpoint, params, response, ttl = 300) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await redisClient.set(key, response, ttl);
  }

  async getCachedApiResponse(endpoint, params) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await redisClient.get(key);
  }

  // Enhanced API response caching with metadata
  async cacheApiResponseWithMetadata(key, response, metadata = {}, ttl = 300) {
    const cacheData = {
      data: response,
      metadata: {
        timestamp: Date.now(),
        ttl,
        ...metadata
      }
    };
    return await redisClient.set(key, cacheData, ttl);
  }

  async getCachedApiResponseWithMetadata(key) {
    return await redisClient.get(key);
  }

  // Cache invalidation by pattern
  async invalidateCacheByPattern(pattern) {
    try {
      const client = redisClient.getClient();
      // Note: In production, you'd use SCAN to find matching keys
      // For now, we'll handle specific patterns
      const patterns = [
        `api:user_projects:*`,
        `api:project:*`,
        `api:prompts:*`,
        `api:user_profile:*`
      ];
      
      for (const p of patterns) {
        if (pattern === 'all' || p.includes(pattern)) {
          // This is a simplified version - in production you'd use SCAN
          console.log(`Would invalidate pattern: ${p}`);
        }
      }
      return true;
    } catch (error) {
      console.error('Pattern invalidation error:', error);
      return false;
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    try {
      console.log('Warming cache...');
      // This would pre-populate frequently accessed data
      // Implementation depends on your specific needs
      return true;
    } catch (error) {
      console.error('Cache warming error:', error);
      return false;
    }
  }

  // Cache invalidation patterns
  async invalidateUserCache(userId) {
    const patterns = [
      `user_projects:${userId}`,
      `user_session:${userId}`,
      `chat_session:*` // This would need to be more specific in production
    ];
    
    for (const pattern of patterns) {
      // Note: In production, you'd use SCAN to find matching keys
      // For now, we'll handle specific keys
      if (pattern.includes('*')) {
        // Skip wildcard patterns for now
        continue;
      }
      await redisClient.del(pattern);
    }
  }

  // Health check
  async isHealthy() {
    try {
      await this.set('health_check', 'ok', 10);
      const result = await this.get('health_check');
      await this.del('health_check');
      return result === 'ok';
    } catch (error) {
      return false;
    }
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const client = redisClient.getClient();
      const info = await client.info('memory');
      const keyspace = await client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redisClient.isConnected
      };
    } catch (error) {
      return {
        error: error.message,
        connected: false
      };
    }
  }
}

export default new RedisCacheService();
