#!/usr/bin/env node

/**
 * Dependency Check Script
 * Validates that all required services are available before starting the application
 */

import { execSync } from 'child_process';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  console.log('⚠️  mongoose not installed yet');
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkMongoConnection(uri) {
  return new Promise((resolve) => {
    if (!mongoose) {
      resolve(false);
      return;
    }
    mongoose.connect(uri)
      .then(() => {
        mongoose.connection.close();
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

function checkRedisConnection(host, port) {
  return new Promise((resolve) => {
    try {
      const Redis = require('ioredis');
      const redis = new Redis({ host, port, lazyConnect: true });
      
      redis.connect()
        .then(() => {
          redis.quit();
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  console.log(`${BLUE}🔍 Checking dependencies...${RESET}\n`);

  const checks = {
    nodejs: checkCommand('node', 'Node.js'),
    npm: checkCommand('npm', 'npm'),
    mongodb: false,
    redis: false,
  };

  // Check Node.js version
  if (checks.nodejs) {
    try {
      const version = execSync('node --version', { encoding: 'utf-8' }).trim();
      console.log(`${GREEN}✅ Node.js${RESET} - ${version}`);
    } catch {
      console.log(`${RED}❌ Node.js${RESET} - Not found`);
    }
  } else {
    console.log(`${RED}❌ Node.js${RESET} - Not found`);
  }

  // Check npm
  if (checks.npm) {
    try {
      const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
      console.log(`${GREEN}✅ npm${RESET} - ${version}`);
    } catch {
      console.log(`${RED}❌ npm${RESET} - Not found`);
    }
  } else {
    console.log(`${RED}❌ npm${RESET} - Not found`);
  }

  // Check MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-sender';
  console.log(`\n${BLUE}Checking MongoDB connection: ${mongoUri}${RESET}`);
  
  try {
    checks.mongodb = await checkMongoConnection(mongoUri);
    if (checks.mongodb) {
      console.log(`${GREEN}✅ MongoDB${RESET} - Connected`);
    } else {
      console.log(`${RED}❌ MongoDB${RESET} - Connection failed`);
      console.log(`   Run: ${YELLOW}mongod${RESET} or start your MongoDB service`);
    }
  } catch (error) {
    console.log(`${RED}❌ MongoDB${RESET} - Error: ${error.message}`);
  }

  // Check Redis
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');
  console.log(`\n${BLUE}Checking Redis connection: ${redisHost}:${redisPort}${RESET}`);
  
  try {
    checks.redis = await checkRedisConnection(redisHost, redisPort);
    if (checks.redis) {
      console.log(`${GREEN}✅ Redis${RESET} - Connected`);
    } else {
      console.log(`${RED}❌ Redis${RESET} - Connection failed`);
      console.log(`   Run: ${YELLOW}redis-server${RESET} or start your Redis service`);
    }
  } catch (error) {
    console.log(`${RED}❌ Redis${RESET} - Error: ${error.message}`);
  }

  // Summary
  console.log(`\n${BLUE}════════════════════════════════════════${RESET}`);
  const allPassed = Object.values(checks).every(Boolean);
  if (allPassed) {
    console.log(`${GREEN}✅ All dependencies are available!${RESET}`);
    console.log(`   You can now start the server with: ${YELLOW}npm run dev:server${RESET}`);
  } else {
    console.log(`${RED}⚠️  Some dependencies are missing or unavailable${RESET}`);
    console.log(`   Please install/start the missing services before continuing`);
  }
  console.log(`${BLUE}════════════════════════════════════════${RESET}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error(`${RED}Error running dependency check:${RESET}`, error);
  process.exit(1);
});

