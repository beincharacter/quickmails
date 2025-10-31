import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const router = Router();

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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

