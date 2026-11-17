// Modelo da composição: lê o HTML e faz edições "cirúrgicas" no código-fonte,
// preservando formatação, comentários e scripts do usuário/agente.
import { parse } from 'parse5';

const num = (v, d) => (v == null || v === '' || isNaN(Number(v)) ? d : Number(v));
const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
const hasClass = (el, c) => (attr(el, 'class') || '').split(/\s+/).includes(c);

function walk(node, fn, depth = 0) {
  for (const child of node.childNodes || []) {
    if (child.nodeName === 'template') continue;
    if (child.tagName) fn(child, depth);
    walk(child, fn, depth + (child.tagName && isItem(child) ? 1 : 0));
  }
}

function isItem(el) {
  return hasClass(el, 'clip') || el.tagName === 'audio' || el.tagName === 'video';
}

function textOf(node) {
  if (node.nodeName === '#text') return node.value;
  if (node.tagName === 'script' || node.tagName === 'style') return '';
  return (node.childNodes || []).map(textOf).join(' ');
}

function findHtml(doc) {
  return doc.childNodes.find((n) => n.tagName === 'html');
}

/** Lê a composição: configuração, itens da timeline e variáveis. */
export function inspect(source) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  const html = findHtml(doc);
  const config = {
    width: num(attr(html, 'data-width'), 1920),
    height: num(attr(html, 'data-height'), 1080),
    fps: num(attr(html, 'data-fps'), 30),
    duration: num(attr(html, 'data-duration'), 5),
  };

  const items = [];
  const vars = [];
  const stack = []; // ancestrais .clip para calcular o tempo absoluto
  const visit = (node, parentItem) => {
    for (const el of node.childNodes || []) {
      if (!el.tagName || el.nodeName === 'template') continue;
      let current = parentItem;
      if (isItem(el)) {
        const start = num(attr(el, 'data-start'), 0);
        const parentAbs = parentItem ? parentItem.absStart : 0;
        const absStart = parentAbs + start;
        const durAttr = attr(el, 'data-duration');
        const label = attr(el, 'data-label') || (attr(el, 'id') ? `#${attr(el, 'id')}` : '') ||
          textOf(el).replace(/\s+/g, ' ').trim().slice(0, 40) ||
          (attr(el, 'src') ? attr(el, 'src').split('/').pop() : el.tagName);
        const item = {
          index: items.length,
          tag: el.tagName,
          kind: el.tagName === 'audio' ? 'audio' : el.tagName === 'video' ? 'video' : el.tagName === 'img' ? 'image' : 'scene',
          id: attr(el, 'id') || null,
          label,
          start,
          duration: durAttr == null ? null : num(durAttr, null),
          absStart,
          parent: parentItem ? parentItem.index : null,
          depth: stack.length,
          src: attr(el, 'src') || null,
          volume: num(attr(el, 'data-volume'), 1),
          loc: { start: el.sourceCodeLocation.startOffset, end: el.sourceCodeLocation.endOffset },
        };
        items.push(item);
        current = item;
        stack.push(item);
      }
      const v = attr(el, 'data-var');
      if (v) {
        vars.push({
          name: v,
          value: textOf(el).replace(/\s+/g, ' ').trim(),
          owner: current ? current.index : null,
        });
      }
      const vs = attr(el, 'data-var-src');
      if (vs) vars.push({ name: vs, value: attr(el, 'src') || '', kind: 'src', owner: current ? current.index : null });
      visit(el, current);
      if (current !== parentItem) stack.pop();
    }
  };
  visit(html, null);
  return { config, items, vars };
}

function locateItem(source, index) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  let found = null;
  let i = 0;
  walk(findHtml(doc), (el) => {
    if (isItem(el)) { if (i === index) found = el; i++; }
  });
  if (!found) throw new Error(`item ${index} não encontrado`);
  return found;
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escText = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Aplica mudanças de atributos num elemento, mexendo só na tag de abertura. */
function patchStartTag(source, el, attrs) {
  const loc = el.sourceCodeLocation;
  const edits = [];
  for (const [name, value] of Object.entries(attrs)) {
    const a = loc.attrs?.[name];
    if (a) {
      if (value == null) {
        // remove o atributo e o espaço antes dele
        let s = a.startOffset;
        while (s > 0 && /\s/.test(source[s - 1])) s--;
        edits.push([s, a.endOffset, '']);
      } else edits.push([a.startOffset, a.endOffset, `${name}="${esc(value)}"`]);
    } else if (value != null) {
      const tagEnd = loc.startTag.endOffset;
      const insertAt = source[tagEnd - 2] === '/' ? tagEnd - 2 : tagEnd - 1;
      edits.push([insertAt, insertAt, ` ${name}="${esc(value)}"`]);
    }
  }
  edits.sort((a, b) => b[0] - a[0]);
  let out = source;
  for (const [s, e, text] of edits) out = out.slice(0, s) + text + out.slice(e);
  return out;
}

