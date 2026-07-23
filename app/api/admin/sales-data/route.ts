import { NextResponse } from 'next/server';
import db from '@/lib/db';

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

    const countQuery = `SELECT COUNT(*) as total FROM sales_mtd_data ${whereString}`;
    const totalRow = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalRow.total;

    const dataQuery = `
      SELECT * FROM sales_mtd_data 
      ${whereString}
      ORDER BY mtd_report_date DESC, store_code ASC 
      LIMIT ? OFFSET ?
    `;

    const records = db.prepare(dataQuery).all(...params, limit, offset);

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

    db.prepare('DELETE FROM sales_mtd_data WHERE id = ?').run(id);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'SALES_DATA_DELETED', 'SALES_MTD_DATA', ?, ?, ?)
    `).run(`aud-${Date.now()}`, userEmail, id, `Deleted single sales data row ${id}`, now);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
