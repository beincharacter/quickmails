import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import datasetRoutes from './routes/datasets.js';
import templateRoutes from './routes/templates.js';
import campaignRoutes from './routes/campaigns.js';
import emailRoutes from './routes/emails.js';
import dashboardRoutes from './routes/dashboard.js';
import { authMiddleware } from './middleware/auth.js';
import { initializeScheduler, closeScheduler, getEmailWorker } from './services/scheduler.js';
import { checkRedisConnection } from './utils/redis.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module (server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (parent of server/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/datasets', authMiddleware, datasetRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/emails', authMiddleware, emailRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Startup validation and initialization
async function startServer() {
  try {
    // Connect to MongoDB first (required)
    console.log('🔍 Connecting to MongoDB...');
    await connectDB();

    // Check Redis connection (optional - server can run without it, but email sending won't work)
    console.log('🔍 Checking Redis connection...');
    let redisConnected = false;
    let schedulerInitialized = false;
    
    // Only attempt Redis connection if configured
    const hasRedisConfig = !!(process.env.REDIS_URL || process.env.REDIS_HOST);
    
    if (hasRedisConfig) {
      try {
        redisConnected = await checkRedisConnection();
        if (redisConnected) {
          // Initialize email scheduler
          console.log('🔍 Initializing email scheduler...');
          await initializeScheduler();
          schedulerInitialized = true;
        } else {
          console.warn('⚠️  Redis is not available. Email scheduling will be disabled.');
          console.warn('   To enable email sending, configure Redis:');
          console.warn('   - Set REDIS_URL (for Upstash: redis://default:password@host:port)');
          console.warn('   - Or set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD');
        }
      } catch (redisError: any) {
        // Only log once, then suppress further errors
        console.warn('⚠️  Redis connection failed:', redisError.message);
        console.warn('   Server will start without email scheduling capabilities.');
        console.warn('   Configure Redis to enable email sending functionality.');
        console.warn('   (Redis connection errors will be suppressed to reduce log noise)');
      }
    } else {
      console.warn('⚠️  Redis not configured. Email scheduling will be disabled.');
      console.warn('   To enable email sending, set REDIS_URL or REDIS_HOST environment variable.');
    }

    // Start HTTP server (always bind to PORT, even if Redis fails)
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 Email Sender SaaS Server Started Successfully!');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 Server: http://0.0.0.0:${PORT}`);
      console.log(`💾 Database: Connected`);
      if (schedulerInitialized) {
        console.log(`📧 Email Queue: Ready`);
        console.log(`🔄 Redis: Connected`);
      } else {
        console.log(`📧 Email Queue: Disabled (Redis not available)`);
        console.log(`🔄 Redis: Not connected`);
      }
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error: any) {
    console.error('');
    console.error('❌ Failed to start server:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('   1. Ensure MongoDB is running and MONGODB_URI is correct');
    console.error('   2. Redis is optional but required for email sending');
    console.error('   3. Check your environment variables');
    console.error('');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('');
  console.log('🛑 Shutting down server gracefully...');
  
  const emailWorker = getEmailWorker();
  if (emailWorker) {
    await closeScheduler();
  }
  
  console.log('✅ Server shut down complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

