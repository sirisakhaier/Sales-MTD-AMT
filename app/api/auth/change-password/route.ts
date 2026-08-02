import { NextResponse } from 'next/server';
import { getDB, dbGet, dbRun } from '@/lib/d1';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword, adminChange, adminEmail } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 });
    }

    const db = await getDB();
    const user = await dbGet(db, 'SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!adminChange) {
      if (!currentPassword || !verifyPassword(currentPassword, user.password_hash)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    const newHash = hashPassword(newPassword);
    const now = new Date().toISOString();

    await dbRun(db, 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', newHash, now, userId);
    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'PASSWORD_CHANGED', 'USER', ?, ?, ?)
    `, `aud-${Date.now()}`, adminEmail || user.email, userId, `Password changed for user ${user.username} (${user.email})`, now);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
