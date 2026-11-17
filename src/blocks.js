// Catálogo de blocos: trechos prontos (cenas, textos, transições, dados) para inserir numa composição.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { insertItem } from './composition.js';

export const BLOCKS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'blocks');

export function listBlocks() {
  return fs.readdirSync(BLOCKS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const meta = JSON.parse(fs.readFileSync(path.join(BLOCKS_DIR, d.name, 'meta.json'), 'utf8'));
    return { id: d.name, ...meta };
  }).sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name));
}

export function getBlock(id) {
  const dir = path.join(BLOCKS_DIR, path.basename(id));
  if (!fs.existsSync(path.join(dir, 'block.html'))) {
    throw new Error(`bloco "${id}" não existe. Veja a lista: loopmotion add --list`);
  }
  return { id, meta: JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')), html: fs.readFileSync(path.join(dir, 'block.html'), 'utf8') };
}

/** Insere um bloco na composição. Retorna { source, id }. */
export function addBlock(source, blockId, { at = 0, duration, id } = {}) {
  const b = getBlock(blockId);
  let n = 1;
  let uid = id || `${blockId}-${n}`;
  while (!id && new RegExp(`id="${uid}"`).test(source)) uid = `${blockId}-${++n}`;
  const dur = duration ?? b.meta.duration ?? 3;
  const r = (x) => String(Math.round(x * 1000) / 1000);
  const snippet = b.html.replaceAll('{{id}}', uid).replaceAll('{{start}}', r(at)).replaceAll('{{duration}}', r(dur));

  let out = source;
  // GSAP no <head>, se o bloco precisar e ainda não estiver carregado
  if (/loopmotion\.timeline|gsap\./.test(snippet) && !/\/__lm\/gsap\.js/.test(out)) {
    out = /<head[^>]*>/i.test(out)
      ? out.replace(/<head[^>]*>/i, (m) => `${m}\n<script src="/__lm/gsap.js"></script>`)
      : out.replace(/<html[^>]*>/i, (m) => `${m}\n<head><script src="/__lm/gsap.js"></script></head>`);
  }
  if (b.meta.position === 'back') {
    // fundos vão logo no começo do <body>, atrás de tudo
    out = out.replace(/<body[^>]*>/i, (m) => `${m}\n  ${snippet.trim()}\n`);
  } else {
    out = insertItem(out, snippet);
  }
  return { source: out, id: uid };
}
