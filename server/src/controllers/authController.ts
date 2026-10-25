import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  try {
    const result = await db.query(
      'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = generateToken(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
      expiresIn
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Login failed.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  try {
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM admin_users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const adminRes = await db.query(
      'SELECT id, password_hash FROM admin_users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (adminRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const admin = adminRes.rows[0];

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required to set new password.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current password does not match.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newHash, req.user.id]
      );
    }

    if (name || email) {
      await db.query(
        `UPDATE admin_users 
         SET name = COALESCE($1, name), 
             email = COALESCE($2, email), 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [name?.trim() || null, email?.toLowerCase().trim() || null, req.user.id]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
