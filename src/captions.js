// Legendas: SRT/VTT → um clip de legenda por fala.
import { getBlock } from './blocks.js';
import { insertItem } from './composition.js';

const toSec = (ts) => {
  const m = ts.trim().replace(',', '.').split(':').map(Number);
  return m.length === 3 ? m[0] * 3600 + m[1] * 60 + m[2] : m[0] * 60 + m[1];
};

export function parseSubtitles(text) {
  const cues = [];
  for (const block of text.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n').filter(Boolean);
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = lines[i].split('-->');
    const body = lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (body) cues.push({ start: toSec(a), end: toSec(b.trim().split(/\s+/)[0]), text: body });
  }
  return cues;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Adiciona as legendas à composição. `*palavra*` vira destaque. */
export function addCaptions(source, cues, { offset = 0 } = {}) {
  const tpl = getBlock('caption').html;
  let out = source;
  const r = (x) => String(Math.round(x * 1000) / 1000);
  cues.forEach((c, n) => {
    const id = `cap-${n + 1}`;
    const text = esc(c.text).replace(/\*([^*]+)\*/g, '<em style="font-style:normal;color:var(--accent,#facc15)">$1</em>');
    const snippet = tpl
      .replaceAll('{{id}}', id)
      .replaceAll('{{start}}', r(c.start + offset))
      .replaceAll('{{duration}}', r(Math.max(0.2, c.end - c.start)))
      .replace('data-label="Legenda"', `data-label="Legenda ${n + 1}"`)
      .replace('data-var="text"', `data-var="cap${n + 1}"`)
      .replace('Sua legenda aqui', text);
    out = insertItem(out, snippet);
  });
  return out;
}
