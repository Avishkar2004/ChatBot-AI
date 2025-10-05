#!/usr/bin/env node

/**
 * Connection Test Script
 * Tests all connections (MongoDB, Redis) before starting the server
 */

import mongoose from 'mongoose';
import redisClient from '../config/redis.js';
import 'dotenv/config';

const testConnections = async () => {
  console.log('🧪 Testing all connections...\n');
  
  let mongoConnected = false;
  let redisConnected = false;
  
  try {
    // Test MongoDB connection
    console.log('📊 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
  
  try {
    // Test Redis connection
    console.log('🔴 Testing Redis Cloud connection...');
    await redisClient.connect();
    
    // Test Redis operations
    await redisClient.set('test:connection', 'success', 10);
    const result = await redisClient.get('test:connection');
    await redisClient.del('test:connection');
    
    if (result === 'success') {
      console.log('✅ Redis Cloud connected and working');
      redisConnected = true;
    } else {
      console.log('⚠️  Redis connected but operations failed');
    }
  } catch (error) {
    console.error('❌ Redis Cloud connection failed:', error.message);
  }
  
  // Summary
  console.log('\n📋 Connection Summary:');
  console.log(`   MongoDB: ${mongoConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Redis Cloud: ${redisConnected ? '✅ Connected' : '❌ Failed'}`);
  
  if (mongoConnected && redisConnected) {
    console.log('\n🎉 All connections successful! Server is ready to start.');
    return true;
  } else {
    console.log('\n⚠️  Some connections failed. Check your configuration.');
    return false;
  }
};

// Run connection tests
testConnections()
  .then((success) => {
    if (success) {
      console.log('\n✅ You can now start your server with: npm run dev');
    } else {
      console.log('\n❌ Fix connection issues before starting the server.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Clean up connections
    try {
      await mongoose.disconnect();
      await redisClient.disconnect();
    } catch (error) {
      // Ignore cleanup errors
    }
  });
