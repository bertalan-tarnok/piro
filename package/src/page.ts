import path from 'path';
import fs from 'fs';
import * as html from './html';
import { Config } from './config';

export const parse = (cfg: Config, pathToPage: string) => {
  let page = fs.readFileSync(path.join(cfg.src, cfg.pages, pathToPage)).toString();

  if (cfg.inject && cfg.inject[pathToPage]) {
    page = cfg.inject[pathToPage](page);
  }

  while (html.select(['import'], page)) {
    const im = html.select(['import'], page);

    if (!im) continue;

    const attrs = html.getAttrs(im);

    if (!attrs) continue;

    const name = Object.keys(attrs)[0];
    const from = attrs['from'];

    if (!name || !from) continue;

    let file = fs.readFileSync(path.join(cfg.src, from)).toString();

    file = html.setAttrs(file, { bit: name }) || file;

    for (const selectedComponent of html.selectAll([name], page)) {
      const cAttrs = html.getAttrs(selectedComponent);
      const cInside = html.getInside(selectedComponent);

      let newComponent = file;

      if (cInside) {
        newComponent = html.setInside(newComponent, cInside);
      }

      page = page.replace(selectedComponent, html.setAttrs(newComponent, cAttrs || {}) || '');
    }

    page = page.replace(im, '');
  }

  let head = html.select(['head'], page);
  if (!head) return page;

  const riHeads = html.selectAll(['bit-head'], page);

  for (const h of riHeads) {
    head = html.append(head, html.getInside(h) || '');
    page = page.replace(h, '');
  }

  page = page.replace(html.select(['head'], page)!, head);

  return page;
};

// `base` should already be parsed
export const createPage = (cfg: Config, base: string, pathToPage: string) => {
  const body = html.select(['body'], base);

  if (!body) return null;

  const page = parse(cfg, pathToPage);
  const result = html.setInside(body, html.getInside(body) + page);
  return base.replace(body, result);
};
