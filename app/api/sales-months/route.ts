import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') || '2026-06';

    // Get all sales months recorded
    const salesMonths = db.prepare(`
      SELECT DISTINCT sales_month FROM sales_mtd_data ORDER BY sales_month DESC
    `).all() as { sales_month: string }[];

    const monthList = salesMonths.map(m => m.sales_month);
    if (!monthList.includes(selectedMonth)) {
      monthList.unshift(selectedMonth);
    }

    // Get snapshot summary for selected month
    const snapshotSummary = db.prepare(`
      SELECT 
        COUNT(DISTINCT import_file_id) as total_snapshots,
        MAX(mtd_report_date) as latest_mtd_date,
        COUNT(*) as total_records
      FROM sales_mtd_data
      WHERE sales_month = ?
    `).get(selectedMonth) as any;

    let latestFile = null;
    if (snapshotSummary?.latest_mtd_date) {
      latestFile = db.prepare(`
        SELECT source_filename FROM import_files 
        WHERE sales_month_id = ? AND mtd_report_date = ? AND status = 'COMPLETED'
        ORDER BY created_at DESC LIMIT 1
      `).get(selectedMonth, snapshotSummary.latest_mtd_date) as any;
    }

    // Get historical snapshots list
    const snapshots = db.prepare(`
      SELECT 
        id,
        mtd_report_date,
        source_filename,
        total_selected_month_rows as record_count,
        status,
        created_at,
        r2_object_key
      FROM import_files
      WHERE sales_month_id = ?
      ORDER BY mtd_report_date ASC
    `).all(selectedMonth);

    return NextResponse.json({
      selectedMonth,
      availableMonths: monthList,
      totalSnapshots: snapshotSummary?.total_snapshots || 0,
      latestMtdDate: snapshotSummary?.latest_mtd_date || null,
      latestFilename: latestFile?.source_filename || null,
      totalRecords: snapshotSummary?.total_records || 0,
      snapshots
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
