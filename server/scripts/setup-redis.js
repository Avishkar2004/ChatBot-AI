#!/usr/bin/env node

/**
 * Redis Setup Script
 * This script helps set up Redis for the Chatbot AI application
 */

import redisClient from '../config/redis.js';
import 'dotenv/config';

const setupRedis = async () => {
  try {
    console.log('🔧 Setting up Redis for Chatbot AI...\n');
    
    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Connected to Redis successfully\n');
    
    // Test basic operations
    console.log('🧪 Testing Redis operations...');
    
    // Test SET/GET
    await redisClient.set('test:setup', 'Redis is working!', 10);
    const testValue = await redisClient.get('test:setup');
    console.log('✅ SET/GET operations working');
    
    // Test Hash operations
    await redisClient.hset('test:hash', 'field1', { message: 'Hash operations working' });
    const hashValue = await redisClient.hget('test:hash', 'field1');
    console.log('✅ Hash operations working');
    
    // Test List operations
    await redisClient.lpush('test:list', { message: 'List operations working' });
    const listValue = await redisClient.lrange('test:list', 0, -1);
    console.log('✅ List operations working');
    
    // Clean up test data
    await redisClient.del('test:setup');
    await redisClient.del('test:hash');
    await redisClient.del('test:list');
    
    console.log('\n🎉 Redis setup completed successfully!');
    console.log('\n📋 Redis Configuration:');
    console.log(`   URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    console.log(`   Password: ${process.env.REDIS_PASSWORD ? '***' : 'None'}`);
    
    console.log('\n🚀 Your application is ready to use Redis caching!');
    console.log('\n💡 Performance benefits you\'ll get:');
    console.log('   • Faster API responses (cached data)');
    console.log('   • Reduced database load');
    console.log('   • Better user experience');
    console.log('   • Session management');
    console.log('   • Rate limiting');
    console.log('   • Chat history caching');
    
  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Redis is installed and running');
    console.log('   2. Check your REDIS_URL in .env file');
    console.log('   3. Verify Redis server is accessible');
    console.log('   4. Check firewall settings if using remote Redis');
    
    process.exit(1);
  } finally {
    await redisClient.disconnect();
  }
};

// Run setup
setupRedis();
