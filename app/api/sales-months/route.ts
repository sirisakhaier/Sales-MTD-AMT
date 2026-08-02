import { NextResponse } from 'next/server';
import { getDB, dbGet, dbAll } from '@/lib/d1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get('month') || '2026-06';
    const db = await getDB();

    const salesMonths = await dbAll<{ sales_month: string }>(db, `
      SELECT DISTINCT sales_month FROM sales_mtd_data ORDER BY sales_month DESC
    `);

    const monthList = salesMonths.map(m => m.sales_month);
    if (!monthList.includes(selectedMonth)) {
      monthList.unshift(selectedMonth);
    }

    const snapshotSummary = await dbGet<any>(db, `
      SELECT 
        COUNT(DISTINCT import_file_id) as total_snapshots,
        MAX(mtd_report_date) as latest_mtd_date,
        COUNT(*) as total_records
      FROM sales_mtd_data
      WHERE sales_month = ?
    `, selectedMonth);

    let latestFile = null;
    if (snapshotSummary?.latest_mtd_date) {
      latestFile = await dbGet<any>(db, `
        SELECT source_filename FROM import_files 
        WHERE sales_month_id = ? AND mtd_report_date = ? AND status = 'COMPLETED'
        ORDER BY created_at DESC LIMIT 1
      `, selectedMonth, snapshotSummary.latest_mtd_date);
    }

    const snapshots = await dbAll(db, `
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
    `, selectedMonth);

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