const round = (n) => Math.round(n * 1000) / 1000;

export function setItemAttrs(source, index, attrs) {
  const clean = {};
  for (const [k, v] of Object.entries(attrs)) clean[k] = typeof v === 'number' ? String(round(v)) : v;
  return patchStartTag(source, locateItem(source, index), clean);
}

export function setConfig(source, config) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  const html = findHtml(doc);
  if (!html.sourceCodeLocation?.startTag) {
    const tag = `<html ${Object.entries(config).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>`;
    return tag + source + '</html>';
  }
  const attrs = {};
  for (const [k, v] of Object.entries(config)) attrs[`data-${k}`] = v == null ? null : String(v);
  return patchStartTag(source, html, attrs);
}

/** Troca o texto padrão de um elemento com data-var. */
export function setVarDefault(source, name, value) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  const edits = [];
  walk(findHtml(doc), (el) => {
    const loc = el.sourceCodeLocation;
    if (attr(el, 'data-var') === name && loc.endTag) {
      edits.push([loc.startTag.endOffset, loc.endTag.startOffset, escText(value).replace(/\n/g, '<br>')]);
    }
    if (attr(el, 'data-var-src') === name) {
      const a = loc.attrs?.src;
      if (a) edits.push([a.startOffset, a.endOffset, `src="${esc(value)}"`]);
    }
  });
  edits.sort((a, b) => b[0] - a[0]);
  let out = source;
  for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
  return out;
}

export function removeItem(source, index) {
  const el = locateItem(source, index);
  let { startOffset: s, endOffset: e } = el.sourceCodeLocation;
  // leva junto a indentação e a quebra de linha
  while (s > 0 && /[ \t]/.test(source[s - 1])) s--;
  if (source[e] === '\n') e++;
  return source.slice(0, s) + source.slice(e);
}

export function duplicateItem(source, index, offset = 0) {
  const el = locateItem(source, index);
  const { startOffset: s, endOffset: e } = el.sourceCodeLocation;
  let snippet = source.slice(s, e).replace(/\sid="[^"]*"/, '');
  let indent = '';
  for (let i = s - 1; i >= 0 && /[ \t]/.test(source[i]); i--) indent = source[i] + indent;
  if (offset) {
    const start = num(attr(el, 'data-start'), 0) + offset;
    snippet = /data-start="[^"]*"/.test(snippet)
      ? snippet.replace(/data-start="[^"]*"/, `data-start="${round(start)}"`)
      : snippet.replace(/^<([a-z0-9-]+)/i, `<$1 data-start="${round(start)}"`);
  }
  return source.slice(0, e) + '\n' + indent + snippet + source.slice(e);
}

/** Insere um trecho de HTML no fim do <body> (ou dentro de um item, se `parent`). */
export function insertItem(source, snippet, parent = null) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  let at;
  let indent = '  ';
  if (parent != null) {
    const el = locateItem(source, parent);
    at = el.sourceCodeLocation.endTag.startOffset;
    indent = '    ';
  } else {
    const body = findHtml(doc).childNodes.find((n) => n.tagName === 'body');
    // antes do primeiro <script> do body, para os scripts enxergarem o elemento
    const firstScript = body.childNodes.find((n) => n.tagName === 'script' && n.sourceCodeLocation);
    at = firstScript ? firstScript.sourceCodeLocation.startOffset : body.sourceCodeLocation?.endTag?.startOffset ?? source.length;
  }
  return source.slice(0, at) + snippet.trim() + '\n' + indent.slice(2) + source.slice(at);
}

/** Marca cada item com data-lm-index (usado só no preview do estúdio). */
export function annotate(source) {
  const doc = parse(source, { sourceCodeLocationInfo: true });
  const edits = [];
  let i = 0;
  walk(findHtml(doc), (el) => {
    if (isItem(el)) {
      const tagEnd = el.sourceCodeLocation.startTag.endOffset;
      const at = source[tagEnd - 2] === '/' ? tagEnd - 2 : tagEnd - 1;
      edits.push([at, ` data-lm-index="${i++}"`]);
    }
  });
  edits.sort((a, b) => b[0] - a[0]);
  let out = source;
  for (const [at, t] of edits) out = out.slice(0, at) + t + out.slice(at);
  return out;
}
