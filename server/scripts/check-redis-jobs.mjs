#!/usr/bin/env node

/**
 * Script to check jobs in Redis/BullMQ queues
 * Usage: node scripts/check-redis-jobs.js [queue-name]
 */

import Redis from 'ioredis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (../../.env from server/scripts/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Default queue name (from scheduler.ts)
const DEFAULT_QUEUE_NAME = 'email-sending';

async function checkRedisConnection() {
  const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  });

  try {
    await redis.ping();
    console.log('✅ Redis connection successful');
    return redis;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    process.exit(1);
  }
}

async function checkQueueJobs(queueName) {
  console.log(`\n📊 Checking queue: ${queueName}\n`);
  console.log('═'.repeat(60));

  const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  };

  const queue = new Queue(queueName, { connection });

  try {
    // Get queue counts
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    const delayed = await queue.getDelayedCount();

    console.log('\n📈 Queue Statistics:');
    console.log('─'.repeat(60));
    console.log(`  Waiting:    ${waiting}`);
    console.log(`  Active:     ${active}`);
    console.log(`  Delayed:    ${delayed}`);
    console.log(`  Completed:  ${completed}`);
    console.log(`  Failed:     ${failed}`);
    console.log(`  Total:      ${waiting + active + delayed + completed + failed}`);

    // Show waiting jobs
    if (waiting > 0) {
      console.log('\n⏳ Waiting Jobs:');
      console.log('─'.repeat(60));
      const waitingJobs = await queue.getWaiting();
      waitingJobs.slice(0, 10).forEach((job, idx) => {
        console.log(`  ${idx + 1}. Job ${job.id} - ${job.name}`);
        console.log(`     Data: ${JSON.stringify(job.data).substring(0, 100)}...`);
        console.log(`     View: cd server && node scripts/check-redis-jobs.mjs ${queueName} ${job.id}`);
      });
      if (waitingJobs.length > 10) {
        console.log(`  ... and ${waitingJobs.length - 10} more`);
      }
    }

    // Show active jobs
    if (active > 0) {
      console.log('\n🔄 Active Jobs:');
      console.log('─'.repeat(60));
      const activeJobs = await queue.getActive();
      activeJobs.slice(0, 10).forEach((job, idx) => {
        console.log(`  ${idx + 1}. Job ${job.id} - ${job.name}`);
        console.log(`     Started: ${new Date(job.processedOn || Date.now()).toLocaleString()}`);
        console.log(`     Data: ${JSON.stringify(job.data).substring(0, 100)}...`);
        console.log(`     View: cd server && node scripts/check-redis-jobs.mjs ${queueName} ${job.id}`);
      });
      if (activeJobs.length > 10) {
        console.log(`  ... and ${activeJobs.length - 10} more`);
      }
    }

    // Show delayed jobs
    if (delayed > 0) {
      console.log('\n⏰ Delayed Jobs:');
      console.log('─'.repeat(60));
      const delayedJobs = await queue.getDelayed();
      delayedJobs.slice(0, 10).forEach((job, idx) => {
        const delayMs = job.opts.delay || 0;
        const scheduledTime = new Date(Date.now() + delayMs);
        console.log(`  ${idx + 1}. Job ${job.id} - ${job.name}`);
        console.log(`     Scheduled: ${scheduledTime.toLocaleString()}`);
        console.log(`     Delay: ${Math.round(delayMs / 1000)}s`);
        console.log(`     Data: ${JSON.stringify(job.data).substring(0, 100)}...`);
      });
      if (delayedJobs.length > 10) {
        console.log(`  ... and ${delayedJobs.length - 10} more`);
      }
    }

    // Show failed jobs
    if (failed > 0) {
      console.log('\n❌ Failed Jobs:');
      console.log('─'.repeat(60));
      const failedJobs = await queue.getFailed();
      failedJobs.slice(0, 10).forEach((job, idx) => {
        console.log(`  ${idx + 1}. Job ${job.id} - ${job.name}`);
        console.log(`     Failed: ${new Date(job.failedReason ? Date.now() : job.processedOn || Date.now()).toLocaleString()}`);
        console.log(`     Error: ${job.failedReason?.substring(0, 100) || 'Unknown'}`);
        console.log(`     View: cd server && node scripts/check-redis-jobs.mjs ${queueName} ${job.id}`);
      });
      if (failedJobs.length > 10) {
        console.log(`  ... and ${failedJobs.length - 10} more`);
      }
    }

    // Show recent completed jobs
    if (completed > 0) {
      console.log('\n✅ Recent Completed Jobs:');
      console.log('─'.repeat(60));
      const completedJobs = await queue.getCompleted();
      completedJobs.slice(0, 5).forEach((job, idx) => {
        console.log(`  ${idx + 1}. Job ${job.id} - ${job.name}`);
        console.log(`     Completed: ${new Date(job.finishedOn || Date.now()).toLocaleString()}`);
      });
      if (completedJobs.length > 5) {
        console.log(`  ... and ${completedJobs.length - 5} more`);
      }
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    await queue.close();
  } catch (error) {
    console.error('❌ Error checking queue:', error.message);
    await queue.close();
    process.exit(1);
  }
}

