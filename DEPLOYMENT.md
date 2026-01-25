# Deployment Guide

## Tech Stack Summary
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (via Mongoose)
- **Queue/Redis**: BullMQ with Redis (ioredis)
- **Email**: Gmail API (googleapis)

---

## 🚀 Deployment Platforms

### **Option 1: Railway (Recommended for Simplicity) ⭐**
**Best for**: Quick deployment, full-stack apps, good Redis/MongoDB integration

**Pros:**
- One-click MongoDB + Redis add-ons
- Automatic deployments from Git
- Free tier available ($5/month credit)
- Built-in environment variables
- Simple pricing ($5-20/month)

**Steps:**
1. Push code to GitHub
2. Connect Railway to your repo
3. Add MongoDB add-on
4. Add Redis add-on
5. Deploy frontend and backend as separate services
6. Set environment variables

**Cost**: ~$10-15/month (MongoDB + Redis + 2 services)

---

### **Option 2: Render**
**Best for**: Free tier, ease of use

**Pros:**
- Free tier available (with limitations)
- Auto-deploy from Git
- Good documentation

**Cons:**
- Free tier spins down after inactivity
- Separate Redis service needed (can use Upstash)

**Steps:**
1. Create Web Service for backend
2. Create Static Site for frontend
3. Connect MongoDB Atlas
4. Connect Upstash Redis

**Render Backend Configuration:**
- **Service Type**: Web Service
- **Build Command**: `cd server && npm install && npm run build`
- **Start Command**: `cd server && npm start` ⚠️ **IMPORTANT: Use `npm start`, NOT `npm run dev`**
- **Environment**: Node.js
- **Root Directory**: Leave empty (or set to repository root)

**Render Frontend Configuration:**
- **Service Type**: Static Site ⚠️ **IMPORTANT: Use Static Site, NOT Web Service**
- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`
- **Environment Variables** (set these in Render Static Site settings):
  - `VITE_API_URL=https://quickmails-backend.onrender.com/api` ⚠️ **Replace with your actual backend URL**
  
  **Important Notes:**
  - The backend URL is configured via `VITE_API_URL` environment variable (NOT hardcoded)
  - This allows you to use different URLs for dev/staging/production
  - The URL is embedded at **build time**, so you must set it before building
  - If you change the backend URL, you need to rebuild the frontend

**Cost**: $0-25/month (free tier + optional paid)

---

### **Option 3: Fly.io**
**Best for**: Global edge deployment, Docker-based

**Pros:**
- Global edge deployment
- Good Redis support
- Pay-as-you-go

**Cons:**
- Requires Docker knowledge
- More complex setup

**Cost**: ~$5-15/month

---

### **Option 4: DigitalOcean App Platform**
**Best for**: Simplicity with managed services

**Pros:**
- One-click deployments
- Managed MongoDB available
- Good Redis support
- Simple pricing

**Cons:**
- Slightly more expensive
- Fewer free options

**Cost**: ~$12-25/month

---

### **Option 5: AWS/GCP/Azure**
**Best for**: Enterprise, high scale

**Pros:**
- Maximum flexibility
- Global infrastructure
- Enterprise features

**Cons:**
- Complex setup
- More expensive
- Steeper learning curve

**Recommended services:**
- **AWS**: Elastic Beanstalk (backend) + S3/CloudFront (frontend) + DocumentDB (MongoDB) + ElastiCache (Redis)
- **GCP**: Cloud Run (backend) + Firebase Hosting (frontend) + MongoDB Atlas + Memorystore (Redis)
- **Azure**: App Service + Static Web Apps + Cosmos DB + Azure Cache

**Cost**: ~$20-50+/month

---

## 💾 Production Database: MongoDB

### **Option 1: MongoDB Atlas (Recommended) ⭐**
**Best for**: Production use, managed service

**Pros:**
- Fully managed
- Free tier available (512MB)
- Automatic backups
- Global clusters
- Easy scaling
- Security features

