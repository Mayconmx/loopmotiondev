// Captura de site → material para vídeo: screenshots, cores, fontes, textos e logo.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { findChrome } from './render.js';

export async function capture(url, { out = 'assets/site', width = 1920, height = 1080, maxSections = 8 } = {}) {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));

    // rola a página para carregar imagens preguiçosas
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      scrollTo(0, 0);
    });

    await page.screenshot({ path: path.join(out, 'hero.png') });
    await page.screenshot({ path: path.join(out, 'fullpage.png'), fullPage: true });

    const info = await page.evaluate((maxSections) => {
      const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.content || null;
      const colors = new Map();
      const fonts = new Map();
      for (const el of [...document.querySelectorAll('body *')].slice(0, 3000)) {
        const cs = getComputedStyle(el);
        const area = el.offsetWidth * el.offsetHeight;
        if (!area) continue;
        for (const c of [cs.backgroundColor, cs.color]) {
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) colors.set(c, (colors.get(c) || 0) + area);
        }
        if (el.innerText && el.children.length === 0) {
          const f = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          fonts.set(f, (fonts.get(f) || 0) + el.innerText.length);
        }
      }
      const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
      const blocks = [...document.querySelectorAll('header, section, footer, main > div, [class*="hero"]')]
        .filter((el) => el.offsetHeight > 280 && el.offsetWidth > innerWidth * 0.6)
        .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)))
        .slice(0, maxSections);
      blocks.forEach((el, i) => el.setAttribute('data-lm-capture', String(i)));
      return {
        url: location.href,
        title: document.title,
        description: meta('description') || meta('og:description'),
        ogImage: meta('og:image'),
        icon: document.querySelector('link[rel~="icon"]')?.href || null,
        headings: [...document.querySelectorAll('h1, h2')].map((h) => h.innerText.trim()).filter(Boolean).slice(0, 12),
        ctas: [...document.querySelectorAll('a, button')].map((a) => a.innerText.trim()).filter((t) => t && t.length < 30).slice(0, 10),
        colors: top(colors, 8),
        fonts: top(fonts, 4),
        sections: blocks.length,
      };
    }, maxSections);

    const sections = [];
    for (let i = 0; i < info.sections; i++) {
      const el = await page.$(`[data-lm-capture="${i}"]`);
      if (!el) continue;
      const file = `section-${i + 1}.png`;
      try { await el.screenshot({ path: path.join(out, file) }); sections.push(file); } catch { /* fora da tela */ }
    }
    const summary = { ...info, sections, files: ['hero.png', 'fullpage.png', ...sections] };
    fs.writeFileSync(path.join(out, 'site.json'), JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    await browser.close();
  }
}
