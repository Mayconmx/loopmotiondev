// LoopMotion Studio — servidor do editor (API + arquivos do projeto + interface).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTINS, MIME, injectRuntime } from '../src/server.js';
import * as C from '../src/composition.js';
import { lintSource } from '../src/lint.js';
import { render } from '../src/render.js';
import { listBlocks, addBlock, BLOCKS_DIR } from '../src/blocks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const LM_ROOT = path.join(here, '..');
const UI_DIR = path.join(here, 'ui');
const TEMPLATES_DIR = path.join(LM_ROOT, 'templates');
const SKILL_DIR = path.join(LM_ROOT, 'skills', 'loopmotion');
const CONFIG_FILE = path.join(os.homedir(), '.loopmotion', 'config.json');
const IGNORE = /(^|[\\/])(node_modules|exports|\.git|\.loopmotion)([\\/]|$)/;

// ---------------------------------------------------------------- utilidades
const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};
const readBody = (req, limit = 500 * 1024 * 1024) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('arquivo grande demais')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});
const readJson = async (req) => { const b = await readBody(req, 20 * 1024 * 1024); return b.length ? JSON.parse(b) : {}; };
const typeOf = (f) => {
  const e = path.extname(f).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'].includes(e)) return 'image';
  if (['.mp4', '.webm', '.mov', '.m4v'].includes(e)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(e)) return 'audio';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(e)) return 'font';
  if (['.json'].includes(e)) return 'data';
  return 'other';
};
const slug = (s) => String(s || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
function saveSettings(s) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(s, null, 2), { mode: 0o600 });
}

function sendFile(req, res, file, transform) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (transform) {
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(transform(fs.readFileSync(file, 'utf8')));
      return;
    }
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? +range[1] : 0;
      const end = range[2] ? +range[2] : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    }
  });
}

