import fs from 'fs';
import path from 'path';

export interface StoreDimension {
  store_id_cust: string;
  store_name_cust: string;
  customer_name: string;
  store_id: string;
  store_name: string;
  province: string;
  store_type: string;
  region: string;
  channel: string;
  latitude: number | null;
  longitude: number | null;
  store_size: string;
  hub_store: string;
  top_store: string;
  store_rank: string;
}

export interface ModelDimension {
  sku_no: string;
  barcode: string;
  sku_name: string;
  model: string;
  sku_type: string;
  chk_cat: string;
  chk_sub_cat: string;
  size: string;
}

export interface CategoryDimension {
  chk_cat: string;
  category_name: string;
  department: string;
  manager: string;
  remark: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

export function loadStoreDimensions(): Map<string, StoreDimension> {
  const storeMap = new Map<string, StoreDimension>();
  try {
    const filePath = path.join(process.cwd(), 'Data Dimension', 'Store Dimension.csv');
    if (!fs.existsSync(filePath)) return storeMap;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return storeMap;

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
      if (row.length === 0) continue;

      const custCode = idxCust >= 0 ? row[idxCust] : '';
      if (!custCode) continue;

      const dimObj: StoreDimension = {
        store_id_cust: custCode,
        store_name_cust: idxCustName >= 0 ? row[idxCustName] : '',
        customer_name: idxCustName2 >= 0 ? row[idxCustName2] : '',
        store_id: idxStoreId >= 0 ? row[idxStoreId] : '',
        store_name: idxStoreName >= 0 ? row[idxStoreName] : '',
        province: idxProv >= 0 ? row[idxProv] : '',
        store_type: idxType >= 0 ? row[idxType] : '',
        region: idxRegion >= 0 ? row[idxRegion] : '',
        channel: idxChannel >= 0 ? row[idxChannel] : '',
        latitude: idxLat >= 0 && row[idxLat] ? parseFloat(row[idxLat]) : null,
        longitude: idxLng >= 0 && row[idxLng] ? parseFloat(row[idxLng]) : null,
        store_size: idxSize >= 0 ? row[idxSize] : '',
        hub_store: idxHub >= 0 ? row[idxHub] : '',
        top_store: idxTop >= 0 ? row[idxTop] : '',
        store_rank: idxRank >= 0 ? row[idxRank] : '',
      };

      storeMap.set(custCode, dimObj);
      // Also map without leading zeros or formatted numbers
      const numericCode = custCode.replace(/^0+/, '');
      if (numericCode && numericCode !== custCode) {
        storeMap.set(numericCode, dimObj);
      }
      if (dimObj.store_id) {
        storeMap.set(dimObj.store_id, dimObj);
      }
    }
  } catch (err) {
    console.error('Error loading Store Dimension CSV:', err);
  }
  return storeMap;
}

export function loadModelDimensions(): Map<string, ModelDimension> {
  const modelMap = new Map<string, ModelDimension>();
  try {
    const filePath = path.join(process.cwd(), 'Data Dimension', 'Model Dimension.csv');
    if (!fs.existsSync(filePath)) return modelMap;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return modelMap;

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
      if (row.length === 0) continue;

      const skuNo = idxSku >= 0 ? row[idxSku] : '';
      if (!skuNo) continue;

      const dimObj: ModelDimension = {
        sku_no: skuNo,
        barcode: idxBarcode >= 0 ? row[idxBarcode] : '',
        sku_name: idxName >= 0 ? row[idxName] : '',
        model: idxModel >= 0 ? row[idxModel] : '',
        sku_type: idxType >= 0 ? row[idxType] : '',
        chk_cat: idxChkCat >= 0 ? row[idxChkCat] : '',
        chk_sub_cat: idxChkSubCat >= 0 ? row[idxChkSubCat] : '',
        size: idxSize >= 0 ? row[idxSize] : '',
      };

      modelMap.set(skuNo, dimObj);
      const numericSku = skuNo.replace(/^0+/, '');
      if (numericSku && numericSku !== skuNo) {
        modelMap.set(numericSku, dimObj);
      }
    }
  } catch (err) {
    console.error('Error loading Model Dimension CSV:', err);
  }
  return modelMap;
}

export function loadCategoryDimensions(): Map<string, CategoryDimension> {
  const catMap = new Map<string, CategoryDimension>();
  try {
    const filePath = path.join(process.cwd(), 'Data Dimension', 'Category Dimension.csv');
    if (!fs.existsSync(filePath)) return catMap;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return catMap;

    const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().trim());
    const idxChkCat = headers.indexOf('CHK_CAT');
    const idxName = headers.indexOf('CATEGORY_NAME');
    const idxDept = headers.indexOf('DEPARTMENT');
    const idxManager = headers.indexOf('MANAGER');
    const idxRemark = headers.indexOf('REMARK');

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length === 0) continue;

      const chkCat = idxChkCat >= 0 ? row[idxChkCat] : '';
      if (!chkCat) continue;

      const dimObj: CategoryDimension = {
        chk_cat: chkCat,
        category_name: idxName >= 0 ? row[idxName] : '',
        department: idxDept >= 0 ? row[idxDept] : '',
        manager: idxManager >= 0 ? row[idxManager] : '',
        remark: idxRemark >= 0 ? row[idxRemark] : '',
      };

      catMap.set(chkCat, dimObj);
    }
  } catch (err) {
    console.error('Error loading Category Dimension CSV:', err);
  }
  return catMap;
}
