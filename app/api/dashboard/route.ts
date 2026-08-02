import { NextResponse } from 'next/server';
import { getDB, dbGet, dbAll } from '@/lib/d1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-06';
    const db = await getDB();

    const trajectory = await dbAll(db, `
      SELECT mtd_report_date, COUNT(*) as total_records, SUM(sales_amount) as total_sales
      FROM sales_mtd_data WHERE sales_month = ?
      GROUP BY mtd_report_date ORDER BY mtd_report_date ASC
    `, month);

    const latestDateObj = await dbGet(db, `SELECT MAX(mtd_report_date) as latest_date FROM sales_mtd_data WHERE sales_month = ?`, month);
    const latestDate = latestDateObj?.latest_date;

    let topStores: any[] = [];
    let topProducts: any[] = [];
    let categories: any[] = [];

    if (latestDate) {
      topStores = await dbAll(db, `
        SELECT store_code, COALESCE(NULLIF(store_name, ''), 'Store ' || store_code) as store_name, SUM(sales_amount) as total_sales
        FROM sales_mtd_data WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY store_code ORDER BY total_sales DESC LIMIT 10
      `, month, latestDate);

      topProducts = await dbAll(db, `
        SELECT product_code, product_name, category, SUM(sales_amount) as total_sales
        FROM sales_mtd_data WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY product_code ORDER BY total_sales DESC LIMIT 10
      `, month, latestDate);

      categories = await dbAll(db, `
        SELECT category, SUM(sales_amount) as total_sales
        FROM sales_mtd_data WHERE sales_month = ? AND mtd_report_date = ?
        GROUP BY category ORDER BY total_sales DESC LIMIT 6
      `, month, latestDate);
    }

    const totalSnapshots = trajectory.length;
    const latestSales = trajectory[totalSnapshots - 1]?.total_sales || 0;
    const initialSales = trajectory[0]?.total_sales || 0;
    const salesGrowth = initialSales > 0 ? ((latestSales - initialSales) / initialSales) * 100 : 0;

    return NextResponse.json({
      salesMonth: month, latestDate, totalSnapshots, latestSales,
      salesGrowth: parseFloat(salesGrowth.toFixed(1)),
      trajectory, topStores, topProducts, categories
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
