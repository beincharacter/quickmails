# Email Sender App

A minimal React app that allows users to sign in with Google OAuth and send emails using their Gmail account.

## Features

- Google OAuth authentication
- Send emails via Gmail API
- Clean and minimal UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your Google OAuth credentials:
```bash
cp .env.example .env
```
Then edit `.env` and fill in your actual credentials:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_PROJECT_ID=your-google-project-id
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Usage

1. Click "Sign in with Google" to authenticate
2. After signing in, you'll see the email composer
3. Fill in the recipient, subject, and message
4. Click "Send Email" to send

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

