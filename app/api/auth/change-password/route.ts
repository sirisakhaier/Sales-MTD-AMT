import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword, adminChange, adminEmail } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If not admin override, verify current password
    if (!adminChange) {
      if (!currentPassword || !verifyPassword(currentPassword, user.password_hash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    const newHash = hashPassword(newPassword);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, userId);

    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'PASSWORD_CHANGED', 'USER', ?, ?, ?)
    `).run(
      `aud-${Date.now()}`,
      adminEmail || user.email,
      userId,
      `Password changed for user ${user.username} (${user.email})`,
      now
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
