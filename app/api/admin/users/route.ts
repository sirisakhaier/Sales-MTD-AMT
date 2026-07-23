import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const users = db.prepare('SELECT id, username, email, full_name, role, is_active, created_at, updated_at, last_login_at FROM users ORDER BY created_at DESC').all();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, full_name, role, password, adminEmail } = body;

    if (!username || !email || !role || !password) {
      return NextResponse.json({ error: 'Username, email, role, and password are required' }, { status: 400 });
    }

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      return NextResponse.json({ error: 'User with this username already exists' }, { status: 400 });
    }

    const userId = `u-${Date.now()}`;
    const passHash = hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(userId, email, username, passHash, full_name || '', role, now, now, now);

    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_CREATED', 'USER', ?, ?, ?)
    `).run(`aud-${Date.now()}`, adminEmail || 'admin@makro.co.th', userId, `Created user ${username} (${email}) with role ${role}`, now);

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, email, full_name, role, is_active, password, adminEmail } = body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check unique username if changing
    if (username && username !== user.username) {
      const dup = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
      if (dup) {
        return NextResponse.json({ error: 'Username already taken by another user' }, { status: 400 });
      }
    }

    // Check unique email if changing
    if (email && email !== user.email) {
      const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (dup) {
        return NextResponse.json({ error: 'Email already taken by another user' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const newUsername = username || user.username;
    const newEmail = email || user.email;
    const newFullName = full_name !== undefined ? full_name : user.full_name;
    const newRole = role || user.role;
    const newStatus = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;

    let sql = 'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?, updated_at = ?';
    const params: any[] = [newUsername, newEmail, newFullName, newRole, newStatus, now];

    if (password && password.trim().length > 0) {
      sql += ', password_hash = ?';
      params.push(hashPassword(password));
    }

    sql += ' WHERE id = ?';
    params.push(id);

    db.prepare(sql).run(...params);

    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_UPDATED', 'USER', ?, ?, ?)
    `).run(
      `aud-${Date.now()}`, adminEmail || 'admin@makro.co.th', id,
      `Updated user ${newUsername} (${newEmail}) [Role: ${newRole}, Active: ${newStatus}${password ? ', Password Changed' : ''}]`,
      now
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail') || 'admin@makro.co.th';

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = db.prepare('SELECT username, email FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_DELETED', 'USER', ?, ?, ?)
    `).run(`aud-${Date.now()}`, adminEmail, id, `Deleted user ${user.username} (${user.email})`, now);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
