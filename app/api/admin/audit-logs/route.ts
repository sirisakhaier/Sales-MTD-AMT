import { NextResponse } from 'next/server';
import { getDB, dbAll } from '@/lib/d1';

export async function GET() {
  try {
    const db = await getDB();
    const logs = await dbAll(db, 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
