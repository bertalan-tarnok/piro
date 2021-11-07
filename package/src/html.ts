const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr ',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
  // this is for piro (not real html)
  'import',
];

const open = (tagname: string) => `<${tagname}(\\s+[\\w-]+(="[^"]*")?)*\\s*/?>`;

type selectQuery = [string, { [key: string]: string }?];

const brain = {
  select: (tag: selectQuery, from: string, all: boolean): string | string[] | null => {
    const openRe = new RegExp(open(tag[0]), 'g');
    const fullRe = new RegExp(open(tag[0]) + `[^]*?</${tag[0]}>`, 'g');

    const selfClosing = selfClosingTags.includes(tag[0]);
    let result = from.match(selfClosing ? openRe : fullRe) || [];

    for (const a in tag[1] || {}) {
      const re = new RegExp(`\\s+${a}="${tag[1]![a]}"`, 'g');

      for (const r of result) {
        if (!r.match(re)) {
          // removes item if the attrs don't match
          result = result.filter((item) => item !== r);
        }
      }
    }

    if (all) {
      return result;
    } else {
      return (result.length > 0 ? result : [null])[0];
    }
  },
};

export const select = (tag: selectQuery, from: string) => {
  return brain.select(tag, from, false) as string | null;
};

export const selectAll = (tag: selectQuery, from: string) => {
  return brain.select(tag, from, true) as string[];
};

export const getAttrs = (tag: string) => {
  const start = (tag.match(/<[\w-]+(\s+[\w-]+(="[^"]*")?)*\s*\/?>/) || [null])[0];

  if (!start) return null;

  const attrsRe = /(?!(<[\w-]+))(\s+[a\w-]+(="[^"]*")?)*(?=\s*\/?>)/;
  let attrsRaw = (start.match(attrsRe) || [null])[0];

  if (!attrsRaw) return null;

  const result: { [key: string]: string } = {};

  for (const a of attrsRaw.trim().match(/[\w-]+(="[^"]*")?/g) || []) {
    const key = a.split('=')[0];
    const value = (a.split('=')[1] || '').replace(/"/g, '');
    result[key] = value;
  }

  return result;
};

export const setAttrs = (tag: string, attrs: { [key: string]: string }) => {
  const start = (tag.match(/<[\w-]+(\s+[\w-]+(="[^"]*")?)*\s*\/?>/) || [null])[0];

  if (!start) return null;

  const end = start.match(/\/?>$/);
  let newStart = start.replace(new RegExp(/(\s*[\w-]+="[^"]*"\s*)*\/?>$/), '');

  for (const a in attrs) {
    newStart += ` ${a}`;

    if (!attrs[a]) continue;

    newStart += `="${attrs[a]}"`;
  }

  newStart += end;

  return tag.replace(start, newStart);
};

export const appendAttrs = (tag: string, attrs: { [key: string]: string }) => {
  return setAttrs(tag, { ...getAttrs(tag), ...attrs });
};

export const getInside = (tag: string) => {
  return (tag.match(/(?<=>)[^]*(?=<)/) || [null])[0];
};

export const setInside = (tag: string, inside: string) => {
  let result = tag;
  result = result.replace(/>[^]*</, `>${inside}<`);

  return result;
};

export const append = (tag: string, toAppend: string) => {
  return setInside(tag, getInside(tag) + toAppend);
};
