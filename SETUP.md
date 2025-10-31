# Setup Guide - Important Notes

This guide covers the important setup steps to ensure the application runs correctly.

## Prerequisites Check

Before starting the server, ensure all dependencies are available:

```bash
npm run check-deps
```

This will check:
- ✅ Node.js installation
- ✅ npm installation
- ✅ MongoDB connection
- ✅ Redis connection

## Important Setup Steps

### 1. Install Dependencies

```bash
npm install
```

**Note:** The TypeScript linter errors you see before running `npm install` are expected - they'll be resolved once dependencies are installed.

### 2. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Copy the connection string
- Update `MONGODB_URI` in your `.env` file

### 3. Start Redis

**Option A: Local Redis**
```bash
redis-server
```

**Option B: Redis with Docker**
```bash
docker run -d -p 6379:6379 redis
```

**Option C: Redis Cloud (Free tier available)**
- Sign up at [Redis Cloud](https://redis.com/try-free/)
- Update `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in your `.env` file

**⚠️ Important:** The email scheduler **requires Redis** to be running. The server will fail to start if Redis is not available.

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173
GOOGLE_PROJECT_ID=your_project_id_here

# Frontend Environment Variables (for Vite)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_PROJECT_ID=your_project_id_here
VITE_API_URL=http://localhost:3001/api

# Backend Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/email-sender

# Redis Configuration (REQUIRED for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 5. Start the Server

**Terminal 1: Backend Server**
```bash
npm run dev:server
```

The server will:
1. Check Redis connection (will fail if Redis is not running)
2. Connect to MongoDB
3. Initialize the email scheduler
4. Start the HTTP server

**Terminal 2: Frontend**
```bash
npm run dev
```

## Troubleshooting

### Error: Redis connection failed

**Solution:**
1. Check if Redis is running: `redis-cli ping` (should return `PONG`)
2. If not running, start Redis: `redis-server`
3. Check your `REDIS_HOST` and `REDIS_PORT` in `.env`

### Error: MongoDB connection failed

**Solution:**
1. Check if MongoDB is running: `mongosh` or `mongo`
2. If not running, start MongoDB: `mongod`
3. Check your `MONGODB_URI` in `.env`
4. For MongoDB Atlas, ensure your IP is whitelisted

### TypeScript Linter Errors

**Before npm install:** These are expected - TypeScript can't find modules that haven't been installed yet.

**After npm install:** If errors persist:
1. Make sure all dependencies are installed: `npm install`
2. Restart your IDE/editor
3. Check that `node_modules` exists

### OAuth Refresh Token Issues

**Current Implementation:**
- Uses Google Identity Services (client-side OAuth)
- Refresh tokens may not always be available with this method

**For Production:**
Consider implementing server-side OAuth flow for reliable refresh token handling:
1. Redirect to your backend `/api/auth/google`
2. Backend handles full OAuth flow
3. Backend stores refresh token securely
4. Backend manages token refresh automatically

### Email Scheduler Not Working

**Check:**
1. Redis is running and connected
2. Email worker is initialized (check server logs)
3. Jobs are being added to the queue
4. Gmail API credentials are valid
5. User tokens are stored correctly

## Development vs Production

### Development
- Local MongoDB and Redis
- Google OAuth with test users
- Development mode logging

### Production Considerations
- Use MongoDB Atlas or managed MongoDB
- Use Redis Cloud or managed Redis
- Implement server-side OAuth flow
- Add proper error monitoring (Sentry, etc.)
- Set up SSL/TLS certificates
- Configure CORS properly for production domain
- Add rate limiting
- Implement proper logging

## Quick Start Checklist

- [ ] `npm install` completed
- [ ] MongoDB is running (local or Atlas)
- [ ] Redis is running (local or Docker or Cloud)
- [ ] `.env` file created with all variables
- [ ] Google OAuth credentials configured
- [ ] Gmail API enabled in Google Cloud Console
- [ ] Test user added in OAuth consent screen
- [ ] Backend server starts without errors
- [ ] Frontend starts without errors
- [ ] Can sign in with Google
- [ ] Can create datasets
- [ ] Can create templates
- [ ] Can create campaigns

## Need Help?

If you encounter issues:
1. Check server logs for error messages
2. Run `npm run check-deps` to validate prerequisites
3. Ensure all services (MongoDB, Redis) are running
4. Verify `.env` file has all required variables
5. Check that Google OAuth is properly configured