// ---------------------------------------------------------------- estúdio
export async function startStudio({ root, port = 3800, host = '127.0.0.1' }) {
  root = path.resolve(root);
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  const safe = (rel) => {
    const p = path.resolve(root, decodeURIComponent(rel || '').replace(/^\/+/, ''));
    if (p !== root && !p.startsWith(root + path.sep)) throw Object.assign(new Error('caminho inválido'), { code: 403 });
    return p;
  };

  // ---- eventos (SSE) para a interface
  const clients = new Set();
  const emit = (data) => { const msg = `data: ${JSON.stringify(data)}\n\n`; clients.forEach((c) => c.write(msg)); };

  // ---- histórico (desfazer/refazer) por arquivo; vale para edições da UI, da IA e de agentes externos
  const history = new Map();
  const known = new Map(); // último conteúdo conhecido de cada arquivo
  const hist = (rel) => { if (!history.has(rel)) history.set(rel, { undo: [], redo: [] }); return history.get(rel); };
  const readComp = (rel) => { const s = fs.readFileSync(safe(rel), 'utf8'); if (!known.has(rel)) known.set(rel, s); return s; };
  function writeComp(rel, source, { record = true } = {}) {
    const prev = known.has(rel) ? known.get(rel) : (fs.existsSync(safe(rel)) ? fs.readFileSync(safe(rel), 'utf8') : null);
    if (prev === source) return;
    if (record && prev != null) { const h = hist(rel); h.undo.push(prev); if (h.undo.length > 200) h.undo.shift(); h.redo = []; }
    known.set(rel, source);
    fs.writeFileSync(safe(rel), source);
  }
  const state = (rel, source = readComp(rel)) => {
    let model, lint;
    try { model = C.inspect(source); } catch (e) { model = null; }
    try { lint = lintSource(source, { baseDir: path.dirname(safe(rel)) }); } catch (e) { lint = [{ level: 'error', rule: 'parse', message: e.message }]; }
    const h = hist(rel);
    return { path: rel, source, model, lint, canUndo: h.undo.length > 0, canRedo: h.redo.length > 0 };
  };

  // ---- vigia o disco: edições feitas por agentes (Claude Code, Cursor...) aparecem ao vivo
  let watchTimer = new Map();
  try {
    fs.watch(root, { recursive: true }, (_, name) => {
      if (!name || IGNORE.test(name)) return;
      const rel = name.split(path.sep).join('/');
      clearTimeout(watchTimer.get(rel));
      watchTimer.set(rel, setTimeout(() => {
        const abs = path.join(root, rel);
        if (rel.endsWith('.html') && fs.existsSync(abs)) {
          const now = fs.readFileSync(abs, 'utf8');
          const prev = known.get(rel);
          if (prev != null && prev !== now) {
            const h = hist(rel); h.undo.push(prev); h.redo = [];
            known.set(rel, now);
            emit({ type: 'file', path: rel, external: true });
            return;
          }
          if (prev == null) known.set(rel, now);
        }
        emit({ type: 'tree' });
      }, 150));
    });
  } catch { /* fs.watch recursivo não suportado: sem hot reload externo */ }

  // ---- lista do projeto
  function listProject() {
    const comps = []; const assets = [];
    const walk = (dir, depth) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.') || IGNORE.test(e.name)) continue;
        const abs = path.join(dir, e.name);
        const rel = path.relative(root, abs).split(path.sep).join('/');
        if (e.isDirectory()) { if (depth < 4) walk(abs, depth + 1); continue; }
        if (e.name.endsWith('.html')) {
          try {
            const src = fs.readFileSync(abs, 'utf8');
            if (!/<html[^>]*data-(duration|fps|width)/i.test(src)) continue;
            const { config } = C.inspect(src);
            comps.push({ path: rel, name: rel.endsWith('/index.html') ? rel.slice(0, -11) : rel.replace(/\.html$/, ''), config, mtime: fs.statSync(abs).mtimeMs });
          } catch { /* ignora html inválido */ }
        } else {
          const type = typeOf(e.name);
          if (type !== 'other') assets.push({ path: rel, name: e.name, type, size: fs.statSync(abs).size });
        }
      }
    };
    walk(root, 0);
    comps.sort((a, b) => b.mtime - a.mtime);
    const exports = fs.existsSync(path.join(root, 'exports'))
      ? fs.readdirSync(path.join(root, 'exports')).filter((f) => f.endsWith('.mp4'))
        .map((f) => ({ path: `exports/${f}`, name: f, size: fs.statSync(path.join(root, 'exports', f)).size, mtime: fs.statSync(path.join(root, 'exports', f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)
      : [];
    return { name: path.basename(root), compositions: comps, assets, exports };
  }

  function listTemplates() {
    return fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, d.name, 'meta.json'), 'utf8')); } catch {}
      const thumb = ['thumb.jpg', 'thumb.png'].find((t) => fs.existsSync(path.join(TEMPLATES_DIR, d.name, t)));
      return { id: d.name, name: meta.name || d.name, description: meta.description || '', order: meta.order ?? 99,
        format: meta.format || '', thumb: thumb ? `/tpl/${d.name}/${thumb}` : null };
    }).sort((a, b) => a.order - b.order);
  }

  // ---- fila de render
  const jobs = new Map(); let queue = Promise.resolve(); let jobSeq = 0;
  function enqueueRender(opts) {
    const id = String(++jobSeq);
    const base = slug(opts.path.replace(/\/index\.html$|\.html$/g, '').split('/').pop());
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const outRel = `exports/${base}-${stamp}.mp4`;
    const job = { id, path: opts.path, status: 'queued', progress: 0, output: outRel, error: null, started: Date.now() };
    jobs.set(id, job); emit({ type: 'render', job });
    queue = queue.then(async () => {
      job.status = 'rendering'; emit({ type: 'render', job });
      fs.mkdirSync(path.join(root, 'exports'), { recursive: true });
      let last = 0;
      try {
        await render(safe(opts.path), {
          output: safe(outRel), props: opts.props, fps: opts.fps, width: opts.width, height: opts.height,
          crf: opts.crf, workers: opts.workers, quiet: true,
          onProgress: (d, t) => { job.progress = d / t; if (Date.now() - last > 250 || d === t) { last = Date.now(); emit({ type: 'render', job }); } },
        });
        job.status = 'done'; job.progress = 1; job.elapsed = Date.now() - job.started;
      } catch (e) { job.status = 'error'; job.error = e.message; }
      emit({ type: 'render', job }); emit({ type: 'tree' });
    });
    return job;
  }

  // ---- IA: o assistente usa a mesma skill que os agentes externos
  function systemPrompt() {
    let s = '';
    try {
      s += fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8').replace(/^---[\s\S]*?---\s*/, '');
      const refs = path.join(SKILL_DIR, 'references');
      for (const f of fs.readdirSync(refs).sort()) s += `\n\n<reference file="${f}">\n${fs.readFileSync(path.join(refs, f), 'utf8')}\n</reference>`;
    } catch {}
    return `Você é o assistente de edição do LoopMotion Studio. O usuário está editando uma composição de vídeo no editor e pede mudanças.\n\n` +
      `Responda SEMPRE assim: 1–3 frases curtas, em português, dizendo o que você mudou; depois o ARQUIVO COMPLETO atualizado num único bloco \`\`\`html. ` +
      `Nunca omita partes do arquivo ("..."), nunca use recursos externos (CDNs, URLs http), e preserve tudo que o usuário não pediu para mudar. ` +
      `Assets disponíveis ficam em caminhos relativos ao arquivo. Se a pergunta não pedir mudança, responda sem bloco de código.\n\n${s}`;
  }

  async function aiStream(req, res) {
    const body = await readJson(req);
    const rel = body.path;
    const source = readComp(rel);
    const settings = loadSettings();
    const key = process.env.ANTHROPIC_API_KEY || settings.anthropicApiKey;
    const model = process.env.LOOPMOTION_MODEL || settings.model || 'claude-sonnet-5-5';
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    const send = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);

    const { assets } = listProject();
    const dir = path.posix.dirname(rel);
    const assetList = assets.map((a) => `${path.posix.relative(dir, a.path)} (${a.type})`).join('\n') || '(nenhum)';
    const lint = lintSource(source, { baseDir: path.dirname(safe(rel)) });
    const ctx = `Arquivo: ${rel}\nTempo atual do playhead: ${body.time ?? 0}s\n` +
      (body.selection != null ? `Item selecionado na timeline: índice ${body.selection} (${body.selectionLabel || ''})\n` : '') +
      `Assets do projeto (caminhos relativos ao arquivo):\n${assetList}\n` +
      (lint.length ? `Avisos do lint:\n${lint.map((l) => `- [${l.level}] ${l.message}`).join('\n')}\n` : '') +
      `\nConteúdo atual:\n\`\`\`html\n${source}\n\`\`\``;
    const messages = (body.messages || []).slice(-12).map((m) => ({ role: m.role, content: m.content }));
    if (!messages.length || messages[messages.length - 1].role !== 'user') { send({ error: 'mensagem vazia' }); res.end(); return; }
    messages[messages.length - 1] = { role: 'user', content: `${ctx}\n\nPedido: ${messages[messages.length - 1].content}` };

    if (process.env.LOOPMOTION_AI_MOCK) { // modo de desenvolvimento, sem chamar a API
      const out = `Mudei o primeiro texto editável para mostrar a edição pela IA.\n\n\`\`\`html\n${source.replace(/(<[a-z0-9]+[^>]*data-var="[^"]+"[^>]*>)[^<]*/i, '$1Editado pela IA')}\n\`\`\``;
      for (const part of out.match(/[\s\S]{1,40}/g)) { send({ text: part }); await new Promise((r) => setTimeout(r, 5)); }
      send({ done: true }); res.end(); return;
    }
    if (!key) { send({ error: 'Configure sua chave da Anthropic em ⚙ Configurações (ou ANTHROPIC_API_KEY).' }); res.end(); return; }

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 32000, stream: true, system: systemPrompt(), messages }),
      });
      if (!r.ok) { send({ error: `API ${r.status}: ${(await r.text()).slice(0, 400)}` }); res.end(); return; }
      const decoder = new TextDecoder(); let buf = '';
      for await (const chunk of r.body) {
        buf += decoder.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const evt = buf.slice(0, i); buf = buf.slice(i + 2);
          const line = evt.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const d = JSON.parse(line.slice(6));
          if (d.type === 'content_block_delta' && d.delta?.type === 'text_delta') send({ text: d.delta.text });
          if (d.type === 'error') send({ error: d.error?.message || 'erro da API' });
        }
      }
      send({ done: true });
    } catch (e) { send({ error: e.message }); }
    res.end();
  }

  // ---------------------------------------------------------------- rotas
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    const q = (k) => url.searchParams.get(k);
    try {
      if (p === '/' ) { res.writeHead(302, { Location: '/studio/' }).end(); return; }
      if (p.startsWith('/studio/')) {
        const f = path.join(UI_DIR, path.normalize(p.slice(8) || 'index.html'));
        if (!f.startsWith(UI_DIR)) throw Object.assign(new Error('x'), { code: 403 });
        sendFile(req, res, f); return;
      }
      if (BUILTINS[p]) { sendFile(req, res, BUILTINS[p]); return; }
      if (p.startsWith('/blk/')) { const f = path.join(BLOCKS_DIR, path.normalize(p.slice(5))); if (!f.startsWith(BLOCKS_DIR)) throw Object.assign(new Error('x'), { code: 403 }); sendFile(req, res, f); return; }
      if (p === '/api/blocks') { json(res, 200, listBlocks().map((b) => ({ ...b, thumb: fs.existsSync(path.join(BLOCKS_DIR, b.id, 'thumb.jpg')) ? `/blk/${b.id}/thumb.jpg` : null }))); return; }
      if (p.startsWith('/tpl/')) { const f = path.join(TEMPLATES_DIR, path.normalize(p.slice(5))); if (!f.startsWith(TEMPLATES_DIR)) throw Object.assign(new Error('x'), { code: 403 }); sendFile(req, res, f); return; }

      // arquivos do projeto (composições recebem o runtime)
      if (p.startsWith('/p/')) {
        const f = safe(p.slice(3));
        if (f.endsWith('.html')) {
          const studio = url.searchParams.has('lmstudio');
          sendFile(req, res, f, (src) => injectRuntime(studio ? (() => { try { return C.annotate(src); } catch { return src; } })() : src));
        } else sendFile(req, res, f);
        return;
      }

      if (p === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
        res.write(': ok\n\n'); clients.add(res);
        const ping = setInterval(() => res.write(': ping\n\n'), 20000);
        req.on('close', () => { clients.delete(res); clearInterval(ping); });
        return;
      }
      if (p === '/api/project') {
        const s = loadSettings();
        json(res, 200, { ...listProject(), templates: listTemplates(), jobs: [...jobs.values()],
          ai: { configured: !!(process.env.ANTHROPIC_API_KEY || s.anthropicApiKey || process.env.LOOPMOTION_AI_MOCK), model: process.env.LOOPMOTION_MODEL || s.model || 'claude-sonnet-5-5' } });
        return;
      }
      if (p === '/api/comp' && req.method === 'GET') { json(res, 200, state(q('path'))); return; }
      if (p === '/api/comp' && req.method === 'PUT') {
        const { source } = await readJson(req);
        writeComp(q('path'), source); json(res, 200, state(q('path'))); return;
      }
      if (p === '/api/comp/op' && req.method === 'POST') {
        const rel = q('path'); const b = await readJson(req); let s = readComp(rel);
        switch (b.op) {
          case 'setItem': s = C.setItemAttrs(s, b.index, b.attrs); break;
          case 'setItems': for (const it of b.items) s = C.setItemAttrs(s, it.index, it.attrs); break;
          case 'setConfig': s = C.setConfig(s, b.config); break;
          case 'setVar': s = C.setVarDefault(s, b.name, b.value); break;
          case 'remove': s = C.removeItem(s, b.index); break;
          case 'duplicate': s = C.duplicateItem(s, b.index, b.offset || 0); break;
          case 'insert': s = C.insertItem(s, b.snippet, b.parent ?? null); break;
          case 'addBlock': s = addBlock(s, b.block, { at: b.at ?? 0, duration: b.duration }).source; break;
          default: throw new Error(`operação desconhecida: ${b.op}`);
        }
        writeComp(rel, s); json(res, 200, state(rel)); return;
      }
      if ((p === '/api/undo' || p === '/api/redo') && req.method === 'POST') {
        const rel = q('path'); const h = hist(rel); const cur = readComp(rel);
        const [from, to] = p === '/api/undo' ? [h.undo, h.redo] : [h.redo, h.undo];
        if (from.length) { to.push(cur); const next = from.pop(); known.set(rel, next); fs.writeFileSync(safe(rel), next); }
        json(res, 200, state(rel)); return;
      }
      if (p === '/api/new' && req.method === 'POST') {
        const b = await readJson(req);
        const tdir = path.join(TEMPLATES_DIR, path.basename(b.template || 'blank'));
        let name = slug(b.name); let i = 2;
        while (fs.existsSync(path.join(root, name))) name = `${slug(b.name)}-${i++}`;
        fs.cpSync(tdir, path.join(root, name), { recursive: true, filter: (f) => !/meta\.json$|thumb\.(jpg|png)$/.test(f) });
        emit({ type: 'tree' });
        json(res, 200, { path: `${name}/index.html` }); return;
      }
      if (p === '/api/upload' && req.method === 'POST') {
        const name = path.basename(q('name') || 'arquivo').replace(/[^\w.\- ]+/g, '_');
        let target = path.join(root, 'assets', name); let i = 2;
        while (fs.existsSync(target)) { const e = path.extname(name); target = path.join(root, 'assets', `${path.basename(name, e)}-${i++}${e}`); }
        fs.writeFileSync(target, await readBody(req));
        emit({ type: 'tree' });
        json(res, 200, { path: path.relative(root, target).split(path.sep).join('/') }); return;
      }
      if (p === '/api/render' && req.method === 'POST') { json(res, 200, enqueueRender(await readJson(req))); return; }
      if (p === '/api/ai' && req.method === 'POST') { await aiStream(req, res); return; }
      if (p === '/api/settings' && req.method === 'GET') {
        const s = loadSettings(); json(res, 200, { model: s.model || 'claude-sonnet-5-5', hasKey: !!(s.anthropicApiKey || process.env.ANTHROPIC_API_KEY) }); return;
      }
      if (p === '/api/settings' && req.method === 'PUT') {
        const b = await readJson(req); const s = loadSettings();
        if (b.anthropicApiKey !== undefined) s.anthropicApiKey = b.anthropicApiKey || undefined;
        if (b.model) s.model = b.model;
        saveSettings(s); json(res, 200, { ok: true }); return;
      }
      res.writeHead(404).end('not found');
    } catch (e) {
      json(res, e.code === 403 ? 403 : 400, { error: e.message });
    }
  });

  await new Promise((r) => server.listen(port, host, r));
  return { server, url: `http://${host}:${server.address().port}/studio/` };
}
