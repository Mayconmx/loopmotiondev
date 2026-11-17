// Gera skills/loopmotion-blocks/references/catalog.md a partir de blocks/*/meta.json.
import fs from 'node:fs';
import path from 'node:path';
import { listBlocks } from '../src/blocks.js';

let md = '# Catálogo de blocos\n\nGerado de `blocks/*/meta.json`. Para inserir: `npx loopmotion add <id> --to <pasta> --at <s>`.\n';
let cat = '';
for (const b of listBlocks()) {
  if (b.category !== cat) { cat = b.category; md += `\n## ${cat[0].toUpperCase() + cat.slice(1)}\n\n| id | O que é | Duração padrão | Variáveis (data-var) |\n|---|---|---|---|\n`; }
  md += `| \`${b.id}\` | ${b.description} | ${b.duration == null ? 'vídeo inteiro' : `${b.duration} s`} | ${b.vars?.length ? b.vars.map((v) => `\`${v}\``).join(', ') : '—'} |\n`;
}
const out = path.join('skills', 'loopmotion-blocks', 'references', 'catalog.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`✔ ${out}`);
