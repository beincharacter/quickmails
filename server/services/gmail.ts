import { google } from 'googleapis';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

export class GmailService {
  private static async getOAuth2Client(refreshToken: string): Promise<OAuth2Client> {
    if (!refreshToken || refreshToken.trim() === '') {
      throw new Error('Refresh token is required but not provided');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
    }

    // Note: redirect URI doesn't need to match for token refresh, but we'll use it for consistency
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;

    const client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    // For refresh token, we only need to set the refresh_token
    // The client ID and secret are used to authenticate the refresh request
    client.setCredentials({
      refresh_token: refreshToken.trim(),
    });

    return client;
  }

  private static async refreshAccessToken(refreshToken: string, userId: string): Promise<string> {
    try {
      console.log(`🔄 Attempting to refresh access token for user ID: ${userId}`);
      console.log(`   Refresh token length: ${refreshToken.length}`);
      
      const client = await this.getOAuth2Client(refreshToken);
      console.log('✅ OAuth2Client created successfully');
      
      console.log('🔄 Calling refreshAccessToken()...');
      const { credentials } = await client.refreshAccessToken();
      
      console.log('✅ Received credentials:', {
        hasAccessToken: !!credentials.access_token,
        hasRefreshToken: !!credentials.refresh_token,
        expiryDate: credentials.expiry_date,
      });
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token - no access token in response');
      }

      // Update the user's access token and expiry in the database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found in database`);
      }

      const expiryDate = credentials.expiry_date 
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour if no expiry

      user.accessToken = credentials.access_token;
      user.tokenExpiry = expiryDate;
      
      // Update refresh token if a new one is provided (rare but possible)
      if (credentials.refresh_token) {
        user.refreshToken = credentials.refresh_token;
        console.log('🔄 New refresh token received and stored');
      }
      
      await user.save();
      console.log('✅ Access token refreshed and saved for user:', user.email);
      console.log(`   New token expires at: ${expiryDate.toISOString()}`);

      return credentials.access_token;
    } catch (error: any) {
      console.error('❌ Refresh token error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error response:', error.response?.data);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  static async getValidAccessToken(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hasRefreshToken = !!user.refreshToken && user.refreshToken.trim() !== '';
    
    // Check if token is expired
    if (user.tokenExpiry && user.tokenExpiry < new Date()) {
      console.log(`🔄 Token expired for user ${user.email}. Has refresh token: ${hasRefreshToken}`);
      
      // Try to refresh the token if we have a refresh token
      if (!hasRefreshToken) {
        console.error(`❌ No refresh token for user ${user.email}. They need to re-authenticate.`);
        throw new Error(
          'Access token expired and no refresh token available. ' +
          'Please re-authenticate your Google account using the new server-side OAuth flow. ' +
          'Your previous authentication did not include a refresh token.'
        );
      }

      try {
        console.log(`🔄 Attempting to refresh access token for user ${user.email}...`);
        const newAccessToken = await this.refreshAccessToken(user.refreshToken, userId);
        console.log(`✅ Access token refreshed successfully for user ${user.email}`);
        // Token is already saved in refreshAccessToken method
        return newAccessToken;
      } catch (error: any) {
        console.error(`❌ Failed to refresh token for user ${user.email}:`, error.message);
        // If refresh fails, provide helpful error message
        throw new Error(
          `Failed to refresh access token: ${error.message}. ` +
          'Please re-authenticate your Google account. ' +
          'You may need to revoke previous access and re-authenticate.'
        );
      }
    }

    // Even if not expired, verify the token still works
    // For now, we'll just return it and let Gmail API tell us if it's invalid
    
    return user.accessToken;
  }

  static async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    let accessToken: string;
    
    try {
      accessToken = await this.getValidAccessToken(userId);
    } catch (error: any) {
      // If we can't get a valid token, throw a more descriptive error
      throw new Error(`Authentication failed: ${error.message}. Please re-authenticate your Google account.`);
    }
    
    // Create email message
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ].join('\r\n');

    // Encode to base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Use the access token directly with googleapis
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      await gmailClient.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });
    } catch (error: any) {
      // Handle Gmail API errors
      if (error.response?.status === 401) {
        console.log(`⚠️ Received 401 Unauthorized from Gmail API. Attempting token refresh...`);
        
        // Token is invalid (even if not expired in our DB), try to refresh
        try {
          // Get user to check refresh token availability
          const user = await User.findById(userId);
          if (!user) {
            throw new Error('User not found');
          }

          const hasRefreshToken = !!user.refreshToken && user.refreshToken.trim() !== '';
          console.log(`   User: ${user.email}, Has refresh token: ${hasRefreshToken}`);
          
          if (!hasRefreshToken) {
            throw new Error('No refresh token available. Please re-authenticate.');
          }

          // Force refresh attempt (token might be invalid even if not expired)
          // Even if tokenExpiry says it's valid, Google rejected it, so refresh anyway
          console.log(`🔄 Forcing token refresh due to 401 error...`);
          console.log(`   Current token expiry: ${user.tokenExpiry?.toISOString() || 'not set'}`);
          console.log(`   Current time: ${new Date().toISOString()}`);
          console.log(`   Token is expired (by date): ${user.tokenExpiry ? user.tokenExpiry < new Date() : 'unknown'}`);
          
          // Directly refresh the token instead of going through getValidAccessToken
          // because getValidAccessToken only refreshes if expired by date
          const newAccessToken = await this.refreshAccessToken(user.refreshToken, userId);
          console.log(`✅ Got new access token after refresh`);
          
          // Create new OAuth client with refreshed token
          const newOAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          newOAuth2Client.setCredentials({ access_token: newAccessToken });
          
          const newGmailClient = google.gmail({ version: 'v1', auth: newOAuth2Client });
          
          // Retry sending with new token
          console.log(`🔄 Retrying email send with refreshed token...`);
          await newGmailClient.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedEmail,
            },
          });
          console.log(`✅ Email sent successfully after token refresh`);
        } catch (retryError: any) {
          console.error(`❌ Failed to refresh and retry:`, retryError.message);
          console.error(`   Retry error stack:`, retryError.stack);
          throw new Error(
            `Gmail authentication error: Token expired and cannot be refreshed. ` +
            `Error: ${retryError.message}. ` +
            `Please re-authenticate your Google account. Original error: ${error.message}`
          );
        }
      } else {
        // Non-authentication error
        throw error;
      }
    }
  }
}

