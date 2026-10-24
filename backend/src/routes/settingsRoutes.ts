import { Router, Request, Response } from 'express';
import { dbAll, dbRun } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/v1/settings
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await dbAll<{ key: string; value: string }>('SELECT key, value FROM system_settings');
    const settings: Record<string, string> = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    res.json({
      success: true,
      data: {
        defenseMode: settings['defense_mode'] || 'autonomous',
        emailAlerts: settings['email_alerts'] === 'true',
        slackWebhook: settings['slack_webhook'] || '',
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve system settings.' });
  }
});

/**
 * PUT /api/v1/settings
 */
router.put('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { defenseMode, emailAlerts, slackWebhook } = req.body;

    if (defenseMode) {
      await dbRun(
        'INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        ['defense_mode', defenseMode, defenseMode]
      );
    }

    if (emailAlerts !== undefined) {
      const val = emailAlerts ? 'true' : 'false';
      await dbRun(
        'INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        ['email_alerts', val, val]
      );
    }

    if (slackWebhook !== undefined) {
      await dbRun(
        'INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        ['slack_webhook', slackWebhook, slackWebhook]
      );
    }

    res.json({
      success: true,
      message: 'System settings saved and applied to autonomous engine.',
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update system settings.' });
  }
});

export default router;
