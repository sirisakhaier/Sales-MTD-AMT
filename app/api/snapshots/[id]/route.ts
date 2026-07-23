import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotId = params.id;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'admin@makro.co.th';

    const file = db.prepare('SELECT * FROM import_files WHERE id = ?').get(snapshotId) as any;
    if (!file) {
      return NextResponse.json({ error: 'Snapshot file not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Transaction to delete snapshot data without affecting other snapshots
    const deleteTransaction = db.transaction(() => {
      // 1. Delete rows from sales_mtd_data
      const deletedData = db.prepare('DELETE FROM sales_mtd_data WHERE import_file_id = ?').run(snapshotId);

      // 2. Delete file record from import_files
      db.prepare('DELETE FROM import_files WHERE id = ?').run(snapshotId);

      // 3. Log audit event
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