**Setup:**
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for server IP)
5. Get connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/email-sender?retryWrites=true&w=majority`

**Cost**: 
- Free tier: $0/month (512MB, shared CPU)
- Paid: $9/month+ (better performance)

**Connection String Format:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/email-sender?retryWrites=true&w=majority
```

---

### **Option 2: Railway MongoDB**
**Best for**: Railway deployments

**Pros:**
- Integrated with Railway
- One-click setup
- Auto-backups

**Cost**: ~$5/month

---

### **Option 3: DigitalOcean Managed MongoDB**
**Best for**: DigitalOcean ecosystem

**Pros:**
- Integrated with DO
- Good performance
- Simple setup

**Cost**: ~$15/month

---

### **Option 4: Self-Hosted (MongoDB on VPS)**
**Best for**: Full control, cost savings

**Pros:**
- Full control
- Lower cost
- Custom configuration

**Cons:**
- Manual management
- Backups your responsibility
- Scaling complexity

**Cost**: VPS cost (~$5-10/month)

---

## 🔴 Production Redis

### **Option 1: Upstash (Recommended) ⭐**
**Best for**: Serverless-friendly, pay-per-use

**Pros:**
- Free tier available (10K commands/day)
- Serverless-friendly
- Global edge locations
- REST API + Redis protocol
- Great for BullMQ

**Setup:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database
3. Choose region (closest to your server)
4. Get Redis URL: `redis://default:<password>@<endpoint>:6379`

**Cost**: 
- Free: 10K commands/day
- Paid: ~$0.20 per 100K commands

**Connection String Format:**
```env
REDIS_HOST=<endpoint>
REDIS_PORT=6379
REDIS_PASSWORD=<password>
# Or use full URL:
REDIS_URL=redis://default:<password>@<endpoint>:6379
```

---

### **Option 2: Redis Cloud**
**Best for**: Traditional Redis needs

**Pros:**
- Free tier (30MB)
- Standard Redis protocol
- Good performance
- Managed backups

**Cost**: 
- Free: 30MB
- Paid: $5/month+

---

### **Option 3: Railway Redis**
**Best for**: Railway deployments

**Pros:**
- One-click setup
- Integrated billing
- Simple configuration

**Cost**: ~$5/month

---

### **Option 4: DigitalOcean Managed Redis**
**Best for**: DigitalOcean ecosystem

**Pros:**
- Integrated with DO
- Good performance
- Automatic backups

**Cost**: ~$15/month

---

### **Option 5: AWS ElastiCache / GCP Memorystore / Azure Cache**
**Best for**: Cloud-native deployments

**Pros:**
- Enterprise-grade
- High availability
- Integrated with cloud services

**Cons:**
- More expensive
- Complex setup

**Cost**: ~$15-30/month

---

## 📋 Recommended Setup (Budget-Friendly)

### **Starter Setup ($0-10/month)**
1. **Frontend**: Vercel (free) or Netlify (free)
2. **Backend**: Render (free tier) or Railway ($5/month)
3. **Database**: MongoDB Atlas (free tier)
4. **Redis**: Upstash (free tier - 10K commands/day)

**Total Cost**: $0-5/month

---

### **Production Setup ($15-25/month)**
1. **Frontend**: Vercel Pro ($20/month) or Netlify Pro
2. **Backend**: Railway ($5/month) or Render ($7/month)
3. **Database**: MongoDB Atlas M10 ($9/month)
4. **Redis**: Upstash (~$5/month) or Redis Cloud ($5/month)

**Total Cost**: $20-40/month

---

## 🔧 Environment Variables

Create a `.env` file in your server directory with:

```env
# Server
PORT=3001
NODE_ENV=production

# Frontend URL (your deployed frontend URL)
FRONTEND_URL=https://your-app.vercel.app

# MongoDB (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/email-sender?retryWrites=true&w=majority

# Redis (Upstash)
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
# OR use full URL:
REDIS_URL=redis://default:password@host:6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-server.com/api/auth/google/callback
```

