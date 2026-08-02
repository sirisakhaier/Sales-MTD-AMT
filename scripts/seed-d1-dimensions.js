const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function seedDimensions(isLocal = true) {
  const flag = isLocal ? '--local' : '--remote';
  console.log(`Seeding 3 CSV dimensions into D1 (${isLocal ? 'local' : 'remote'})...`);

  const sqlStatements = [];

  // 1. Store Dimension CSV
  const storePath = path.join(process.cwd(), 'Data Dimension', 'Store Dimension.csv');
  if (fs.existsSync(storePath)) {
    const lines = fs.readFileSync(storePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().trim());
      const idxCust = headers.indexOf('STORE_ID_CUST');
      const idxCustName = headers.indexOf('STORE_NAME_CUST');
      const idxCustName2 = headers.indexOf('CUSTOMER_NAME');
      const idxStoreId = headers.indexOf('STORE_ID');
      const idxStoreName = headers.indexOf('STORE_NAME');
      const idxProv = headers.indexOf('PROVINCE');
      const idxType = headers.indexOf('STORE_TYPE');
      const idxRegion = headers.indexOf('REGION');
      const idxChannel = headers.indexOf('CHANNEL');
      const idxLat = headers.indexOf('LATITUDE');
      const idxLng = headers.indexOf('LONGITUDE');
      const idxSize = headers.indexOf('STORE_SIZE');
      const idxHub = headers.indexOf('HUB_STORE');
      const idxTop = headers.indexOf('TOP_STORE');
      const idxRank = headers.indexOf('STORE_RANK');

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        const custCode = row[idxCust];
        if (!custCode) continue;

        const sql = `INSERT OR REPLACE INTO dim_stores (
          store_id_cust, store_name_cust, customer_name, store_id, store_name,
          province, store_type, region, channel, latitude, longitude,
          store_size, hub_store, top_store, store_rank
        ) VALUES (
          ${escapeSql(custCode)}, ${escapeSql(row[idxCustName])}, ${escapeSql(row[idxCustName2])},
          ${escapeSql(row[idxStoreId])}, ${escapeSql(row[idxStoreName])}, ${escapeSql(row[idxProv])},
          ${escapeSql(row[idxType])}, ${escapeSql(row[idxRegion])}, ${escapeSql(row[idxChannel])},
          ${row[idxLat] ? parseFloat(row[idxLat]) : 'NULL'}, ${row[idxLng] ? parseFloat(row[idxLng]) : 'NULL'},
          ${escapeSql(row[idxSize])}, ${escapeSql(row[idxHub])}, ${escapeSql(row[idxTop])}, ${escapeSql(row[idxRank])}
        );`;
        sqlStatements.push(sql);
      }
    }
  }

  // 2. Model Dimension CSV
  const modelPath = path.join(process.cwd(), 'Data Dimension', 'Model Dimension.csv');
  if (fs.existsSync(modelPath)) {
    const lines = fs.readFileSync(modelPath, 'utf8').split(/\r?\n/).filter(l => l.trim());
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().trim());
      const idxSku = headers.indexOf('SKU_NO');
      const idxBarcode = headers.indexOf('BARCODE');
      const idxName = headers.indexOf('SKU_NAME');
      const idxModel = headers.indexOf('MODEL');
      const idxType = headers.indexOf('SKU_TYPE');
      const idxChkCat = headers.indexOf('CHK_CAT');
      const idxChkSubCat = headers.indexOf('CHK_SUB_CAT');
      const idxSize = headers.indexOf('SIZE');

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        const skuNo = row[idxSku];
        if (!skuNo) continue;

        const sql = `INSERT OR REPLACE INTO dim_models (
          sku_no, barcode, sku_name, model, sku_type, chk_cat, chk_sub_cat, size
        ) VALUES (
          ${escapeSql(skuNo)}, ${escapeSql(row[idxBarcode])}, ${escapeSql(row[idxName])},
          ${escapeSql(row[idxModel])}, ${escapeSql(row[idxType])}, ${escapeSql(row[idxChkCat])},
          ${escapeSql(row[idxChkSubCat])}, ${escapeSql(row[idxSize])}
        );`;
        sqlStatements.push(sql);
      }
    }
  }

  // 3. Category Dimension CSV
  const catPath = path.join(process.cwd(), 'Data Dimension', 'Category Dimension.csv');
  if (fs.existsSync(catPath)) {
    const lines = fs.readFileSync(catPath, 'utf8').split(/\r?\n/).filter(l => l.trim());
    if (lines.length > 1) {
      const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().trim());
      const idxChkCat = headers.indexOf('CHK_CAT');
      const idxName = headers.indexOf('CATEGORY_NAME');
      const idxDept = headers.indexOf('DEPARTMENT');
      const idxManager = headers.indexOf('MANAGER');
      const idxRemark = headers.indexOf('REMARK');

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        const chkCat = row[idxChkCat];
        if (!chkCat) continue;

        const sql = `INSERT OR REPLACE INTO dim_categories (
          chk_cat, category_name, department, manager, remark
        ) VALUES (
          ${escapeSql(chkCat)}, ${escapeSql(row[idxName])}, ${escapeSql(row[idxDept])},
          ${escapeSql(row[idxManager])}, ${escapeSql(row[idxRemark])}
        );`;
        sqlStatements.push(sql);
      }
    }
  }

  // Add default admin user
  sqlStatements.push(`INSERT OR IGNORE INTO users (id, email, username, full_name, role, is_active, created_at, updated_at) VALUES ('usr-admin', 'admin@makro.co.th', 'admin', 'System Administrator', 'ADMIN', 1, datetime('now'), datetime('now'));`);

  console.log(`Generated ${sqlStatements.length} SQL Statements for 3 CSV dimensions & admin user.`);

  // Write to temporary sql file
  const tmpSqlPath = path.join(process.cwd(), 'scripts', 'tmp_seed.sql');
  fs.writeFileSync(tmpSqlPath, sqlStatements.join('\n'));

  try {
    const output = execSync(`npx wrangler d1 execute sales-mtd-db ${flag} --file="${tmpSqlPath}"`, { encoding: 'utf8' });
    console.log('Seeding result:\n', output);
  } catch (err) {
    console.error('Wrangler D1 execution failed:', err.message);
  } finally {
    if (fs.existsSync(tmpSqlPath)) fs.unlinkSync(tmpSqlPath);
  }
}

const isLocal = !process.argv.includes('--remote');
seedDimensions(isLocal);
