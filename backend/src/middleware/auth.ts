import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbGet } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sentinel_super_secret_jwt_key_2026_defense_grid';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  avatar_url?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = await dbGet<AuthenticatedUser>(
      'SELECT id, name, email, role, organization, avatar_url FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
    return;
  }
};