async function listAllQueues(redis) {
  console.log('\n📋 Available Queues in Redis:\n');
  console.log('─'.repeat(60));

  try {
    // BullMQ uses keys like "bull:queue-name:*"
    const keys = await redis.keys('bull:*');
    const queueNames = new Set();

    keys.forEach((key) => {
      // Extract queue name from key pattern "bull:queue-name:..."
      const match = key.match(/^bull:([^:]+):/);
      if (match) {
        queueNames.add(match[1]);
      }
    });

    if (queueNames.size > 0) {
      console.log('  Queue Names:');
      Array.from(queueNames).forEach((name) => {
        console.log(`    - ${name}`);
      });
    } else {
      console.log('  No queues found');
    }

    console.log('\n' + '─'.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error listing queues:', error.message);
  }
}

async function showJobDetails(queueName, jobId) {
  console.log(`\n🔍 Job Details: ${jobId}\n`);
  console.log('═'.repeat(60));

  const connection = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  };

  const queue = new Queue(queueName, { connection });

  try {
    const job = await queue.getJob(jobId);
    
    if (!job) {
      console.log(`❌ Job ${jobId} not found in queue "${queueName}"`);
      await queue.close();
      return;
    }

    // Get job state
    const state = await job.getState();

    console.log(`\n📋 Basic Information:`);
    console.log('─'.repeat(60));
    console.log(`  Job ID:       ${job.id}`);
    console.log(`  Job Name:     ${job.name}`);
    console.log(`  State:        ${state}`);
    console.log(`  Queue:        ${queueName}`);

    if (job.opts.delay) {
      const scheduledTime = new Date(Date.now() + job.opts.delay);
      console.log(`  Scheduled:    ${scheduledTime.toLocaleString()}`);
      console.log(`  Delay:        ${Math.round(job.opts.delay / 1000)}s (${Math.round(job.opts.delay / 60000)}m)`);
    }

    if (job.processedOn) {
      console.log(`  Started:      ${new Date(job.processedOn).toLocaleString()}`);
    }

    if (job.finishedOn) {
      console.log(`  Finished:     ${new Date(job.finishedOn).toLocaleString()}`);
      const duration = job.finishedOn - (job.processedOn || job.finishedOn);
      console.log(`  Duration:     ${Math.round(duration / 1000)}s`);
    }

    if (job.failedReason) {
      console.log(`\n❌ Failure Information:`);
      console.log('─'.repeat(60));
      console.log(`  Error:        ${job.failedReason}`);
    }

    console.log(`\n📦 Job Data:`);
    console.log('─'.repeat(60));
    console.log(JSON.stringify(job.data, null, 2));

    if (job.returnvalue !== undefined && job.returnvalue !== null) {
      console.log(`\n✅ Return Value:`);
      console.log('─'.repeat(60));
      console.log(JSON.stringify(job.returnvalue, null, 2));
    }

    if (job.opts.attemptsMade !== undefined) {
      console.log(`\n🔄 Attempts:`);
      console.log('─'.repeat(60));
      console.log(`  Made:         ${job.opts.attemptsMade || 0}`);
      console.log(`  Max:          ${job.opts.attempts || 'Unlimited'}`);
    }

    if (job.progress !== undefined && job.progress !== null) {
      console.log(`\n📊 Progress:`);
      console.log('─'.repeat(60));
      console.log(`  Progress:     ${JSON.stringify(job.progress)}`);
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    await queue.close();
  } catch (error) {
    console.error('❌ Error getting job details:', error.message);
    await queue.close();
  }
}

async function main() {
  const queueName = process.argv[2] || DEFAULT_QUEUE_NAME;
  const jobId = process.argv[3];

  // If job ID is provided, show job details only
  if (jobId) {
    console.log('\n🔍 Redis Job Queue Inspector - Job Details');
    console.log('═'.repeat(60));
    console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}`);
    console.log(`Queue: ${queueName}`);
    console.log(`Job ID: ${jobId}`);

    const redis = await checkRedisConnection();
    await showJobDetails(queueName, jobId);
    await redis.quit();
    process.exit(0);
  }

  // Otherwise show queue overview
  console.log('\n🔍 Redis Job Queue Inspector');
  console.log('═'.repeat(60));
  console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}`);
  console.log(`Queue: ${queueName}`);

  const redis = await checkRedisConnection();

  // List all queues if no specific queue provided
  await listAllQueues(redis);

  // Check specific queue
  await checkQueueJobs(queueName);

  await redis.quit();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

