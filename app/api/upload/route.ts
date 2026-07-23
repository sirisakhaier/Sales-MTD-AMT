import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { parseMTDFile } from '@/lib/file-parser/parser';
import { saveFileToR2 } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const salesMonth = (formData.get('salesMonth') as string) || '2026-06';
    const userEmail = (formData.get('userEmail') as string) || 'admin@makro.co.th';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    let totalSourceRows = 0;
    let totalUnpivotRows = 0;
    let totalSelectedMonthRows = 0;
    let newRecords = 0;
    let duplicateRecords = 0;
    let errorRecords = 0;

    const fileResults: any[] = [];

    // Ensure sales_months entry exists
    const existingMonth = db.prepare('SELECT id FROM sales_months WHERE sales_month = ?').get(salesMonth);
    if (!existingMonth) {
      const monthParts = salesMonth.split('-');
      const year = parseInt(monthParts[0], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(monthParts[1], 10) - 1] + ' ' + year;
      
      db.prepare(`
        INSERT INTO sales_months (id, sales_month, month_name, year, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(`sm-${salesMonth}`, salesMonth, monthName, year, now, now);
    }

    const insertDataStmt = db.prepare(`
      INSERT INTO sales_mtd_data (
        id, sales_month_id, import_file_id, import_batch_id, sales_month, mtd_report_date,
        source_filename, store_code, store_name, product_code, product_name, sku,
        category, brand, sales_units, sales_amount, created_at, updated_at,
        province, region, store_type, channel, store_size, top_store, model, sku_name, chk_cat, chk_sub_cat, size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFileStmt = db.prepare(`
      INSERT INTO import_files (
        id, batch_id, sales_month_id, mtd_report_date, source_filename, source_file_hash,
        file_size, file_type, r2_object_key, total_source_rows, total_unpivot_rows,
        total_selected_month_rows, new_records, duplicate_records, error_records,
        status, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of files) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const parseRes = await parseMTDFile(buffer, file.name, salesMonth);
        const reportDate = parseRes.extractedDate;

        totalSourceRows += parseRes.totalSourceRows;
        totalUnpivotRows += parseRes.totalUnpivotRows;
        totalSelectedMonthRows += parseRes.totalSelectedMonthRows;

        // Check SHA-256 duplicate file
        const existingHash = db.prepare('SELECT id, source_filename FROM import_files WHERE source_file_hash = ?').get(parseRes.fileHash) as any;
        if (existingHash) {
          duplicateRecords += parseRes.totalSelectedMonthRows;
          fileResults.push({
            filename: file.name,
            status: 'DUPLICATE',
            message: `File hash matches existing file: ${existingHash.source_filename}`,
            records: 0
          });

          insertFileStmt.run(
            fileId, batchId, salesMonth, reportDate, file.name, parseRes.fileHash,
            file.size, file.type || 'xls', '', parseRes.totalSourceRows,
            parseRes.totalUnpivotRows, parseRes.totalSelectedMonthRows, 0,
            parseRes.totalSelectedMonthRows, 0, 'DUPLICATE', userEmail, now
          );
          continue;
        }

        // Save original file in R2 Storage
        const r2Key = await saveFileToR2(
          buffer,
          salesMonth.split('-')[0],
          salesMonth,
          reportDate.replace(/-/g, ''),
          file.name
        );

        // Insert unpivoted & joined records in transaction
        const transaction = db.transaction((records: typeof parseRes.unpivotedRecords) => {
          for (let i = 0; i < records.length; i++) {
            const r = records[i];
            const rowId = `rec-${fileId}-${i}`;
            insertDataStmt.run(
              rowId, salesMonth, fileId, batchId, salesMonth, reportDate,
              file.name, r.store_code, r.store_name, r.product_code, r.product_name,
              r.sku, r.category, r.brand, r.sales_units, r.sales_amount, now, now,
              r.province, r.region, r.store_type, r.channel, r.store_size, r.top_store,
              r.model, r.product_name, r.chk_cat, r.chk_sub_cat, r.size
            );
          }
        });

        transaction(parseRes.unpivotedRecords);
        newRecords += parseRes.totalSelectedMonthRows;

        insertFileStmt.run(
          fileId, batchId, salesMonth, reportDate, file.name, parseRes.fileHash,
          file.size, file.type || 'xls', r2Key, parseRes.totalSourceRows,
          parseRes.totalUnpivotRows, parseRes.totalSelectedMonthRows,
          parseRes.totalSelectedMonthRows, 0, 0, 'COMPLETED', userEmail, now
        );

        fileResults.push({
          filename: file.name,
          status: 'COMPLETED',
          reportDate,
          records: parseRes.totalSelectedMonthRows,
          unpivotRows: parseRes.totalUnpivotRows,
          sourceRows: parseRes.totalSourceRows
        });

      } catch (err: any) {
        errorRecords++;
        fileResults.push({
          filename: file.name,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    db.prepare(`
      INSERT INTO import_batches (
        id, sales_month_id, batch_name, uploaded_by, total_files, total_source_rows,
        total_unpivot_rows, total_selected_month_rows, new_records, duplicate_records,
        error_records, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `).run(
      batchId, salesMonth, `Batch Upload ${now.substring(0, 10)}`, userEmail,
      files.length, totalSourceRows, totalUnpivotRows, totalSelectedMonthRows,
      newRecords, duplicateRecords, errorRecords, now
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'FILE_UPLOAD', 'IMPORT_BATCH', ?, ?, ?)
    `).run(
      `aud-${Date.now()}`, userEmail, batchId,
      `Uploaded ${files.length} file(s) for ${salesMonth}. Joined with Store and Model dimension data. Imported ${newRecords} records.`,
      now
    );

    return NextResponse.json({
      success: true,
      batchId,
      salesMonth,
      totalFiles: files.length,
      newRecords,
      duplicateRecords,
      errorRecords,
      fileResults
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
