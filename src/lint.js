// Linter da composição: pega erros antes do render (usado pela CLI, pelo estúdio e pelas skills).
import fs from 'node:fs';
import path from 'node:path';
import { inspect } from './composition.js';

/**
 * @returns {{level:'error'|'warning', rule:string, message:string, line?:number}[]}
 */
export function lintSource(source, { baseDir } = {}) {
  const out = [];
  const lineOf = (idx) => source.slice(0, idx).split('\n').length;
  const add = (level, rule, message, idx) => out.push({ level, rule, message, ...(idx != null ? { line: lineOf(idx) } : {}) });

  if (!/<html[^>]*data-duration=/i.test(source)) add('error', 'html-duration', '<html> precisa de data-duration (segundos).');
  if (!/<html[^>]*data-width=/i.test(source) || !/<html[^>]*data-height=/i.test(source)) {
    add('warning', 'html-size', '<html> sem data-width/data-height: usando 1920x1080.');
  }

  let model;
  try { model = inspect(source); } catch (e) { add('error', 'parse', `HTML inválido: ${e.message}`); return out; }
  const { config, items } = model;

  if (!items.length) add('warning', 'no-clips', 'Nenhum elemento .clip encontrado: tudo aparece o tempo todo.');
  for (const it of items) {
    const end = it.duration == null ? null : it.absStart + it.duration;
    if (it.absStart >= config.duration) {
      add('warning', 'clip-after-end', `"${it.label}" começa em ${it.absStart}s, depois do fim do vídeo (${config.duration}s).`, it.loc.start);
    } else if (end != null && end > config.duration + 1e-6) {
      add('warning', 'clip-overflow', `"${it.label}" termina em ${+end.toFixed(3)}s, depois do fim (${config.duration}s).`, it.loc.start);
    }
    if (it.kind === 'scene' && it.duration == null && it.depth === 0 && it.absStart > 0 && items.filter((x) => x.depth === 0 && x.kind === 'scene').length > 1) {
      add('warning', 'clip-no-duration', `"${it.label}" não tem data-duration: fica visível até o fim.`, it.loc.start);
    }
    if (it.duration != null && it.duration <= 0) add('error', 'clip-duration', `"${it.label}" tem data-duration <= 0.`, it.loc.start);
    if (it.src && baseDir && !/^(https?:|data:|\/__lm\/)/.test(it.src) && !fs.existsSync(path.join(baseDir, it.src))) {
      add('error', 'missing-asset', `Arquivo não encontrado: ${it.src}`, it.loc.start);
    }
  }

  // Scripts: padrões que quebram o determinismo
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(source))) {
    const code = m[1];
    const base = m.index + m[0].indexOf(code);
    const check = (re, level, rule, msg) => {
      let x; const r = new RegExp(re.source, 'g');
      while ((x = r.exec(code))) add(level, rule, msg, base + x.index);
    };
    check(/\bset(Timeout|Interval)\s*\(/, 'warning', 'timers', 'setTimeout/setInterval não seguem o relógio do vídeo. Use GSAP, CSS ou loopmotion.onFrame(t).');
    check(/\.play\(\s*\)/, 'warning', 'media-play', 'Não chame .play(): a LoopMotion controla vídeo e áudio.');
    check(/\bfetch\s*\(/, 'warning', 'network', 'fetch() no render pode deixar o vídeo não-determinístico. Prefira dados locais ou props.');
    check(/gsap\.(to|from|fromTo|timeline)\([^)]*repeat:\s*-1/, 'warning', 'infinite-repeat', 'repeat: -1 no GSAP: confira se o loop fecha certinho na duração do vídeo.');
  }
  if ((/\bgsap\./.test(source) || /loopmotion\.timeline\(/.test(source)) && !/\/__lm\/gsap\.js|gsap(\.min)?\.js/.test(source)) {
    add('error', 'gsap-missing', 'GSAP usado mas não carregado. Adicione <script src="/__lm/gsap.js"></script> no <head>.');
  }

  // Recursos externos
  const extRe = /(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;
  while ((m = extRe.exec(source))) add('warning', 'external', `Recurso externo (${m[1].slice(0, 60)}): o render pode falhar offline. Baixe para a pasta do projeto.`, m.index);

  return out;
}

export function lintFile(file) {
  return lintSource(fs.readFileSync(file, 'utf8'), { baseDir: path.dirname(file) });
}

/** Lint em tempo de execução: abre no navegador e procura erros de script. */
export async function lintRuntime(file) {
  const { startServer } = await import('./server.js');
  const puppeteer = (await import('puppeteer-core')).default;
  const { findChrome } = await import('./render.js');
  const { server, url } = await startServer({ entry: file });
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] });
  const out = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => out.push({ level: 'error', rule: 'runtime', message: `Erro de script: ${e.message}` }));
    page.on('console', (msg) => { if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) out.push({ level: 'warning', rule: 'console', message: msg.text() }); });
    page.on('requestfailed', (r) => /ERR_ABORTED/.test(r.failure()?.errorText || '') || out.push({ level: 'error', rule: 'load', message: `Falha ao carregar ${r.url()}` }));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) out.push({ level: 'error', rule: 'load', message: `${r.status()} em ${r.url().replace(url, '')}` }); });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => window.loopmotion.ready());
    const cfg = await page.evaluate(() => window.loopmotion.config);
    for (const t of [0, cfg.duration * 0.25, cfg.duration * 0.5, cfg.duration * 0.75, cfg.duration - 1 / cfg.fps]) {
      await page.evaluate((x) => window.loopmotion.seek(x), t);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return out;
}
