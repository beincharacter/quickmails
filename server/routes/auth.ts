import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

const router = Router();

// Debug endpoint to check OAuth configuration
router.get('/debug', (_req: Request, res: Response) => {
  res.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPreview: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...` : 'MISSING',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    env: process.env.NODE_ENV || 'development',
  });
});

// Initialize OAuth2 client
const getOAuth2Client = (): OAuth2Client => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;
  
  if (!clientId || clientId.trim() === '') {
    console.error('❌ GOOGLE_CLIENT_ID is missing or empty');
    throw new Error('GOOGLE_CLIENT_ID environment variable is not set. Please check your .env file and restart the server.');
  }
  
  if (!clientSecret || clientSecret.trim() === '') {
    console.error('❌ GOOGLE_CLIENT_SECRET is missing or empty');
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is not set. Please check your .env file and restart the server.');
  }
  
  console.log('🔧 OAuth2 Client Config:', {
    clientId: `${clientId.substring(0, 20)}...${clientId.substring(clientId.length - 10)}`,
    hasClientSecret: !!clientSecret && clientSecret.length > 0,
    redirectUri,
  });
  
  const client = new OAuth2Client(
    clientId.trim(),
    clientSecret.trim(),
    redirectUri
  );

  // Verify client is properly initialized
  if (!client._clientId || client._clientId !== clientId.trim()) {
    throw new Error('OAuth2Client failed to initialize with provided client ID');
  }
  
  return client;
};

// Initiate OAuth flow - redirects user to Google
router.get('/google', async (_req: Request, res: Response) => {
  try {
    // Debug: Check environment variables
    console.log('🔍 Environment check:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'using default',
    });

    const oauth2Client = getOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    // Generate authorization URL with offline access to get refresh token
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: scopes,
      prompt: 'consent', // Force consent screen to ensure refresh token
      include_granted_scopes: true,
    });

    console.log('🔗 Redirecting to Google OAuth');
    console.log('📍 Full Auth URL:', authUrl);
    
    // Verify the URL contains client_id
    if (!authUrl.includes('client_id=')) {
      console.error('❌ ERROR: Authorization URL does not contain client_id!');
      throw new Error('Failed to generate authorization URL with client_id');
    }
    
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('❌ OAuth initiation error:', error);
    console.error('❌ Error stack:', error.stack);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'OAuth initiation failed')}`);
  }
});

// Handle OAuth callback from Google
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code received')}`);
    }

    console.log('✅ Received authorization code, exchanging for tokens...');

    const oauth2Client = getOAuth2Client();
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    console.log('✅ Tokens received from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      refreshTokenLength: tokens.refresh_token?.length || 0,
      expiresIn: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown',
    });
    
    if (!tokens.refresh_token) {
      console.warn('⚠️ WARNING: No refresh token received from Google!');
      console.warn('   This might happen if you previously authorized this app.');
      console.warn('   Try revoking access at: https://myaccount.google.com/permissions');
      console.warn('   Then re-authenticate to get a refresh token.');
    }

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.email) {
      throw new Error('No email found in user info');
    }

    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour if no expiry

    console.log('💾 Storing tokens for user:', userInfo.email);

    // Find or create user
    const user = await User.findOneAndUpdate(
      { email: userInfo.email.toLowerCase() },
      {
        email: userInfo.email.toLowerCase(),
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '', // Refresh token is crucial for long-term access
        tokenExpiry,
      },
      { upsert: true, new: true }
    );

    console.log('✅ User stored/updated successfully:', user.email);
    const hasRefreshToken = !!user.refreshToken && user.refreshToken.length > 0;
    console.log('🔄 Refresh token available:', hasRefreshToken);
    console.log('   Refresh token length:', user.refreshToken?.length || 0);
    if (!hasRefreshToken) {
      console.warn('⚠️ WARNING: No refresh token stored! Scheduled emails will fail when access token expires.');
      console.warn('   User needs to re-authenticate with server-side OAuth to get refresh token.');
      console.warn('   This might happen if you previously authorized the app - try revoking access first.');
    } else {
      console.log('✅ Refresh token is stored and will be used for automatic token refresh.');
    }

    // Redirect to frontend with success and tokens
    // In production, you might want to use a session instead of passing tokens in URL
    // For now, we redirect to the dashboard with tokens in URL params
    const redirectUrl = new URL(`${frontendUrl}/dashboard`);
    redirectUrl.searchParams.set('token', tokens.access_token);
    redirectUrl.searchParams.set('userId', String(user._id));

    res.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'OAuth callback failed')}`);
  }
});

// Store tokens after OAuth flow
router.post('/store-tokens', async (req: Request, res: Response) => {
  try {
    console.log('📥 Received store-tokens request');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('AccessToken present:', !!req.body.accessToken);
    console.log('RefreshToken present:', !!req.body.refreshToken);
    console.log('UserInfo present:', !!req.body.userInfo);
    console.log('UserInfo email:', req.body.userInfo?.email);

    const { accessToken, refreshToken, userInfo } = req.body;

    // Validate required fields
    if (!accessToken) {
      console.error('❌ Missing accessToken');
      return res.status(400).json({ error: 'Missing required field: accessToken' });
    }

    if (!userInfo?.email) {
      console.error('❌ Missing userInfo or userInfo.email');
      return res.status(400).json({ error: 'Missing required field: userInfo.email' });
    }

    // Note: refreshToken may not be available with client-side OAuth
    // It's optional - we'll store it if provided
    if (!refreshToken) {
      console.warn('⚠️ No refresh token provided (this is normal for client-side OAuth)');
    }

    // Calculate token expiry (usually 1 hour)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    console.log('💾 Storing user tokens for:', userInfo.email.toLowerCase());

    // Find or create user
    const user = await User.findOneAndUpdate(
      { email: userInfo.email.toLowerCase() },
      {
        email: userInfo.email.toLowerCase(),
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture,
        accessToken,
        refreshToken: refreshToken || '', // Allow empty refresh token
        tokenExpiry,
      },
      { upsert: true, new: true }
    );

    console.log('✅ User stored/updated successfully:', user.email);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      accessToken,
    });
  } catch (error: any) {
    console.error('❌ Store tokens error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to store tokens' });
  }
});

// Get user info
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ accessToken: token });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      hasRefreshToken: !!user.refreshToken && user.refreshToken.length > 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check authentication status and refresh token availability
router.get('/status', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findOne({ accessToken: token });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const hasRefreshToken = !!user.refreshToken && user.refreshToken.length > 0;
    const tokenExpired = user.tokenExpiry ? user.tokenExpiry < new Date() : false;

    res.json({
      authenticated: true,
      hasRefreshToken,
      tokenExpired,
      tokenExpiry: user.tokenExpiry,
      needsReauth: !hasRefreshToken,
      message: !hasRefreshToken 
        ? 'No refresh token found. Please re-authenticate using server-side OAuth to enable token refresh.'
        : tokenExpired
        ? 'Access token expired. Token refresh is available.'
        : 'Authentication is valid.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

