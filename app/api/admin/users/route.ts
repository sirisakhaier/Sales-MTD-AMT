import { NextResponse } from 'next/server';
import { getDB, dbGet, dbAll, dbRun } from '@/lib/d1';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const db = await getDB();
    const users = await dbAll(db, 'SELECT id, username, email, full_name, role, is_active, created_at, updated_at, last_login_at FROM users ORDER BY created_at DESC');
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

    const db = await getDB();
    const existingEmail = await dbGet(db, 'SELECT id FROM users WHERE email = ?', email);
    if (existingEmail) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const existingUsername = await dbGet(db, 'SELECT id FROM users WHERE username = ?', username);
    if (existingUsername) {
      return NextResponse.json({ error: 'User with this username already exists' }, { status: 400 });
    }

    const userId = `u-${Date.now()}`;
    const passHash = hashPassword(password);
    const now = new Date().toISOString();

    await dbRun(db, `
      INSERT INTO users (id, email, username, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `, userId, email, username, passHash, full_name || '', role, now, now, now);

    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_CREATED', 'USER', ?, ?, ?)
    `, `aud-${Date.now()}`, adminEmail || 'admin@makro.co.th', userId, `Created user ${username} (${email}) with role ${role}`, now);

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, email, full_name, role, is_active, password, adminEmail } = body;

    const db = await getDB();
    const user = await dbGet(db, 'SELECT * FROM users WHERE id = ?', id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (username && username !== user.username) {
      const dup = await dbGet(db, 'SELECT id FROM users WHERE username = ? AND id != ?', username, id);
      if (dup) {
        return NextResponse.json({ error: 'Username already taken by another user' }, { status: 400 });
      }
    }

    if (email && email !== user.email) {
      const dup = await dbGet(db, 'SELECT id FROM users WHERE email = ? AND id != ?', email, id);
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

    await dbRun(db, sql, ...params);

    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_UPDATED', 'USER', ?, ?, ?)
    `, `aud-${Date.now()}`, adminEmail || 'admin@makro.co.th', id,
      `Updated user ${newUsername} (${newEmail}) [Role: ${newRole}, Active: ${newStatus}${password ? ', Password Changed' : ''}]`, now);

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

    const db = await getDB();
    const user = await dbGet(db, 'SELECT username, email FROM users WHERE id = ?', id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await dbRun(db, 'DELETE FROM users WHERE id = ?', id);

    const now = new Date().toISOString();
    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'USER_DELETED', 'USER', ?, ?, ?)
    `, `aud-${Date.now()}`, adminEmail, id, `Deleted user ${user.username} (${user.email})`, now);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
