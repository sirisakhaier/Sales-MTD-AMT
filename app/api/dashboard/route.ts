import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-06';

    // 1. MTD Trajectory over dates
    const trajectory = db.prepare(`
      SELECT 
        mtd_report_date,
        COUNT(*) as total_records,
        SUM(sales_amount) as total_sales
      FROM sales_mtd_data
      WHERE sales_month = ?
      GROUP BY mtd_report_date
      ORDER BY mtd_report_date ASC
    `).all(month);

    // 2. Top 10 Stores (from latest snapshot date or overall)
    const latestDateObj = db.prepare(`
      SELECT MAX(mtd_report_date) as latest_date FROM sales_mtd_data WHERE sales_month = ?
    `).get(month) as any;

    const latestDate = latestDateObj?.latest_date;

    let topStores: any[] = [];
    let topProducts: any[] = [];
    let categories: any[] = [];

    if (latestDate) {
      topStores = db.prepare(`
        SELECT 
          store_code,
          COALESCE(NULLIF(store_name, ''), 'Store ' || store_code) as store_name,
          SUM(sales_amount) as total_sales
        FROM sales_mtd_data
        WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY store_code
        ORDER BY total_sales DESC
        LIMIT 10
      `).all(month, latestDate);

      topProducts = db.prepare(`
        SELECT 
          product_code,
          product_name,
          category,
          SUM(sales_amount) as total_sales
        FROM sales_mtd_data
        WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY product_code
        ORDER BY total_sales DESC
        LIMIT 10
      `).all(month, latestDate);

      categories = db.prepare(`
        SELECT 
          category,
          SUM(sales_amount) as total_sales
        FROM sales_mtd_data
        WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY category
        ORDER BY total_sales DESC
        LIMIT 6
      `).all(month, latestDate);
    }

    // 3. Overview KPI Cards
    const totalSnapshots = (trajectory as any[]).length;
    const latestSales = (trajectory as any[])[totalSnapshots - 1]?.total_sales || 0;
    const initialSales = (trajectory as any[])[0]?.total_sales || 0;
    const salesGrowth = initialSales > 0 ? ((latestSales - initialSales) / initialSales) * 100 : 0;

    return NextResponse.json({
      salesMonth: month,
      latestDate,
      totalSnapshots,
      latestSales,
      salesGrowth: parseFloat(salesGrowth.toFixed(1)),
      trajectory,
      topStores,
      topProducts,
      categories
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
