const fs = require('fs');
const path = require('path');

async function test() {
  const samplePath = path.join(process.cwd(), 'Data source', 'Sales by Item - Monthly - Amt_Sales by Item - Monthly - Amt 20260621.xls');
  const buffer = fs.readFileSync(samplePath);
  
  const { parseMTDFile } = require('../lib/file-parser/parser');
  console.log('Testing parser on:', path.basename(samplePath));
  const res = await parseMTDFile(buffer, path.basename(samplePath), '2026-06');
  console.log('Result:', {
    fileHash: res.fileHash.substring(0, 16) + '...',
    extractedDate: res.extractedDate,
    extractedSalesMonth: res.extractedSalesMonth,
    totalSourceRows: res.totalSourceRows,
    totalUnpivotRows: res.totalUnpivotRows,
    totalSelectedMonthRows: res.totalSelectedMonthRows,
    detectedHeaderRow: res.detectedHeaderRow,
    monthlyColumnsFoundCount: res.monthlyColumnsFound.length,
    sampleRecord: res.unpivotedRecords[0]
  });
}

test().catch(err => console.error('Test error:', err));
