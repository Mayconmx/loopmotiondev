// Gera miniaturas dos blocos (blocks/*/thumb.jpg) e valida cada um em 16:9 e 9:16.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { listBlocks, addBlock, BLOCKS_DIR } from '../src/blocks.js';
import { still } from '../src/render.js';
import { lintSource } from '../src/lint.js';

const BASE = (w, h) => `<!doctype html>
<html data-width="${w}" data-height="${h}" data-fps="30" data-duration="6">
<head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:linear-gradient(135deg,#1a1730,#0b0b12);font-family:system-ui,sans-serif}</style></head>
<body>
</body>
</html>`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lm-blocks-'));
const vertical = process.argv.includes('--vertical');
let failed = 0;
for (const b of listBlocks()) {
  const [w, h] = vertical ? [1080, 1920] : [1920, 1080];
  let { source } = addBlock(BASE(w, h), b.id, { at: 0 });
  if (b.category === 'transição') source = source.replace('<body>', '<body>\n<h1 style="position:absolute;inset:0;display:grid;place-items:center;margin:0;color:#fff;font:900 12vmin system-ui">Cena</h1>');
  const issues = lintSource(source).filter((i) => i.level === 'error');
  if (issues.length) { failed++; console.log(`✖ ${b.id}:`, issues.map((i) => i.message).join('; ')); }
  const dir = path.join(tmp, b.id); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), source);
  const t = b.category === 'transição' ? (b.duration ?? 1) * 0.42 : Math.min((b.duration ?? 4) * 0.7, 2.6);
  const png = path.join(tmp, `${b.id}${vertical ? '-v' : ''}.png`);
  await still(path.join(dir, 'index.html'), { time: t, output: png });
  if (!vertical) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=480:270', '-q:v', '4', path.join(BLOCKS_DIR, b.id, 'thumb.jpg')]);
}
console.log(`\n${failed ? `${failed} bloco(s) com erro` : 'todos os blocos OK'} · imagens em ${tmp}`);
