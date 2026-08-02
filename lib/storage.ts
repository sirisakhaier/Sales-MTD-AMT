import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function saveFileToR2(
  buffer: Buffer,
  year: string,
  month: string,
  reportDateStr: string,
  filename: string
): Promise<string> {
  const objectKey = `sales-mtd/${year}/${month}/${reportDateStr}/${filename}`;
  try {
    const ctx = getCloudflareContext();
    const r2 = (ctx.env as any).R2_STORAGE;
    if (r2 && typeof r2.put === 'function') {
      await r2.put(objectKey, buffer);
    }
  } catch (e) {
    console.warn('R2 Storage notice:', e);
  }
  return objectKey;
}

export async function getFileFromR2(objectKey: string): Promise<ArrayBuffer | null> {
  try {
    const ctx = getCloudflareContext();
    const r2 = (ctx.env as any).R2_STORAGE;
    if (r2 && typeof r2.get === 'function') {
      const item = await r2.get(objectKey);
      if (item) {
        return await item.arrayBuffer();
      }
    }
  } catch (e) {
    console.warn('R2 get notice:', e);
  }
  return null;
}
