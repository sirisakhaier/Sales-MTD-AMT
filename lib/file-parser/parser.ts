import * as XLSX from 'xlsx';
import { loadStoreDimensions, loadModelDimensions } from '../dimension-loader.ts';

function computeBufferHash(buffer: Buffer): string {
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = ((hash << 5) - hash) + buffer[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16) + '_' + buffer.length.toString(16);
}

export interface UnpivotedRecord {
  store_code: string;
  store_name: string;
  province: string;
  region: string;
  store_type: string;
  channel: string;
  store_size: string;
  top_store: string;

  product_code: string;
  product_name: string;
  model: string;
  sku: string;
  category: string;
  chk_cat: string;
  chk_sub_cat: string;
  size: string;
  brand: string;

  sales_month: string; // YYYY-MM
  sales_units: number;
  sales_amount: number;
}

export interface ParseResult {
  fileHash: string;
  extractedDate: string; // YYYY-MM-DD
  extractedSalesMonth: string; // YYYY-MM
  totalSourceRows: number;
  totalUnpivotRows: number;
  totalSelectedMonthRows: number;
  unpivotedRecords: UnpivotedRecord[];
  detectedHeaderRow: number;
  monthlyColumnsFound: string[];
}

export function parseMonthHeader(header: string): string | null {
  if (!header || typeof header !== 'string') return null;
  const str = header.trim();

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const matchText = str.match(/^([A-Za-z]{3})[-_\s]*(\d{2,4})$/);
  if (matchText) {
    const monthKey = matchText[1].toLowerCase();
    let yearStr = matchText[2];
    if (yearStr.length === 2) {
      yearStr = '20' + yearStr;
    }
    if (monthMap[monthKey]) {
      return `${yearStr}-${monthMap[monthKey]}`;
    }
  }

  const matchIso = str.match(/^(\d{4})[-/](\d{2})$/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}`;
  }

  return null;
}

export function extractDateFromFilename(filename: string): { reportDate: string; salesMonth: string } {
  const dateMatch = filename.match(/(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2];
    const day = dateMatch[3];
    return {
      reportDate: `${year}-${month}-${day}`,
      salesMonth: `${year}-${month}`
    };
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return {
    reportDate: `${yyyy}-${mm}-${dd}`,
    salesMonth: `${yyyy}-${mm}`
  };
}

export async function parseMTDFile(
  buffer: Buffer,
  filename: string,
  targetSalesMonth: string
): Promise<ParseResult> {
  const fileHash = computeBufferHash(buffer);


  const { reportDate, salesMonth: extractedMonth } = extractDateFromFilename(filename);

  // Load Store and Model dimensions for joining
  const storeDimMap = loadStoreDimensions();
  const modelDimMap = loadModelDimensions();

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File is empty or could not be read.');
  }

  let headerRowIdx = -1;
  let headers: string[] = [];

  for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    const rowStrings = row.map(cell => String(cell || '').trim());
    const hasItemNum = rowStrings.some(s => s.toLowerCase().includes('item number') || s.toLowerCase().includes('item no'));
    const hasLocNum = rowStrings.some(s => s.toLowerCase().includes('location number') || s.toLowerCase().includes('location no') || s.toLowerCase().includes('store'));
    
    const monthCount = rowStrings.filter(s => parseMonthHeader(s) !== null).length;

    if ((hasItemNum || hasLocNum) && monthCount > 0) {
      headerRowIdx = r;
      headers = rowStrings;
      break;
    }
  }

  if (headerRowIdx === -1) {
    for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const rowStrings = row.map(cell => String(cell || '').trim());
      const monthCount = rowStrings.filter(s => parseMonthHeader(s) !== null).length;
      if (monthCount >= 2) {
        headerRowIdx = r;
        headers = rowStrings;
        break;
      }
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = rawRows.length > 13 ? 13 : 0;
    headers = (rawRows[headerRowIdx] || []).map(cell => String(cell || '').trim());
  }

  let locColIdx = -1;
  let locNameColIdx = -1;
  let itemColIdx = -1;
  let itemDescColIdx = -1;
  let barcodeColIdx = -1;
  let classColIdx = -1;

  const monthColumnMap: { colIdx: number; parsedMonth: string; headerText: string }[] = [];

  headers.forEach((h, idx) => {
    const hLower = h.toLowerCase();
    if (hLower.includes('location number') || hLower.includes('store number') || hLower === 'location') {
      locColIdx = idx;
    } else if (hLower.includes('location name') || hLower.includes('store name')) {
      locNameColIdx = idx;
    } else if (hLower.includes('item number') || hLower.includes('product code') || hLower === 'item') {
      itemColIdx = idx;
    } else if (hLower.includes('item description') || hLower.includes('product name') || hLower.includes('description')) {
      itemDescColIdx = idx;
    } else if (hLower.includes('barcode') || hLower.includes('upc') || hLower.includes('sku')) {
      barcodeColIdx = idx;
    } else if (hLower.includes('class number') || hLower.includes('category')) {
      classColIdx = idx;
    }

    const parsedMonth = parseMonthHeader(h);
    if (parsedMonth) {
      monthColumnMap.push({ colIdx: idx, parsedMonth, headerText: h });
    }
  });

  if (locColIdx === -1) locColIdx = 1;
  if (locNameColIdx === -1) locNameColIdx = 2;
  if (itemColIdx === -1) itemColIdx = 5;
  if (barcodeColIdx === -1) barcodeColIdx = 6;
  if (itemDescColIdx === -1) itemDescColIdx = 7;

  const dataRows = rawRows.slice(headerRowIdx + 1);
  const totalSourceRows = dataRows.length;

  let totalUnpivotRows = 0;
  const unpivotedRecords: UnpivotedRecord[] = [];
  const normTargetMonth = targetSalesMonth.trim();

  for (const row of dataRows) {
    if (!Array.isArray(row) || row.length === 0) continue;

    const origLocNumber = String(row[locColIdx] ?? '').trim();
    const origLocName = locNameColIdx >= 0 ? String(row[locNameColIdx] ?? '').trim() : '';
    const origItemNumber = String(row[itemColIdx] ?? '').trim();
    const origItemDesc = itemDescColIdx >= 0 ? String(row[itemDescColIdx] ?? '').trim() : '';
    const origBarcode = barcodeColIdx >= 0 ? String(row[barcodeColIdx] ?? '').trim() : '';
    const origCategory = classColIdx >= 0 ? String(row[classColIdx] ?? '').trim() : 'General';

    if (!origItemNumber && !origLocNumber) continue;
    if (origItemNumber.toLowerCase().includes('total') || origLocNumber.toLowerCase().includes('total')) continue;

    // Join Store Dimension by Location Number == STORE_ID_CUST
    const storeDim = storeDimMap.get(origLocNumber);
    const resolvedStoreName = storeDim?.store_name_cust || storeDim?.store_name || origLocName || `Store ${origLocNumber}`;
    const province = storeDim?.province || '';
    const region = storeDim?.region || '';
    const storeType = storeDim?.store_type || '';
    const channel = storeDim?.channel || '';
    const storeSize = storeDim?.store_size || '';
    const topStore = storeDim?.top_store || '';

    // Join Model Dimension by Item Number == SKU_NO
    const modelDim = modelDimMap.get(origItemNumber);
    const resolvedProductName = modelDim?.sku_name || origItemDesc;
    const modelName = modelDim?.model || '';
    const barcode = modelDim?.barcode || origBarcode || origItemNumber;
    const chkCat = modelDim?.chk_cat || '';
    const chkSubCat = modelDim?.chk_sub_cat || '';
    const size = modelDim?.size || '';

    for (const mCol of monthColumnMap) {
      const val = row[mCol.colIdx];
      const salesAmt = typeof val === 'number' ? val : parseFloat(String(val ?? '0').replace(/,/g, ''));
      if (isNaN(salesAmt)) continue;

      totalUnpivotRows++;

      if (mCol.parsedMonth === normTargetMonth) {
        unpivotedRecords.push({
          store_code: origLocNumber,
          store_name: resolvedStoreName,
          province,
          region,
          store_type: storeType,
          channel,
          store_size: storeSize,
          top_store: topStore,

          product_code: origItemNumber,
          product_name: resolvedProductName,
          model: modelName,
          sku: barcode,
          category: origCategory,
          chk_cat: chkCat,
          chk_sub_cat: chkSubCat,
          size,
          brand: 'Makro',

          sales_month: mCol.parsedMonth,
          sales_units: 1,
          sales_amount: salesAmt
        });
      }
    }
  }

  return {
    fileHash,
    extractedDate: reportDate,
    extractedSalesMonth: extractedMonth,
    totalSourceRows,
    totalUnpivotRows,
    totalSelectedMonthRows: unpivotedRecords.length,
    unpivotedRecords,
    detectedHeaderRow: headerRowIdx + 1,
    monthlyColumnsFound: monthColumnMap.map(m => `${m.headerText} (${m.parsedMonth})`)
  };
}
