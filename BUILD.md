# Build Instructions

This guide explains how to build both the frontend and backend for production.

## Quick Build

Build both frontend and backend with a single command:

```bash
npm run build
```

This will:
1. Build the frontend (TypeScript → JavaScript + Vite bundle)
2. Build the backend (TypeScript → JavaScript)

## Build Components Separately

### Build Frontend Only

```bash
npm run build:frontend
```

**Output:** `dist/` directory containing:
- `index.html`
- `assets/` folder with bundled JS and CSS files

### Build Backend Only

```bash
npm run build:backend
```

**Output:** `server/dist/` directory containing compiled JavaScript files

## Production Deployment

### Option 1: Using Compiled Backend (Recommended for Production)

1. Build everything:
   ```bash
   npm run build
   ```

2. Run the compiled backend:
   ```bash
   npm run server:prod
   ```
   
   Or directly:
   ```bash
   node server/dist/index.js
   ```

3. Serve the frontend:
   - Option A: Copy `dist/` folder contents to a web server (nginx, Apache, etc.)
   - Option B: Use a static file server:
     ```bash
     npm run preview
     ```

### Option 2: Using tsx Runtime (Development-like, simpler)

1. Build frontend:
   ```bash
   npm run build:frontend
   ```

2. Run backend with tsx (no compilation needed):
   ```bash
   npm run server
   ```

## Environment Setup for Production

Make sure your `.env` file is configured with production values:

```env
# Frontend (build-time)
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_API_URL=https://your-api-domain.com/api

# Backend (runtime)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-api-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001

# Database
MONGODB_URI=mongodb://your-mongodb-connection-string

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

## Production Checklist

Before deploying to production:

- [ ] Build both frontend and backend (`npm run build`)
- [ ] Update `.env` with production URLs and credentials
- [ ] Ensure MongoDB is accessible from your server
- [ ] Ensure Redis is accessible from your server
- [ ] Configure Google OAuth with production redirect URIs
- [ ] Test the OAuth flow in production
- [ ] Set up process management (PM2, systemd, etc.)
- [ ] Configure reverse proxy (nginx) if needed
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure firewall rules

## Process Management (Recommended)

For production, use a process manager like PM2:

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Create `ecosystem.config.js`:
   ```js
   module.exports = {
     apps: [{
       name: 'email-sender-api',
       script: 'server/dist/index.js',
       instances: 1,
       exec_mode: 'fork',
       env: {
         NODE_ENV: 'production'
       }
     }]
   }
   ```

3. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Troubleshooting

### Frontend build errors

- Check TypeScript errors: `tsc --noEmit`
- Ensure all dependencies are installed: `npm install`
- Check `vite.config.ts` configuration

### Backend build errors

- Verify `server/tsconfig.json` settings
- Check that all TypeScript types are available
- Ensure `@types/node` is installed

### Runtime errors after build

- Ensure `.env` file is present and configured
- Check that MongoDB and Redis are running
- Verify all environment variables are set correctly

