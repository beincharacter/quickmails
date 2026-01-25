import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    // Find user by access token
    const user = await User.findOne({ accessToken: token });
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    // Check if token is expired
    if (user.tokenExpiry && user.tokenExpiry < new Date()) {
      res.status(401).json({ error: 'Token expired. Please re-authenticate.' });
      return;
    }

    req.userId = String(user._id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

