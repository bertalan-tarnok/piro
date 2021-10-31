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

    file = html.setAttrs(file, { ...html.getAttrs(file), part: name }) || file;

    for (const selectedComponent of html.selectAll([name], page)) {
      const cAttrs = html.getAttrs(selectedComponent);
      const cInside = html.getInside(selectedComponent);

      let newComponent = file;

      if (cInside) {
        newComponent = html.setInside(newComponent, html.getInside(newComponent) + cInside);
      }

      const newAttrs = { ...html.getAttrs(newComponent), ...cAttrs };

      page = page.replace(selectedComponent, html.setAttrs(newComponent, newAttrs) || '');
    }

    page = page.replace(im, '');
  }

  return page;
};

const minify = (s: string) => {
  return s.replace(/((?<=>)\s+(?=\S))|((?<=\S)\s+(?=<))/g, '');
};

// `base` should already be parsed
export const createPage = (cfg: Config, base: string, pathToPage: string) => {
  const body = html.select(['body'], base);
  let head = html.select(['head'], base);

  if (!body) return null;
  let page = parse(cfg, pathToPage);
  const newBody = html.setInside(body, html.getInside(body) + page);

  base = base.replace(body, newBody);

  if (!head) return minify(base);

  const headParts = html.selectAll(['head'], base);

  for (const h of headParts) {
    // remove the head tag
    base = base.replace(h, '');

    const inside = html.getInside(h);
    if (!inside || head.includes(inside)) continue;

    head = html.append(head, inside);
  }

  base = base.replace(html.select(['head'], base)!, head);

  return minify(base);
};
