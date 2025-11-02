# Redis Job Queue Commands

Commands to check and inspect jobs in Redis/BullMQ queues.

## Using Makefile

### Check default queue (email-sending):
```bash
make check-jobs
```

### Check specific queue:
```bash
make check-jobs-queue QUEUE=email-sending
```

### Check specific job details:
```bash
make check-job JOB_ID=34
# Or specify queue:
make check-job QUEUE=email-sending JOB_ID=34
```

## Using Node.js directly

### Check default queue:
```bash
cd server && node scripts/check-redis-jobs.mjs
```

### Check specific queue:
```bash
cd server && node scripts/check-redis-jobs.mjs email-sending
```

### Check specific job details:
```bash
cd server && node scripts/check-redis-jobs.mjs email-sending 34
```

## Using Redis CLI directly

### Connect to Redis:
```bash
redis-cli
# Or if password required:
redis-cli -a YOUR_PASSWORD
# Or with host/port:
redis-cli -h localhost -p 6379
```

### List all queue keys:
```bash
redis-cli KEYS "bull:*"
```

### Check queue statistics:
```bash
# List all keys for a queue
redis-cli KEYS "bull:email-sending:*"

# Check waiting jobs count
redis-cli GET "bull:email-sending:wait"

# Check active jobs count
redis-cli GET "bull:email-sending:active"

# Check delayed jobs count
redis-cli GET "bull:email-sending:delayed"

# Check completed jobs count
redis-cli GET "bull:email-sending:completed"

# Check failed jobs count
redis-cli GET "bull:email-sending:failed"
```

### Inspect a specific job:
```bash
# Get job data (replace JOB_ID with actual job ID)
redis-cli HGETALL "bull:email-sending:JOB_ID"
```

### Monitor queue activity:
```bash
# Monitor all Redis commands in real-time
redis-cli MONITOR

# Watch for specific queue activity
redis-cli MONITOR | grep "email-sending"
```

### Clear queue (use with caution):
```bash
# Delete all keys for a queue (removes all jobs)
redis-cli --eval "return redis.call('del', unpack(redis.call('keys', 'bull:email-sending:*')))" 0
```

## What the script shows:

✅ **Queue Statistics:**
- Waiting jobs count
- Active jobs count
- Delayed jobs count
- Completed jobs count
- Failed jobs count
- Total jobs

✅ **Job Details:**
- Job IDs
- Job names
- Job data (first 100 chars)
- Timestamps (scheduled, started, completed)
- Error messages (for failed jobs)

✅ **Available Queues:**
- Lists all queues found in Redis
- Shows queue names

## Queue Name

The default queue name is **`email-sending`** (as defined in `server/services/scheduler.ts`).

## Examples

### Check email queue:
```bash
make check-jobs
```

### Check with custom queue name:
```bash
node scripts/check-redis-jobs.js my-queue-name
```

### Monitor Redis activity:
```bash
redis-cli MONITOR | grep "bull:email-sending"
```

### Check job count:
```bash
redis-cli GET "bull:email-sending:wait"
```

