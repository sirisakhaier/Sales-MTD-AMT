import { NextResponse } from 'next/server';
import { getDB, dbGet, dbRun } from '@/lib/d1';
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

    const db = await getDB();
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
    const existingMonth = await dbGet(db, 'SELECT id FROM sales_months WHERE sales_month = ?', salesMonth);
    if (!existingMonth) {
      const monthParts = salesMonth.split('-');
      const year = parseInt(monthParts[0], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(monthParts[1], 10) - 1] + ' ' + year;
      
      await dbRun(db, `
        INSERT INTO sales_months (id, sales_month, month_name, year, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      `, `sm-${salesMonth}`, salesMonth, monthName, year, now, now);
    }

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
        const existingHash = await dbGet<any>(db, 'SELECT id, source_filename FROM import_files WHERE source_file_hash = ?', parseRes.fileHash);
        if (existingHash) {
          duplicateRecords += parseRes.totalSelectedMonthRows;
          fileResults.push({
            filename: file.name,
            status: 'DUPLICATE',
            message: `File hash matches existing file: ${existingHash.source_filename}`,
            records: 0
          });

          await dbRun(db, `
            INSERT INTO import_files (
              id, batch_id, sales_month_id, mtd_report_date, source_filename, source_file_hash,
              file_size, file_type, r2_object_key, total_source_rows, total_unpivot_rows,
              total_selected_month_rows, new_records, duplicate_records, error_records,
              status, uploaded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
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

        // Insert unpivoted & joined records in D1 batch chunks
        const records = parseRes.unpivotedRecords;
        const insertSql = `
          INSERT INTO sales_mtd_data (
            id, sales_month_id, import_file_id, import_batch_id, sales_month, mtd_report_date,
            source_filename, store_code, store_name, product_code, product_name, sku,
            category, brand, sales_units, sales_amount, created_at, updated_at,
            province, region, store_type, channel, store_size, top_store, model, sku_name, chk_cat, chk_sub_cat, size
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const chunkSize = 50;
        for (let i = 0; i < records.length; i += chunkSize) {
          const chunk = records.slice(i, i + chunkSize);
          const stmts = chunk.map((r, idx) => {
            const rowId = `rec-${fileId}-${i + idx}`;
            return db.prepare(insertSql).bind(
              rowId, salesMonth, fileId, batchId, salesMonth, reportDate,
              file.name, r.store_code, r.store_name, r.product_code, r.product_name,
              r.sku, r.category, r.brand, r.sales_units, r.sales_amount, now, now,
              r.province, r.region, r.store_type, r.channel, r.store_size, r.top_store,
              r.model, r.product_name, r.chk_cat, r.chk_sub_cat, r.size
            );
          });
          await db.batch(stmts);
        }

        newRecords += parseRes.totalSelectedMonthRows;

        await dbRun(db, `
          INSERT INTO import_files (
            id, batch_id, sales_month_id, mtd_report_date, source_filename, source_file_hash,
            file_size, file_type, r2_object_key, total_source_rows, total_unpivot_rows,
            total_selected_month_rows, new_records, duplicate_records, error_records,
            status, uploaded_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
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

    await dbRun(db, `
      INSERT INTO import_batches (
        id, sales_month_id, batch_name, uploaded_by, total_files, total_source_rows,
        total_unpivot_rows, total_selected_month_rows, new_records, duplicate_records,
        error_records, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `,
      batchId, salesMonth, `Batch Upload ${now.substring(0, 10)}`, userEmail,
      files.length, totalSourceRows, totalUnpivotRows, totalSelectedMonthRows,
      newRecords, duplicateRecords, errorRecords, now
    );

    await dbRun(db, `
      INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, description, created_at)
      VALUES (?, ?, 'FILE_UPLOAD', 'IMPORT_BATCH', ?, ?, ?)
    `,
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
