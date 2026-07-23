import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'r2_storage');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export async function saveFileToR2(
  buffer: Buffer,
  year: string,
  month: string,
  reportDateStr: string,
  filename: string
): Promise<string> {
  const objectKey = `sales-mtd/${year}/${month}/${reportDateStr}/${filename}`;
  const localFilePath = path.join(STORAGE_DIR, objectKey.replace(/\//g, '_'));

  fs.writeFileSync(localFilePath, buffer);
  return objectKey;
}

export function getFileFromR2(objectKey: string): Buffer | null {
  const localFilePath = path.join(STORAGE_DIR, objectKey.replace(/\//g, '_'));
  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath);
  }
  return null;
}
