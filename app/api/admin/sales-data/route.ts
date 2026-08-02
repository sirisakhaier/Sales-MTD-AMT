import { NextResponse } from 'next/server';
import { getDB, dbGet, dbAll, dbRun } from '@/lib/d1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const salesMonth = searchParams.get('salesMonth');
    const mtdReportDate = searchParams.get('mtdReportDate');
    const storeCode = searchParams.get('storeCode');
    const productCode = searchParams.get('productCode');
    const search = searchParams.get('search');

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (salesMonth) {
      whereClauses.push('sales_month = ?');
      params.push(salesMonth);
    }
    if (mtdReportDate) {
      whereClauses.push('mtd_report_date = ?');
      params.push(mtdReportDate);
    }
    if (storeCode) {
      whereClauses.push('store_code = ?');
      params.push(storeCode);
    }
    if (productCode) {
      whereClauses.push('product_code = ?');
      params.push(productCode);
    }
    if (search) {
      whereClauses.push('(product_name LIKE ? OR store_name LIKE ? OR product_code LIKE ? OR store_code LIKE ? OR source_filename LIKE ?)');
      const sPattern = `%${search}%`;
      params.push(sPattern, sPattern, sPattern, sPattern, sPattern);
    }

    const whereString = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const db = await getDB();
    const countQuery = `SELECT COUNT(*) as total FROM sales_mtd_data ${whereString}`;
    const totalRow = await dbGet<{ total: number }>(db, countQuery, ...params);
    const total = totalRow?.total || 0;

    const dataQuery = `
      SELECT * FROM sales_mtd_data 
      ${whereString}
      ORDER BY mtd_report_date DESC, store_code ASC 
      LIMIT ? OFFSET ?
    `;

    const records = await dbAll(db, dataQuery, ...params, limit, offset);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      records
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail') || 'admin@makro.co.th';

    if (!id) {
      return NextResponse.json({ error: 'Record ID required' }, { status: 400 });
    }

    const db = await getDB();
    await dbRun(db, 'DELETE FROM sales_mtd_data WHERE id = ?', id);

    const now = new Date().toISOString();
    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'SALES_DATA_DELETED', 'SALES_MTD_DATA', ?, ?, ?)
    `, `aud-${Date.now()}`, userEmail, id, `Deleted single sales data row ${id}`, now);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
