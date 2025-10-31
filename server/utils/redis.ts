import Redis from 'ioredis';

let redisClient: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  // Handle connection events
  redis.on('connect', () => {
    console.log('✅ Redis: Connecting...');
  });

  redis.on('ready', () => {
    console.log('✅ Redis: Connected and ready');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message);
  });

  redis.on('close', () => {
    console.log('⚠️ Redis: Connection closed');
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

