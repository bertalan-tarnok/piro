import fs from 'fs';
import path from 'path';

export const copyRecursiveSync = (src: string, dest: string) => {
  const exists = fs.existsSync(src);
  if (!exists) return;

  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);

    for (const f of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, f), path.join(dest, f));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
};
