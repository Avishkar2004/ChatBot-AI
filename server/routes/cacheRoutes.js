import { Router } from "express";
import requireAuth from "../middleware/auth.js";
import redisCache from "../services/redisCache.js";
import redisClient from "../config/redis.js";

const router = Router();

// All cache routes require authentication
router.use(requireAuth);

// Get cache statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await redisCache.getCacheStats();
    res.json({
      cache: stats,
      timestamp: new Date().toISOString(),
      status: "OK"
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get cache statistics',
      error: error.message 
    });
  }
});

// Clear user's cache
router.delete("/user", async (req, res) => {
  try {
    const userId = req.user.id;
    await redisCache.invalidateUserCache(userId);
    
    res.json({ 
      message: 'User cache cleared successfully',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear user cache error:', error);
    res.status(500).json({ 
      message: 'Failed to clear user cache',
      error: error.message 
    });
  }
});

// Clear specific cache by pattern
router.delete("/pattern/:pattern", async (req, res) => {
  try {
    const { pattern } = req.params;
    await redisCache.invalidateCacheByPattern(pattern);
    
    res.json({ 
      message: `Cache pattern '${pattern}' cleared successfully`,
      pattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache pattern error:', error);
    res.status(500).json({ 
      message: 'Failed to clear cache pattern',
      error: error.message 
    });
  }
});

// Clear all cache (admin only - be careful!)
router.delete("/all", async (req, res) => {
  try {
    // In production, you'd want additional admin checks here
    const client = redisClient.getClient();
    await client.flushAll();
    
    res.json({ 
      message: 'All cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear all cache error:', error);
    res.status(500).json({ 
      message: 'Failed to clear all cache',
      error: error.message 
    });
  }
});

// Warm cache for current user
router.post("/warm", async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would pre-populate frequently accessed data for the user
    // Implementation depends on your specific needs
    await redisCache.warmCache();
    
    res.json({ 
      message: 'Cache warmed successfully',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Warm cache error:', error);
    res.status(500).json({ 
      message: 'Failed to warm cache',
      error: error.message 
    });
  }
});

// Get cache health status
router.get("/health", async (req, res) => {
  try {
    let isHealthy = false;
    try {
      // Test Redis with a simple operation
      await redisCache.set('health:check', 'ok', 5);
      const result = await redisCache.get('health:check');
      await redisCache.del('health:check');
      isHealthy = result === 'ok';
    } catch (error) {
      isHealthy = false;
    }
    
    const stats = await redisCache.getCacheStats();
    
    res.json({
      healthy: isHealthy,
      connected: redisClient.isConnected,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache health check error:', error);
    res.status(500).json({ 
      message: 'Cache health check failed',
      error: error.message 
    });
  }
});

export default router;
