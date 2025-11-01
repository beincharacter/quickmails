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
const PORT = process.env.PORT || 3001;

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
    // Check Redis connection first
    console.log('🔍 Checking Redis connection...');
    const redisConnected = await checkRedisConnection();
    if (!redisConnected) {
      console.error('❌ Redis is not available. The email scheduler requires Redis.');
      console.error('   Please start Redis before running the server:');
      console.error('   - Local: redis-server');
      console.error('   - Docker: docker run -d -p 6379:6379 redis');
      console.error('   - Or update REDIS_HOST and REDIS_PORT in your .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔍 Connecting to MongoDB...');
    await connectDB();

    // Initialize email scheduler
    console.log('🔍 Initializing email scheduler...');
    await initializeScheduler();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 Email Sender SaaS Server Started Successfully!');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`📧 Email Queue: Ready`);
      console.log(`💾 Database: Connected`);
      console.log(`🔄 Redis: Connected`);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error: any) {
    console.error('');
    console.error('❌ Failed to start server:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('   1. Ensure MongoDB is running');
    console.error('   2. Ensure Redis is running');
    console.error('   3. Check your .env file configuration');
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

