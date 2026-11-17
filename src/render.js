// Renderizador: navegador headless + relógio virtual + FFmpeg, em paralelo.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from './server.js';

const CHROME_CANDIDATES = [
  process.env.LOOPMOTION_CHROME,
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

export function findChrome() {
  const p = CHROME_CANDIDATES.find((c) => fs.existsSync(c));
  if (!p) throw new Error('Chrome não encontrado. Defina LOOPMOTION_CHROME=/caminho/do/chrome');
  return p;
}

function run(cmd, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} saiu com ${code}\n${err.slice(-2000)}`))));
    if (input) input(p.stdin);
  });
}

async function openPage(browser, url, cfg) {
  const page = await browser.newPage();
  await page.setViewport({ width: cfg.width, height: cfg.height, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('  [composição]', e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => window.loopmotion.ready());
  return page;
}

/** Renderiza os frames [from, to) num MP4 sem áudio. */
async function renderChunk({ browser, url, cfg, from, to, outFile, quality, onFrame }) {
  const page = await openPage(browser, url, cfg);
  const cdp = await page.createCDPSession();
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(cfg.fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(quality), '-pix_fmt', 'yuv420p',
    '-vf', `scale=${cfg.outWidth}:${cfg.outHeight}:flags=lanczos`, outFile,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', (d) => { ffErr += d; });
  const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error(ffErr)) : res())));

  for (let f = from; f < to; f++) {
    await page.evaluate((t) => window.loopmotion.seek(t), f / cfg.fps);
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 92, optimizeForSpeed: true,
      clip: { x: 0, y: 0, width: cfg.width, height: cfg.height, scale: 1 },
    });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    onFrame();
  }
  ff.stdin.end();
  await ffDone;
  await page.close();
}

export async function render(entry, opts = {}) {
  const t0 = Date.now();
  const out = path.resolve(opts.output || entry.replace(/\.html?$/i, '') + '.mp4');
  const { server, url } = await startServer({ entry, props: opts.props });
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio',
      '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'],
  });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loopmotion-'));
  try {
    // Lê a configuração da própria composição (data-width, data-fps, ...)
    const probe = await openPage(browser, url, { width: 1920, height: 1080 });
    const base = await probe.evaluate(() => window.loopmotion.config);
    const audio = await probe.evaluate(() => window.loopmotion.audioTracks());
    await probe.close();

    const cfg = {
      ...base,
      fps: opts.fps ?? base.fps,
      duration: opts.duration ?? base.duration,
      // o layout é sempre o da composição; --width/--height só mudam o tamanho do arquivo final
      outWidth: opts.width ?? (opts.height ? Math.round(opts.height * base.width / base.height / 2) * 2 : base.width),
      outHeight: opts.height ?? (opts.width ? Math.round(opts.width * base.height / base.width / 2) * 2 : base.height),
    };
    const total = Math.round(cfg.fps * cfg.duration);
    const workers = Math.max(1, Math.min(opts.workers || Math.max(1, os.cpus().length - 1), total));
    const quality = opts.crf ?? 18;
    const log = opts.quiet ? () => {} : console.log;
    log(`▶ LoopMotion: ${cfg.outWidth}x${cfg.outHeight} @ ${cfg.fps}fps, ${cfg.duration}s (${total} frames), ${workers} worker(s)`);

    // Divide os frames entre workers e renderiza em paralelo
    let done = 0;
    const tick = () => {
      done++;
      opts.onProgress?.(done, total);
      if (!opts.quiet && (done % Math.max(1, Math.round(total / 20)) === 0 || done === total)) {
        process.stdout.write(`\r  renderizando ${Math.round((done / total) * 100)}% (${done}/${total})`);
      }
    };
    const size = Math.ceil(total / workers);
    const chunks = [];
    for (let i = 0; i < workers; i++) {
      const from = i * size, to = Math.min(total, from + size);
      if (from < to) chunks.push({ from, to, outFile: path.join(tmp, `chunk-${String(i).padStart(3, '0')}.mp4`) });
    }
    await Promise.all(chunks.map((c) => renderChunk({ browser, url, cfg, quality, onFrame: tick, ...c })));
    if (!opts.quiet) process.stdout.write('\n');

    // Junta os pedaços
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, chunks.map((c) => `file '${c.outFile}'`).join('\n'));
    const video = path.join(tmp, 'video.mp4');
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);

    // Mixa o áudio (cada <audio> com seu início, offset e volume)
    if (audio.length) {
      const args = ['-y', '-loglevel', 'error', '-i', video];
      const filters = [];
      audio.forEach((a, i) => {
        const src = a.src.startsWith(url) ? path.join(path.dirname(path.resolve(entry)), decodeURIComponent(a.src.slice(url.length))) : a.src;
        args.push('-ss', String(a.offset), ...(a.duration ? ['-t', String(a.duration)] : []), '-i', src);
        const ms = Math.round(a.start * 1000);
        filters.push(`[${i + 1}:a]adelay=${ms}|${ms},volume=${a.volume}[a${i}]`);
      });
      const mix = audio.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${audio.length}:normalize=0[aout]`;
      args.push('-filter_complex', [...filters, mix].join(';'), '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(cfg.duration), out);
      await run('ffmpeg', args);
    } else {
      fs.copyFileSync(video, out);
    }

    log(`✔ ${out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    return out;
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Gera um PNG de um único frame (útil para thumbnails e testes). */
export async function still(entry, { time = 0, output, props } = {}) {
  const { server, url } = await startServer({ entry, props });
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
  try {
    const probe = await openPage(browser, url, { width: 1920, height: 1080 });
    const cfg = await probe.evaluate(() => window.loopmotion.config);
    await probe.close();
    const page = await openPage(browser, url, cfg);
    await page.evaluate((t) => window.loopmotion.seek(t), time);
    const out = path.resolve(output || entry.replace(/\.html?$/i, '') + `-${time}s.png`);
    await page.screenshot({ path: out });
    console.log(`✔ ${out}`);
    return out;
  } finally {
    await browser.close();
    server.close();
  }
}
