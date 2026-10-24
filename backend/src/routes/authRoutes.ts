import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sentinel_super_secret_jwt_key_2026_defense_grid';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/v1/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, organization } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, message: 'Valid corporate email address is required.' });
      return;
    }

    if (!name || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full agent name is required.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const org = organization?.trim() || 'Global Defense Node';
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;

    await dbRun(
      `INSERT INTO users (id, name, email, password_hash, role, organization, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), cleanEmail, passwordHash, 'Security Analyst', org, avatarUrl]
    );

    const user = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: 'Security Analyst',
      organization: org,
      avatarUrl,
    };

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    res.status(201).json({
      success: true,
      message: 'Operator node enrolled successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to process operator enrollment.' });
  }
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const userRecord = await dbGet<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: string;
      organization: string;
      avatar_url: string;
    }>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!userRecord) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid passcode or security key.' });
      return;
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      organization: userRecord.organization,
      avatarUrl: userRecord.avatar_url,
    };

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Authentication failure.' });
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organization: req.user.organization,
      avatarUrl: req.user.avatar_url,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.json({ success: true, message: 'Operator session terminated.' });
});

export default router;
