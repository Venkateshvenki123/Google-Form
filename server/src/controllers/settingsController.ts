import { Request, Response } from 'express';
import { db } from '../config/database.js';

export async function getGlobalSettings(_req: Request, res: Response): Promise<void> {
  try {
    const result = await db.query('SELECT key, value FROM system_settings');
    const settingsMap: Record<string, any> = {};

    result.rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });

    res.json({
      success: true,
      settings: settingsMap['general'] || {
        siteName: 'FormCraft Pro',
        adminEmail: 'admin@example.com',
        logoUrl: '',
        defaultTheme: {
          primaryColor: '#4f46e5',
          buttonColor: '#4f46e5',
          backgroundColor: '#f8fafc',
          font: 'Inter',
          borderRadius: 'rounded-xl',
          formWidth: 'max-w-3xl',
          layout: 'card',
        },
        security: {
          rateLimitEnabled: true,
          maxSubmissionsPerMinute: 10,
          enableSpamHoneypot: true,
          enableCaptcha: false,
        },
        email: {
          sendAdminNotifications: true,
          sendUserConfirmations: false,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateGlobalSettings(req: Request, res: Response): Promise<void> {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ success: false, error: 'Settings object is required.' });
    return;
  }

  try {
    const isPg = db.isPostgres();
    if (isPg) {
      await db.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE 
         SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        ['general', settings]
      );
    } else {
      await db.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE 
         SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        ['general', settings]
      );
    }

    res.json({ success: true, message: 'System settings updated successfully.', settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
