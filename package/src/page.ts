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

    // remove <import />
    page = page.replace(im, '');

    if (!attrs) continue;

    const name = Object.keys(attrs)[0];
    const from = attrs['from'];

    if (!name || !from) continue;

    let file = fs.readFileSync(path.join(cfg.src, from)).toString();

    const exportTag = html.select(['export'], file);

    if (!exportTag) continue;

    let exportedHTML = html.getInside(exportTag)!;
    const exportAttrs = html.getAttrs(exportTag);

    exportedHTML = html.appendAttrs(exportedHTML, { part: name }) || exportedHTML;

    for (const selectedComponent of html.selectAll([name], page)) {
      const cAttrs = html.getAttrs(selectedComponent);
      const cInside = html.getInside(selectedComponent);

      let newComponent = file;
      let newHTML = exportedHTML;

      for (const e in exportAttrs) {
        let cAttr = (cAttrs || {})[e];

        if (e === 'inside') {
          cAttr = cInside || '';
        }

        newHTML = newHTML.replace(new RegExp(`{${e}}`, 'g'), cAttr || exportAttrs[e] || '');
      }

      newComponent = newComponent.replace(exportTag, newHTML);

      page = page.replace(selectedComponent, newComponent);
    }
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

  base = base.replace(head, html.appendAttrs(head, { 'base-head': 'true' })!);

  const headParts = html.selectAll(['head'], base);

  for (const h of headParts) {
    if ((html.getAttrs(h) || {})['base-head'] === 'true') continue;

    // remove the head tag
    base = base.replace(h, '');

    const inside = html.getInside(h);
    if (!inside || head.includes(inside)) continue;

    head = html.append(head, inside);
  }

  base = base.replace(html.select(['head'], base)!, head);

  return minify(base);
};
