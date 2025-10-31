# Cold Email Sender SaaS Application

A full-stack cold email sender SaaS application built with React, TypeScript, Express, MongoDB, and BullMQ. Users can log in with Google OAuth, manage datasets of prospects, create email templates with placeholders, and run campaigns with instant or scheduled email sending.

## Features

### Authentication
- ✅ Google OAuth authentication with Gmail API access
- ✅ Secure token storage (access & refresh tokens)
- ✅ Token refresh handling

### Dataset Management
- ✅ Create custom datasets with dynamic fields
- ✅ Add custom columns dynamically (name, email, company, position, etc.)
- ✅ Table view with filtering and selection
- ✅ Add/remove records

### Email Templates
- ✅ Create multiple named templates
- ✅ Subject line and body with placeholder support (e.g., `{name}`, `{company}`)
- ✅ Automatic variable extraction
- ✅ Template preview with sample data

### Campaign Management
- ✅ Create campaigns by selecting dataset and template
- ✅ Select specific prospects or use all records
- ✅ Instant or scheduled email sending
- ✅ Configurable delay between emails
- ✅ Daily send limits for compliance

### Email Sending
- ✅ Gmail API integration
- ✅ Template personalization
- ✅ Background job queue (BullMQ + Redis)
- ✅ Email status tracking (sent, scheduled, failed)
- ✅ Error logging and retry handling

### Dashboard & Analytics
- ✅ Total emails sent, scheduled, failed
- ✅ Campaign statistics
- ✅ Recent activity tracking
- ✅ Dataset and template counts

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- BullMQ + Redis (job queue)

**APIs:**
- Google OAuth2
- Gmail API

## Setup

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or MongoDB Atlas)
3. **Redis** (for job queue)
4. **Google Cloud Project** with OAuth credentials

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Default connection: `mongodb://localhost:27017/email-sender`

3. **Set up Redis:**
   - Install Redis locally or use a cloud service
   - Default: `localhost:6379`

4. **Configure Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized JavaScript origins: `http://localhost:5173`
   - Add authorized redirect URIs: `http://localhost:5173`
   - Add your email as a test user (OAuth consent screen)

5. **Create environment file:**
   - Create a `.env` file in the root directory:
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

# Redis Configuration (for BullMQ job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Running the Application

1. **Start MongoDB:**
```bash
# If installed locally:
mongod
```

2. **Start Redis:**
```bash
# If installed locally:
redis-server
```

3. **Start the backend server:**
```bash
npm run dev:server
# or
npm run server
```

4. **Start the frontend development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## Usage

### Getting Started

1. **Sign In:**
   - Click "Sign in with Google"
   - Grant Gmail API permissions
   - You'll be redirected to the dashboard

2. **Create a Dataset:**
   - Go to "Datasets"
   - Click "Create Dataset"
   - Add custom fields (e.g., name, email, company, position)
   - Add records with data for each field

3. **Create a Template:**
   - Go to "Templates"
   - Click "Create Template"
   - Use placeholders like `{name}`, `{company}`, `{email}` in subject and body
   - Preview with sample data

4. **Create a Campaign:**
   - Go to "Campaigns"
   - Click "Create Campaign"
   - Select a dataset
   - Choose specific records or use all
   - Select a template
   - Choose instant or scheduled sending
   - Set delay between emails (optional)
   - Set daily send limit (optional)

5. **Monitor:**
   - View dashboard for statistics
   - Check campaign status
   - Review email logs

## Project Structure

```
/
├── server/                 # Backend code
│   ├── index.ts           # Express server entry point
│   ├── config/            # Configuration files
│   │   └── database.ts    # MongoDB connection
│   ├── models/            # Mongoose models
│   │   ├── User.ts
│   │   ├── Dataset.ts
│   │   ├── Template.ts
│   │   ├── Campaign.ts
│   │   └── EmailLog.ts
│   ├── routes/            # API routes
│   │   ├── auth.ts
│   │   ├── datasets.ts
│   │   ├── templates.ts
│   │   ├── campaigns.ts
│   │   ├── emails.ts
│   │   └── dashboard.ts
│   ├── services/          # Business logic
│   │   ├── gmail.ts      # Gmail API integration
│   │   └── scheduler.ts  # BullMQ job queue
│   └── middleware/        # Express middleware
│       └── auth.ts        # Authentication middleware
├── src/                   # Frontend code
│   ├── components/        # React components
│   │   ├── Login.tsx
│   │   ├── Layout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Datasets.tsx
│   │   ├── Templates.tsx
│   │   └── Campaigns.tsx
│   ├── config/            # Configuration
│   │   ├── api.ts         # API client
│   │   └── oauth.ts       # OAuth config
│   ├── utils/             # Utilities
│   │   ├── auth.ts        # Authentication utilities
│   │   └── email.ts       # Email utilities
│   └── types/             # TypeScript types
│       └── index.ts
└── package.json

## Quick Setup

For detailed setup instructions, see [SETUP.md](./SETUP.md)

**Quick Start:**
1. Install dependencies: `npm install`
2. Start MongoDB: `mongod` (or use MongoDB Atlas)
3. Start Redis: `redis-server` (or use Docker/Redis Cloud)
4. Create `.env` file (see SETUP.md for template)
5. Check dependencies: `npm run check-deps`
6. Start backend: `npm run dev:server`
7. Start frontend: `npm run dev` (in another terminal)

## Important Setup: Fix Common OAuth Errors

### Fix Error 403: access_denied (App Not Verified)

If you encounter `Error 403: access_denied` saying "MailPilot has not completed the Google verification process", you need to add yourself as a test user:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `simplyplaywithyourgmail`
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add your Google email address: `shubhampalatwork@gmail.com`
7. Click **Add**
8. Try signing in again

**Note:** The app is in "Testing" mode by default. To make it available to all users, you'll need to submit it for Google verification (requires verification process). For development, adding test users is sufficient.

### Fix Error 400: redirect_uri_mismatch

If you encounter the `Error 400: redirect_uri_mismatch` error, you need to configure authorized redirect URIs in Google Cloud Console:

### Steps to Fix:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `simplyplaywithyourgmail`
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for Vite default port)
   - `http://localhost:5173/` (with trailing slash)
   - `http://127.0.0.1:5173` (alternative localhost)
   - Add your production URL if deploying
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173` (or your dev server URL)
   - `http://localhost:5173/callback` (if using explicit callback)
   - `http://127.0.0.1:5173`
7. Click **Save**
8. Wait a few minutes for changes to propagate
9. Try signing in again

### Additional Requirements:

- **Gmail API must be enabled** in your Google Cloud project:
  - Go to **APIs & Services** > **Library**
  - Search for "Gmail API"
  - Click on it and press **Enable**

- The app requests permissions for:
  - Gmail send access
  - User email and profile information

### Note:
If you're running on a different port, make sure to add that port number to the authorized origins and redirect URIs.

