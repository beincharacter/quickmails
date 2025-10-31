import { google } from 'googleapis';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

export class GmailService {
  private static async getOAuth2Client(refreshToken: string): Promise<OAuth2Client> {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173'
    );

    client.setCredentials({
      refresh_token: refreshToken,
    });

    return client;
  }

  private static async refreshAccessToken(refreshToken: string): Promise<string> {
    const client = await this.getOAuth2Client(refreshToken);
    const { credentials } = await client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return credentials.access_token;
  }

  static async getValidAccessToken(userId: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if token is expired
    if (user.tokenExpiry && user.tokenExpiry < new Date()) {
      // Refresh the token
      const newAccessToken = await this.refreshAccessToken(user.refreshToken);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Usually valid for 1 hour

      user.accessToken = newAccessToken;
      user.tokenExpiry = expiryDate;
      await user.save();

      return newAccessToken;
    }

    return user.accessToken;
  }

  static async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);
    
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

    await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
  }
}

