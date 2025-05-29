import fs from 'fs/promises';
import path from 'path';

export async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      totalSize += await calculateDirectorySize(fullPath);
    } else {
      const stats = await fs.stat(fullPath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

// Check if operation would exceed size limit
export async function wouldExceedSizeLimit(
  projectRoot: string, 
  newFileSize: number,
  storageLimit: number
): Promise<boolean> {
  const currentSize = await calculateDirectorySize(projectRoot);
  return (currentSize + newFileSize) > storageLimit;
} 