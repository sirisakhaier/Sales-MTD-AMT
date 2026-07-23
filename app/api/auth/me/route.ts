import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cfEmail = request.headers.get('CF-Access-Authenticated-User-Email');
    let userEmail = cfEmail || 'admin@makro.co.th';

    // Allow switching mock user via header or query param for dev testing
    const url = new URL(request.url);
    const mockRole = url.searchParams.get('role');
    if (mockRole) {
      if (mockRole === 'MANAGER') userEmail = 'manager@makro.co.th';
      else if (mockRole === 'VIEWER') userEmail = 'viewer@makro.co.th';
      else if (mockRole === 'ADMIN') userEmail = 'admin@makro.co.th';
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(userEmail) as any;

    if (!user) {
      return NextResponse.json({
        id: 'u-admin',
        email: userEmail,
        full_name: 'Administrator',
        role: 'ADMIN',
        is_active: 1
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
