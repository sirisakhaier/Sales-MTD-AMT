const fs = require('fs');
const path = require('path');

async function seed() {
  const { parseMTDFile } = require('../lib/file-parser/parser');
  const db = require('../lib/db').default;

  // Execute migration 0003_add_dimensions.sql
  const migration3Path = path.join(process.cwd(), 'migrations', '0003_add_dimensions.sql');
  if (fs.existsSync(migration3Path)) {
    const sql = fs.readFileSync(migration3Path, 'utf8');
    try {
      db.exec(sql);
      console.log('Applied migration 0003_add_dimensions.sql');
    } catch (e) {
      console.log('Migration note:', e.message);
    }
  }

  // Clear previous sample data to re-import with enriched dimensions
  db.prepare('DELETE FROM sales_mtd_data').run();
  db.prepare('DELETE FROM import_files').run();
  db.prepare('DELETE FROM import_batches').run();
  console.log('Cleared existing records for dimension re-seeding.');

  const dataDir = path.join(process.cwd(), 'Data source');
  if (!fs.existsSync(dataDir)) {
    console.log('No Data source folder found');
    return;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx')).sort();
  console.log(`Found ${files.length} sample files in Data source/`);

  const targetSalesMonth = '2026-06';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO sales_months (id, sales_month, month_name, year, status, created_at, updated_at)
    VALUES (?, ?, 'June 2026', 2026, 'ACTIVE', ?, ?)
  `).run(`sm-${targetSalesMonth}`, targetSalesMonth, now, now);

  const insertDataStmt = db.prepare(`
    INSERT INTO sales_mtd_data (
      id, sales_month_id, import_file_id, import_batch_id, sales_month, mtd_report_date,
      source_filename, store_code, store_name, product_code, product_name, sku,
      category, brand, sales_units, sales_amount, created_at, updated_at,
      province, region, store_type, channel, store_size, top_store, model, sku_name, chk_cat, chk_sub_cat, size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFileStmt = db.prepare(`
    INSERT OR IGNORE INTO import_files (
      id, batch_id, sales_month_id, mtd_report_date, source_filename, source_file_hash,
      file_size, file_type, r2_object_key, total_source_rows, total_unpivot_rows,
      total_selected_month_rows, new_records, duplicate_records, error_records,
      status, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const filename of files) {
    const filePath = path.join(dataDir, filename);
    const buffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    console.log(`Processing sample file with Store/Model dimensions: ${filename}...`);
    const parseRes = await parseMTDFile(buffer, filename, targetSalesMonth);

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const batchId = `batch-seed-1`;
    const r2Key = `sales-mtd/2026/2026-06/${parseRes.extractedDate.replace(/-/g, '')}/${filename}`;

    const transaction = db.transaction((records) => {
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const rowId = `rec-${fileId}-${i}`;
        insertDataStmt.run(
          rowId, targetSalesMonth, fileId, batchId, targetSalesMonth, parseRes.extractedDate,
          filename, r.store_code, r.store_name, r.product_code, r.product_name,
          r.sku, r.category, r.brand, r.sales_units, r.sales_amount, now, now,
          r.province, r.region, r.store_type, r.channel, r.store_size, r.top_store,
          r.model, r.product_name, r.chk_cat, r.chk_sub_cat, r.size
        );
      }
    });

    transaction(parseRes.unpivotedRecords);

    insertFileStmt.run(
      fileId, batchId, targetSalesMonth, parseRes.extractedDate, filename, parseRes.fileHash,
      stats.size, 'xls', r2Key, parseRes.totalSourceRows,
      parseRes.totalUnpivotRows, parseRes.totalSelectedMonthRows,
      parseRes.totalSelectedMonthRows, 0, 0, 'COMPLETED', 'system@makro.co.th', now
    );

    console.log(`  Imported & Joined ${parseRes.totalSelectedMonthRows} records for MTD Date: ${parseRes.extractedDate}`);
  }

  console.log('Sample data seeding with Store and Model dimensions complete!');
}

seed().catch(err => console.error('Seed error:', err));
