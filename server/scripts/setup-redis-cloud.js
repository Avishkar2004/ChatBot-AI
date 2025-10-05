#!/usr/bin/env node

/**
 * Redis Cloud Setup Script
 * This script helps set up Redis Cloud for the Chatbot AI application
 */

import redisClient from '../config/redis.js';
import 'dotenv/config';

const setupRedisCloud = async () => {
  try {
    console.log('☁️  Setting up Redis Cloud for Chatbot AI...\n');
    
    // Display connection details
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const url = new URL(redisUrl);
      console.log('🔗 Redis Cloud Connection Details:');
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port}`);
      console.log(`   Username: ${url.username}`);
      console.log(`   Password: ${url.password ? '***' : 'None'}`);
      console.log(`   Protocol: ${url.protocol}`);
      console.log('');
    }
    
    // Connect to Redis Cloud
    await redisClient.connect();
    console.log('✅ Connected to Redis Cloud successfully\n');
    
    // Test basic operations
    console.log('🧪 Testing Redis Cloud operations...');
    
    // Test SET/GET
    await redisClient.set('test:cloud:setup', 'Redis Cloud is working!', 10);
    const testValue = await redisClient.get('test:cloud:setup');
    console.log('✅ SET/GET operations working');
    
    // Test Hash operations
    await redisClient.hset('test:cloud:hash', 'field1', { message: 'Hash operations working in cloud' });
    const hashValue = await redisClient.hget('test:cloud:hash', 'field1');
    console.log('✅ Hash operations working');
    
    // Test List operations
    await redisClient.lpush('test:cloud:list', { message: 'List operations working in cloud' });
    const listValue = await redisClient.lrange('test:cloud:list', 0, -1);
    console.log('✅ List operations working');
    
    // Test API response caching
    await redisClient.set('api:test:response', {
      data: { message: 'API caching working in cloud' },
      timestamp: Date.now(),
      ttl: 300
    }, 300);
    const apiCache = await redisClient.get('api:test:response');
    console.log('✅ API response caching working');
    
    // Clean up test data
    await redisClient.del('test:cloud:setup');
    await redisClient.del('test:cloud:hash');
    await redisClient.del('test:cloud:list');
    await redisClient.del('api:test:response');
    
    console.log('\n🎉 Redis Cloud setup completed successfully!');
    console.log('\n📋 Redis Cloud Configuration:');
    console.log(`   URL: ${process.env.REDIS_URL}`);
    console.log(`   Password: ${process.env.REDIS_PASSWORD ? '***' : 'None'}`);
    
    console.log('\n🚀 Your application is ready to use Redis Cloud caching!');
    console.log('\n💡 Performance benefits you\'ll get:');
    console.log('   • Faster API responses (cached data)');
    console.log('   • Reduced database load');
    console.log('   • Better user experience');
    console.log('   • Session management');
    console.log('   • Rate limiting');
    console.log('   • Chat history caching');
    console.log('   • Global scalability with Redis Cloud');
    
    console.log('\n🌐 Redis Cloud Features:');
    console.log('   • High availability');
    console.log('   • Automatic backups');
    console.log('   • Global deployment');
    console.log('   • Monitoring and alerts');
    console.log('   • SSL/TLS encryption');
    
  } catch (error) {
    console.error('❌ Redis Cloud setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your REDIS_URL in .env file');
    console.log('   2. Verify Redis Cloud credentials');
    console.log('   3. Ensure Redis Cloud instance is running');
    console.log('   4. Check network connectivity');
    console.log('   5. Verify firewall settings');
    
    console.log('\n📞 Redis Cloud Support:');
    console.log('   • Check Redis Cloud dashboard');
    console.log('   • Verify instance status');
    console.log('   • Check connection limits');
    console.log('   • Review security groups');
    
    process.exit(1);
  } finally {
    await redisClient.disconnect();
  }
};

// Run setup
setupRedisCloud();
