import { NextResponse } from 'next/server';
import { getDB, dbGet, dbRun } from '@/lib/d1';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = await getDB();
    const user = await dbGet(db, 'SELECT * FROM users WHERE username = ? OR email = ?', username, username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.is_active !== 1) {
      return NextResponse.json({ error: 'User account is deactivated' }, { status: 403 });
    }

    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const now = new Date().toISOString();
    await dbRun(db, 'UPDATE users SET last_login_at = ? WHERE id = ?', now, user.id);
    await dbRun(db,
      `INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
       VALUES (?, ?, 'USER_LOGIN', 'USER', ?, ?, ?)`,
      `aud-${Date.now()}`, user.email, user.id, `User ${user.username} logged in successfully`, now
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
