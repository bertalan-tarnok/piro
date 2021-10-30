import path from 'path';
import fs from 'fs';
import { performance } from 'perf_hooks';

import { buildSync as esbuild } from 'esbuild';

import { Config } from './config';
import * as page from './page';
import * as html from './html';
import { copyRecursiveSync } from './files';

export const build = (cfg: Config) => {
  const startTime = performance.now();

  if (fs.existsSync(cfg.out) && fs.statSync(cfg.out).isDirectory) {
    fs.rmSync(cfg.out, { recursive: true });
  }

  fs.mkdirSync(cfg.out);

  let base = page.parse(cfg, '_base.html');

  const bundleFileName =
    Math.floor(Math.random() * 0xffff_ffff_ffff)
      .toString(16)
      .padStart(8, '0') + '.js';

  const newHead = html.append(
    html.select(['head'], base)!,
    `<script src="/${bundleFileName}" defer></script>`
  );

  base = base.replace(html.select(['head'], base)!, newHead);

  // generate html
  scanFolder(cfg, '', base);

  // copy static files
  copyRecursiveSync(cfg.static, path.join(cfg.out, 'static'));

  // compile ts
  esbuild({
    entryPoints: [path.join(cfg.src, 'index.ts')],
    loader: { '.ts': 'ts' },
    bundle: true,
    outfile: path.join(cfg.out, bundleFileName),
    ...cfg.esbuild,
  });

  console.log('\x1b[32mBuild done');
  console.log(`\x1b[35m[${(performance.now() - startTime).toFixed(2)} ms]\x1b[0m`);
};

const scanFolder = (cfg: Config, folder: string, base: string) => {
  for (const f of fs.readdirSync(path.join(cfg.src, cfg.pages, folder))) {
    if (folder) {
      fs.mkdirSync(path.join(cfg.out, folder));
    }

    if (fs.statSync(path.join(cfg.src, cfg.pages, folder, f)).isDirectory()) {
      scanFolder(cfg, f, base);
      return;
    }

    const dir = f.endsWith('index.html') ? '' : path.join(f.replace(/\.html$/, ''), '');

    if (dir) {
      fs.mkdirSync(path.join(cfg.out, folder, dir));
    }

    fs.writeFileSync(
      path.join(cfg.out, folder, dir, 'index.html'),
      page.createPage(cfg, base, path.join(folder, f)) || ''
    );
  }
};
