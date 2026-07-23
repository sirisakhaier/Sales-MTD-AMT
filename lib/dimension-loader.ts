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

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

export function loadStoreDimensions(): Map<string, StoreDimension> {
  const storeMap = new Map<string, StoreDimension>();
  const filePath = path.join(process.cwd(), 'Data Dimension', 'Store Dimension.csv');

  if (!fs.existsSync(filePath)) return storeMap;

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return storeMap;

  const headers = parseCSVLine(lines[0]);
  const storeIdIdx = headers.indexOf('STORE_ID_CUST');
  const storeNameCustIdx = headers.indexOf('STORE_NAME_CUST');
  const custNameIdx = headers.indexOf('CUSTOMER_NAME');
  const storeIdIdxCol = headers.indexOf('STORE_ID');
  const storeNameIdx = headers.indexOf('STORE_NAME');
  const provIdx = headers.indexOf('PROVINCE');
  const storeTypeIdx = headers.indexOf('STORE_TYPE');
  const regionIdx = headers.indexOf('REGION');
  const channelIdx = headers.indexOf('CHANNEL');
  const latIdx = headers.indexOf('Latitude');
  const lngIdx = headers.indexOf('Longitude');
  const sizeIdx = headers.indexOf('STORE_SIZE');
  const hubIdx = headers.indexOf('HUB_STORE');
  const topIdx = headers.indexOf('TOP_STORE');
  const rankIdx = headers.indexOf('STORE_RANK');

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const storeIdCust = String(cols[storeIdIdx] ?? '').trim();
    if (!storeIdCust) continue;

    storeMap.set(storeIdCust, {
      store_id_cust: storeIdCust,
      store_name_cust: cols[storeNameCustIdx] || '',
      customer_name: cols[custNameIdx] || '',
      store_id: cols[storeIdIdxCol] || '',
      store_name: cols[storeNameIdx] || '',
      province: cols[provIdx] || '',
      store_type: cols[storeTypeIdx] || '',
      region: cols[regionIdx] || '',
      channel: cols[channelIdx] || '',
      latitude: latIdx >= 0 ? parseFloat(cols[latIdx]) || null : null,
      longitude: lngIdx >= 0 ? parseFloat(cols[lngIdx]) || null : null,
      store_size: cols[sizeIdx] || '',
      hub_store: cols[hubIdx] || '',
      top_store: cols[topIdx] || '',
      store_rank: cols[rankIdx] || ''
    });
  }

  return storeMap;
}

export function loadModelDimensions(): Map<string, ModelDimension> {
  const modelMap = new Map<string, ModelDimension>();
  const filePath = path.join(process.cwd(), 'Data Dimension', 'Model Dimension.csv');

  if (!fs.existsSync(filePath)) return modelMap;

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return modelMap;

  const headers = parseCSVLine(lines[0]);
  const skuNoIdx = headers.indexOf('SKU_NO');
  const barcodeIdx = headers.indexOf('BARCODE');
  const skuNameIdx = headers.indexOf('SKU_NAME');
  const modelIdx = headers.indexOf('MODEL');
  const skuTypeIdx = headers.indexOf('SKU_TYPE');
  const chkCatIdx = headers.indexOf('CHK_CAT');
  const chkSubCatIdx = headers.indexOf('CHK_SUB_CAT');
  const sizeIdx = headers.indexOf('SIZE');

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const skuNo = String(cols[skuNoIdx] ?? '').trim();
    if (!skuNo) continue;

    modelMap.set(skuNo, {
      sku_no: skuNo,
      barcode: cols[barcodeIdx] || '',
      sku_name: cols[skuNameIdx] || '',
      model: cols[modelIdx] || '',
      sku_type: cols[skuTypeIdx] || '',
      chk_cat: cols[chkCatIdx] || '',
      chk_sub_cat: cols[chkSubCatIdx] || '',
      size: cols[sizeIdx] || ''
    });
  }

  return modelMap;
}
