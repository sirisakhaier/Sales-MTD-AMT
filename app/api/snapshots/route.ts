import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-06';

    const snapshots = db.prepare(`
      SELECT 
        f.id,
        f.sales_month_id as sales_month,
        f.mtd_report_date,
        f.source_filename,
        f.total_selected_month_rows as records,
        f.status,
        f.uploaded_by,
        f.created_at,
        f.r2_object_key,
        (SELECT SUM(sales_amount) FROM sales_mtd_data WHERE import_file_id = f.id) as total_sales_amount
      FROM import_files f
      WHERE f.sales_month_id = ? AND f.status = 'COMPLETED'
      ORDER BY f.mtd_report_date ASC
    `).all(month);

    return NextResponse.json({ snapshots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get('id');
    const userEmail = searchParams.get('userEmail') || 'admin@makro.co.th';

    if (!snapshotId) {
      return NextResponse.json({ error: 'Snapshot ID required' }, { status: 400 });
    }

    const file = db.prepare('SELECT * FROM import_files WHERE id = ?').get(snapshotId) as any;
    if (!file) {
      return NextResponse.json({ error: 'Snapshot file not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const deleteTransaction = db.transaction(() => {
      const deletedData = db.prepare('DELETE FROM sales_mtd_data WHERE import_file_id = ?').run(snapshotId);
      db.prepare('DELETE FROM import_files WHERE id = ?').run(snapshotId);

      db.prepare(`
        INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
        VALUES (?, ?, 'SNAPSHOT_DELETED', 'IMPORT_FILE', ?, ?, ?)
      `).run(
        `aud-${Date.now()}`, userEmail, snapshotId,
        `Deleted MTD Snapshot ${file.mtd_report_date} (${file.source_filename}). Removed ${deletedData.changes} sales records.`,
        now
      );
    });

    deleteTransaction();

    return NextResponse.json({
      success: true,
      message: `Snapshot ${file.mtd_report_date} deleted successfully.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
