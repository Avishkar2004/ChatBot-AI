import redisCache from '../services/redisCache.js';
import crypto from 'crypto';

/**
 * API Response Caching Middleware
 * Provides intelligent caching for API responses with ETag support
 */

// Cache configuration for different endpoint types
const CACHE_CONFIG = {
  // User-related endpoints
  '/api/users/me': { ttl: 300, key: 'user_profile' }, // 5 minutes
  '/api/users/profile': { ttl: 300, key: 'user_profile' },
  
  // Project endpoints
  '/api/projects': { ttl: 1800, key: 'user_projects' }, // 30 minutes
  '/api/projects/:id': { ttl: 3600, key: 'project' }, // 1 hour
  
  // Prompt endpoints
  '/api/projects/:id/prompts': { ttl: 1800, key: 'prompts' }, // 30 minutes
  
  // Chat endpoints (limited caching)
  '/api/projects/:id/chat': { ttl: 60, key: 'chat_response' }, // 1 minute
  
  // Health and status endpoints
  '/health': { ttl: 30, key: 'health' }, // 30 seconds
};

/**
 * Generate cache key for request
 */
const generateCacheKey = (req, config) => {
  const { key } = config;
  const userId = req.user?.id || 'anonymous';
  const path = req.route?.path || req.path;
  const method = req.method;
  
  // Create a hash of the request parameters
  const params = {
    query: req.query,
    params: req.params,
    body: method === 'GET' ? {} : req.body // Only include body for non-GET requests
  };
  
  const paramsHash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex')
    .substring(0, 8);
  
  return `api:${key}:${userId}:${path}:${paramsHash}`;
};

/**
 * Generate ETag for response
 */
const generateETag = (data) => {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
};

/**
 * Get cache configuration for request
 */
const getCacheConfig = (req) => {
  const path = req.route?.path || req.path;
  
  // Direct match first
  if (CACHE_CONFIG[path]) {
    return CACHE_CONFIG[path];
  }
  
  // Pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(CACHE_CONFIG)) {
    if (pattern.includes(':')) {
      const regex = new RegExp(pattern.replace(/:[^/]+/g, '[^/]+'));
      if (regex.test(path)) {
        return config;
      }
    }
  }
  
  return null;
};

/**
 * Main API caching middleware
 */
export const apiCache = (options = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    skipCache = false,
    skipIf = null,
    keyGenerator = null
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && !options.allowPost) {
      return next();
    }

    // Skip if explicitly disabled
    if (skipCache) {
      return next();
    }

    // Skip if condition is met
    if (skipIf && skipIf(req)) {
      return next();
    }

    try {
      // Get cache configuration
      const config = getCacheConfig(req) || { ttl, key: 'default' };
      const cacheTTL = config.ttl || ttl;
      
      // Generate cache key
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        cacheKey = generateCacheKey(req, config);
      }

      // Check for ETag in request
      const clientETag = req.headers['if-none-match'];
      
      // Try to get cached response
      const cachedResponse = await redisCache.getCachedApiResponse('response', { key: cacheKey });
      
      if (cachedResponse) {
        const { data, etag, timestamp } = cachedResponse;
        
        // Check if client has the same version (ETag match)
        if (clientETag && clientETag === etag) {
          return res.status(304).end(); // Not Modified
        }
        
        // Return cached response with headers
        if (!res.headersSent) {
          res.set({
            'Cache-Control': `public, max-age=${Math.floor(cacheTTL / 2)}`,
            'ETag': etag,
            'X-Cache': 'HIT',
            'X-Cache-Timestamp': new Date(timestamp).toISOString()
          });
        }
        
        return res.json(data);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      let responseData = null;

      res.json = function(data) {
        responseData = data;
        
        // Set cache headers before sending response
        if (res.statusCode === 200 && !res.headersSent) {
          try {
            const etag = generateETag(data);
            res.set({
              'Cache-Control': `public, max-age=${Math.floor(cacheTTL / 2)}`,
              'ETag': etag,
              'X-Cache': 'MISS'
            });
          } catch (error) {
            console.error('Cache header error:', error);
          }
        }
        
        return originalJson(data);
      };

      // Continue to route handler
      res.on('finish', async () => {
        if (responseData && res.statusCode === 200) {
          try {
            const etag = generateETag(responseData);
            const cacheData = {
              data: responseData,
              etag,
              timestamp: Date.now()
            };
            
            await redisCache.cacheApiResponse('response', { key: cacheKey }, cacheData, cacheTTL);
          } catch (error) {
            console.error('Cache storage error:', error);
          }
        }
      });

      next();
    } catch (error) {
      console.error('API Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Invalidate cache after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCachePatterns(req, patterns).catch(console.error);
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Invalidate cache patterns
 */
const invalidateCachePatterns = async (req, patterns) => {
  const userId = req.user?.id;
  
  for (const pattern of patterns) {
    try {
      if (pattern === 'user_projects' && userId) {
        await redisCache.invalidateUserProjects(userId);
      } else if (pattern === 'user_profile' && userId) {
        await redisCache.invalidateUserCache(userId);
      } else if (pattern.startsWith('project:')) {
        const projectId = pattern.split(':')[1] || req.params.projectId;
        if (projectId) {
          await redisCache.invalidateProject(projectId);
        }
      } else if (pattern.startsWith('prompts:')) {
        const projectId = pattern.split(':')[1] || req.params.projectId;
        if (projectId) {
          await redisCache.invalidatePrompts(projectId);
        }
      }
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }
};

/**
 * Cache warming middleware
 */
export const warmCache = (endpoints = []) => {
  return async (req, res, next) => {
    // This would typically be called during application startup
    // or periodically to pre-populate cache
    next();
  };
};

/**
 * Cache statistics middleware
 */
export const cacheStats = async (req, res, next) => {
  if (req.path === '/api/cache/stats') {
    try {
      const stats = await redisCache.getCacheStats();
      return res.json({
        cache: stats,
        config: CACHE_CONFIG,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get cache stats' });
    }
  }
  next();
};

/**
 * Conditional caching based on user role or other factors
 */
export const conditionalCache = (condition) => {
  return (req, res, next) => {
    if (condition(req)) {
      return apiCache()(req, res, next);
    }
    return next();
  };
};

/**
 * Cache with custom TTL based on data type
 */
export const smartCache = (ttlMap = {}) => {
  return apiCache({
    ttl: (req) => {
      const path = req.route?.path || req.path;
      return ttlMap[path] || 300;
    }
  });
};
