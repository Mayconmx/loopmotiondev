// Gera as miniaturas dos templates (templates/*/thumb.jpg).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { still } from '../src/render.js';

const dir = path.resolve('templates');
for (const t of fs.readdirSync(dir)) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, t, 'meta.json'), 'utf8'));
  const png = path.join(dir, t, 'thumb.png');
  await still(path.join(dir, t, 'index.html'), { time: meta.thumbAt ?? 1, output: png });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=0x0a0a0f', '-q:v', '4', path.join(dir, t, 'thumb.jpg')]);
  fs.rmSync(png);
}