---

## 🚢 Deployment Steps (Railway Example)

### Backend Deployment:
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js
6. Add MongoDB service:
   - Click "+ New" → "Database" → "Add MongoDB"
7. Add Redis service:
   - Click "+ New" → "Database" → "Add Redis" (or use Upstash)
8. Set environment variables
9. Set build command: `cd server && npm install && npm run build`
10. Set start command: `cd server && npm start`
11. Deploy!

### Frontend Deployment:
1. Build the frontend pointing to your backend URL
2. Deploy to Vercel/Netlify:
   - Connect GitHub repo
   - Build command: `cd client && npm install && npm run build`
   - Output directory: `client/dist`
   - Set environment variable: `VITE_API_URL=https://your-backend.railway.app`

---

## 🎯 Quick Start Commands

### Build for Production:
```bash
# Build both client and server
make build

# Or individually
cd client && npm run build
cd server && npm run build
```

### Test Production Build Locally:
```bash
# Server
cd server && npm start

# Client (preview)
cd client && npm run preview
```

---

## 🔐 Security Checklist

Before deploying:
- [ ] Use HTTPS everywhere
- [ ] Set secure CORS origins (no wildcards in production)
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable MongoDB IP whitelisting
- [ ] Use strong Redis passwords
- [ ] Set up Google OAuth redirect URIs correctly
- [ ] Enable MongoDB authentication
- [ ] Use secure session storage
- [ ] Set proper file permissions
- [ ] Enable logging and monitoring

---

## 📊 Monitoring & Logs

**Recommended Tools:**
- **Railway**: Built-in logs and metrics
- **Sentry**: Error tracking (free tier)
- **Logtail**: Log aggregation (free tier)
- **MongoDB Atlas**: Database monitoring
- **Upstash Console**: Redis monitoring

---

## 💡 Tips

1. **Start with free tiers** to test, then upgrade
2. **Use MongoDB Atlas** - easiest managed MongoDB
3. **Use Upstash Redis** - best free tier + serverless-friendly
4. **Deploy frontend to Vercel** - zero config, free
5. **Use Railway for backend** - easiest full-stack deployment
6. **Set up monitoring** from day one
7. **Enable auto-deployments** from main branch
8. **Use environment variables** for all configs
9. **Set up staging environment** before production
10. **Backup your database** regularly

---

## 🆘 Troubleshooting

**Redis Connection Issues:**
- Check Redis URL format
- Verify password is correct
- Check IP whitelisting (if applicable)
- Verify Redis is running (Upstash shows status)

**MongoDB Connection Issues:**
- Verify connection string format
- Check IP whitelist in Atlas
- Verify username/password
- Check network connectivity

**CORS Issues:**
- Set `FRONTEND_URL` environment variable correctly
- Verify frontend URL matches exactly
- Check CORS settings in server code

**Render Deployment Issues:**
- **"tsx: not found" error**: Make sure Start Command is `cd server && npm start` (NOT `npm run dev`)
- **Build fails**: Ensure Build Command is `cd server && npm install && npm run build`
- **Port binding issues**: Render automatically sets PORT, ensure your code uses `process.env.PORT`
- **Redis connection fails**: Server will start without Redis but email sending will be disabled
- **Frontend shows "Build failed"**: Make sure frontend is deployed as **Static Site** (not Web Service)
  - Static Site Build Command: `cd client && npm install && npm run build`
  - Static Site Publish Directory: `client/dist`
- **Redis connection spam in logs**: This is normal if Redis isn't configured. Configure Redis to stop the warnings.

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Upstash Docs](https://docs.upstash.com)
- [Vercel Docs](https://vercel.com/docs)
- [BullMQ Docs](https://docs.bullmq.io)

---

**Last Updated**: 2025-01-01

