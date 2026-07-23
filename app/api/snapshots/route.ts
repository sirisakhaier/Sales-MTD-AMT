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
