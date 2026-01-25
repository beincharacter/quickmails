import Redis from 'ioredis';

let redisClient: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // Check if Redis is configured
  const hasRedisConfig = !!(process.env.REDIS_URL || process.env.REDIS_HOST);
  
  if (!hasRedisConfig) {
    throw new Error('Redis not configured. Set REDIS_URL or REDIS_HOST environment variable.');
  }

  // Support REDIS_URL format (e.g., from Upstash: redis://default:password@host:port)
  const commonOptions = {
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      // Stop retrying after 5 attempts to prevent log spam
      if (times > 5) {
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
    enableOfflineQueue: false, // Don't queue commands when disconnected
    connectTimeout: 5000, // 5 second timeout
  };

  let redis: Redis;
  
  if (process.env.REDIS_URL) {
    // ioredis can parse REDIS_URL directly
    redis = new Redis(process.env.REDIS_URL, commonOptions);
  } else {
    // Use individual config (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
    redis = new Redis({
      ...commonOptions,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // Track if we've logged the initial error to prevent spam
  let hasLoggedError = false;

  // Handle connection events
  redis.on('connect', () => {
    console.log('✅ Redis: Connecting...');
    hasLoggedError = false; // Reset on successful connection
  });

  redis.on('ready', () => {
    console.log('✅ Redis: Connected and ready');
    hasLoggedError = false;
  });

  redis.on('error', (error) => {
    // Only log error once to prevent spam
    if (!hasLoggedError) {
      console.error('❌ Redis connection error:', error.message);
      hasLoggedError = true;
    }
  });

  redis.on('close', () => {
    // Only log close once to prevent spam
    if (!hasLoggedError) {
      console.log('⚠️ Redis: Connection closed');
    }
  });

  try {
    await redis.connect();
    redisClient = redis;
    return redis;
  } catch (error: any) {
    console.error('❌ Failed to connect to Redis:', error.message);
    throw new Error(
      `Redis connection failed: ${error.message}. Please ensure Redis is running at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
    );
  }
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const redis = await connectRedis();
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    return false;
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

