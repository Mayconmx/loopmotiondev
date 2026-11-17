// LoopMotion Studio — interface do editor.
import { EditorView, basicSetup, html as htmlLang, oneDark, keymap, EditorState } from './vendor/codemirror.js';

// ============================================================ ícones
const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  chev: P('<path d="m6 9 6 6 6-6"/>'), undo: P('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  redo: P('<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>'), check: P('<path d="M20 6 9 17l-5-5"/>'),
  warn: P('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
  gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  export: P('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'), upload: P('<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>'),
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  start: P('<path d="M6 5v14M18 6 9 12l9 6z"/>'), prev: P('<path d="m15 18-6-6 6-6"/>'), next: P('<path d="m9 18 6-6-6-6"/>'),
  loop: P('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  sound: P('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  spark: P('<path d="M12 3 13.9 9.1 20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z"/><path d="M19 3v4M17 5h4"/>'),
  send: P('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'), text: P('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
  scene: P('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
  image: P('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  video: P('<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4z"/>'),
  audio: P('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  font: P('<path d="M4 20 10 4h4l6 16M7 14h10"/>'), file: P('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  film: P('<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>'),
  zoomin: P('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>'), zoomout: P('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>'),
  trash: P('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'), copy: P('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  dl: P('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'), x: P('<path d="M18 6 6 18M6 6l12 12"/>'),
};
const icon = (n) => `<i data-i="${n}">${ICONS[n] || ''}</i>`;
const hydrateIcons = (root = document) => root.querySelectorAll('i[data-i]:empty').forEach((el) => { el.innerHTML = ICONS[el.dataset.i] || ''; });
hydrateIcons();

// ============================================================ utilidades
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r3 = (n) => Math.round(n * 1000) / 1000;
const fmtTC = (t) => { const m = Math.floor(t / 60); const s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };
const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const KIND_COLOR = { scene: 'var(--scene)', image: 'var(--image)', video: 'var(--video)', audio: 'var(--audio)' };
const KIND_ICON = { scene: 'scene', image: 'image', video: 'video', audio: 'audio' };
const KIND_NAME = { scene: 'Cena', image: 'Imagem', video: 'Vídeo', audio: 'Áudio' };

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

function toast(msg, { type = '', action, onAction, ms = 3500 } = {}) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { onAction?.(); el.remove(); };
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function modal({ title, body, actions = [], wide = false, onMount }) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><header><h3>${esc(title)}</h3><button class="icon" data-close>${icon('x')}</button></header>
    <div class="body">${body}</div>${actions.length ? `<footer>${actions.map((a, i) => `<button class="${a.primary ? 'primary' : 'mini'}" data-a="${i}">${esc(a.label)}</button>`).join('')}</footer>` : ''}</div>`;
  const close = () => bg.remove();
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
  bg.querySelector('[data-close]').onclick = close;
  actions.forEach((a, i) => { bg.querySelector(`[data-a="${i}"]`).onclick = async () => { if ((await a.onClick?.(bg)) !== false) close(); }; });
  $('#modalRoot').appendChild(bg);
  onMount?.(bg, close);
  return { el: bg, close };
}

function menu(anchor, items) {
  $$('.menu').forEach((m) => m.remove());
  const m = document.createElement('div');
  m.className = 'menu';
  m.innerHTML = items.map((it, i) => (it === '-' ? '<hr>' : `<button data-m="${i}">${it.icon ? icon(it.icon) : ''}<span>${esc(it.label)}</span>${it.meta ? `<span class="meta">${esc(it.meta)}</span>` : ''}</button>`)).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  m.style.left = `${Math.min(r.left, innerWidth - m.offsetWidth - 8)}px`;
  m.style.top = `${r.bottom + 6}px`;
  items.forEach((it, i) => { if (it !== '-') m.querySelector(`[data-m="${i}"]`).onclick = () => { m.remove(); it.onClick(); }; });
  setTimeout(() => document.addEventListener('mousedown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off); } }), 0);
}

// ============================================================ estado
const S = {
  project: null, path: null, comp: null, time: 0, playing: false, selected: null,
  pps: 100, zoomFit: true, lm: null, seeking: false, pendingSeek: null, aiMessages: [], aiBusy: false,
};
const cfg = () => S.comp?.model?.config || { width: 1920, height: 1080, fps: 30, duration: 5 };
const items = () => S.comp?.model?.items || [];
const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '');
const relFromComp = (assetPath) => {
  const from = dirOf(S.path).split('/').filter(Boolean); const to = assetPath.split('/');
  let i = 0; while (i < from.length && from[i] === to[i]) i++;
  return [...from.slice(i).map(() => '..'), ...to.slice(i)].join('/');
};

// ============================================================ projeto
async function loadProject() {
  S.project = await api('/api/project');
  renderProjectLists();
  renderAssets();
  renderTemplates();
  const comps = S.project.compositions;
  if (!S.path || !comps.find((c) => c.path === S.path)) {
    const saved = localStorageGet('lm:last');
    const pick = comps.find((c) => c.path === saved) || comps[0];
    if (pick) await openComp(pick.path); else showEmpty(true);
  }
}
function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

function showEmpty(on) {
  $('#empty').classList.toggle('hidden', !on);
  $('#frame').classList.toggle('hidden', on);
  if (on) { $('#compName').textContent = 'Nenhuma composição'; renderTemplates(); }
}

function renderProjectLists() {
  const p = S.project; if (!p) return;
  $('#compList').innerHTML = p.compositions.map((c) => `<li data-p="${esc(c.path)}" class="${c.path === S.path ? 'on' : ''}">${icon('film')}<span class="nm">${esc(c.name)}</span><span class="meta">${c.config.width}×${c.config.height}</span></li>`).join('')
    || '<li class="dim">Nenhuma ainda</li>';
  $$('#compList li[data-p]').forEach((li) => { li.onclick = () => openComp(li.dataset.p); });
  const jobs = (p.jobs || []).filter((j) => j.status !== 'done').reverse();
  $('#exportList').innerHTML = [
    ...jobs.map((j) => `<li>${icon('export')}<span class="nm">${esc(j.output.split('/').pop())}</span>${j.status === 'error' ? `<span class="meta" style="color:var(--err)">erro</span>` : `<span class="bar"><div style="width:${Math.round(j.progress * 100)}%"></div></span>`}</li>`),
    ...p.exports.slice(0, 12).map((e) => `<li data-x="${esc(e.path)}">${icon('film')}<span class="nm">${esc(e.name)}</span><span class="meta">${fmtSize(e.size)}</span></li>`),
  ].join('') || '<li class="dim" style="cursor:default">Nada exportado ainda</li>';
  $$('#exportList li[data-x]').forEach((li) => { li.onclick = () => showVideo(li.dataset.x); });
}

function renderAssets() {
  const list = S.project?.assets || [];
  $('#assetGrid').innerHTML = list.map((a) => `<div class="asset" draggable="true" data-a="${esc(a.path)}" data-t="${a.type}" title="${esc(a.path)}">
      ${a.type === 'image' ? `<img src="/p/${encodeURI(a.path)}" loading="lazy">` : a.type === 'video' ? `<video src="/p/${encodeURI(a.path)}#t=0.5" muted preload="metadata"></video>` : `<div class="ph">${icon(a.type === 'audio' ? 'audio' : a.type === 'font' ? 'font' : 'file')}</div>`}
      <div class="cap">${esc(a.name)}</div>${['image', 'video', 'audio'].includes(a.type) ? '<div class="add">+ add</div>' : ''}</div>`).join('')
    || '<p class="tip" style="grid-column:1/-1;text-align:center">Sua mídia aparece aqui.</p>';
  $$('#assetGrid .asset').forEach((el) => {
    el.onclick = () => addMedia(el.dataset.a, el.dataset.t);
    el.ondragstart = (e) => e.dataTransfer.setData('text/lm-asset', JSON.stringify({ path: el.dataset.a, type: el.dataset.t }));
  });
}

function renderTemplates() {
  const tpls = S.project?.templates || [];
  const html = tpls.map((t) => `<button class="tpl" data-t="${esc(t.id)}"><span class="th" style="${t.thumb ? `background-image:url(${t.thumb})` : ''}"></span><span class="tx">${t.format ? `<span class="fmt">${esc(t.format)}</span>` : ''}<b>${esc(t.name)}</b><small>${esc(t.description)}</small></span></button>`).join('');
  $('#tplGrid').innerHTML = html;
  $('#emptyTpls').innerHTML = html;
  $$('#tplGrid .tpl, #emptyTpls .tpl').forEach((b) => { b.onclick = () => newFromTemplate(b.dataset.t); });
}

let BLOCKS = [];
async function loadBlocks() {
  BLOCKS = await api('/api/blocks');
  let cat = '';
  $('#blockGrid').innerHTML = BLOCKS.map((b) => {
    const head = b.category !== cat ? `<h4 class="blk-cat">${esc((cat = b.category))}</h4>` : '';
    return `${head}<button class="tpl" data-b="${esc(b.id)}"><span class="th" style="${b.thumb ? `background-image:url(${b.thumb})` : ''}"></span><span class="tx"><b>${esc(b.name)}</b><small>${esc(b.description)}</small></span></button>`;
  }).join('');
  $$('#blockGrid .tpl').forEach((el) => { el.onclick = () => insertBlock(el.dataset.b); });
}
async function insertBlock(id) {
  if (!S.path) return;
  const b = BLOCKS.find((x) => x.id === id);
  const before = items().length;
  await op({ op: 'addBlock', block: id, at: b?.duration == null ? 0 : S.time });
  if (items().length > before) select(b?.position === 'back' ? 0 : items().length - 1);
  toast(`Bloco “${b?.name || id}” inserido`, { type: 'ok', action: 'Desfazer', onAction: undo });
}

async function newFromTemplate(id) {
  const t = S.project.templates.find((x) => x.id === id);
  modal({
    title: `Novo vídeo · ${t?.name || id}`,
    body: `<div class="field"><label>Nome</label><input id="nn" value="${esc(t?.name || 'Meu vídeo')}" autofocus></div>`,
    actions: [{ label: 'Cancelar' }, {
      label: 'Criar', primary: true, onClick: async (el) => {
        const r = await api('/api/new', { method: 'POST', body: JSON.stringify({ template: id, name: $('#nn', el).value }) });
        await loadProject(); await openComp(r.path); toast('Composição criada', { type: 'ok' });
      },
    }],
    onMount: (el) => { const i = $('#nn', el); i.select(); i.onkeydown = (e) => { if (e.key === 'Enter') $('[data-a="1"]', el).click(); }; },
  });
}

// ============================================================ composição
async function openComp(path) {
  stop();
  S.path = path; S.selected = null; S.aiMessages = [];
  localStorageSet('lm:last', path);
  showEmpty(false);
  const st = await api(`/api/comp?path=${encodeURIComponent(path)}`);
  S.time = 0;
  setComp(st, { reload: true, resetCode: true });
  renderProjectLists();
  renderAI();
  const name = S.project.compositions.find((c) => c.path === path)?.name || path;
  $('#compName').textContent = name;
  document.title = `${name} · LoopMotion Studio`;
}

function setComp(st, { reload = true, resetCode = false } = {}) {
  const changed = !S.comp || S.comp.source !== st.source;
  S.comp = st;
  if (S.selected != null && S.selected >= items().length) S.selected = null;
  $('#undoBtn').disabled = !st.canUndo;
  $('#redoBtn').disabled = !st.canRedo;
  renderLint();
  $('#tcDur').textContent = fmtTC(cfg().duration);
  $('#resLabel').textContent = `${cfg().width}×${cfg().height} · ${cfg().fps} fps`;
  if (S.zoomFit) fitZoom(); else renderTimeline();
  renderLayers();
  renderInspector();
  if (changed || resetCode) syncCode(resetCode);
  if (changed && reload) loadPreview();
}

async function op(body, { reload = true } = {}) {
  try {
    const st = await api(`/api/comp/op?path=${encodeURIComponent(S.path)}`, { method: 'POST', body: JSON.stringify(body) });
    setComp(st, { reload });
  } catch (e) { toast(e.message, { type: 'err' }); }
}
async function saveSource(source, { quiet = false } = {}) {
  const st = await api(`/api/comp?path=${encodeURIComponent(S.path)}`, { method: 'PUT', body: JSON.stringify({ source }) });
  setComp(st);
  if (!quiet) $('#codeStatus').textContent = 'salvo';
}
async function undo() { if (!S.path) return; setComp(await api(`/api/undo?path=${encodeURIComponent(S.path)}`, { method: 'POST' })); }
async function redo() { if (!S.path) return; setComp(await api(`/api/redo?path=${encodeURIComponent(S.path)}`, { method: 'POST' })); }

function renderLint() {
  const l = S.comp?.lint || [];
  const errs = l.filter((x) => x.level === 'error').length; const warns = l.length - errs;
  const b = $('#lintBtn');
  b.className = `lint ${errs ? 'err' : warns ? 'warn' : 'ok'}`;
  b.innerHTML = `${icon(errs || warns ? 'warn' : 'check')}<span>${errs ? `${errs} erro${errs > 1 ? 's' : ''}` : warns ? `${warns} aviso${warns > 1 ? 's' : ''}` : 'OK'}</span>`;
}
function lintListHTML() {
  const l = S.comp?.lint || [];
  if (!l.length) return '<p class="tip">Tudo certo. Nenhum problema encontrado.</p>';
  return `<ul class="lint-list">${l.map((x) => `<li><span class="lv ${x.level}">${x.level === 'error' ? 'erro' : 'aviso'}</span><span>${esc(x.message)} ${x.line ? `<span class="ln" data-line="${x.line}">linha ${x.line}</span>` : ''}</span></li>`).join('')}</ul>`;
}

// ============================================================ preview
const iframe = $('#preview');
let previewLoadId = 0;
function previewURL() { return `/p/${encodeURI(S.path)}?lmstudio=1&v=${Date.now()}`; }
function loadPreview() {
  if (!S.path) return;
  const id = ++previewLoadId;
  S.lm = null;
  iframe.onload = async () => {
    if (id !== previewLoadId) return;
    try {
      const lm = iframe.contentWindow.loopmotion;
      await lm.ready();
      if (id !== previewLoadId) return;
      S.lm = lm;
      fitStage();
      await seek(S.time, true);
      highlight();
    } catch (e) { console.error(e); }
  };
  iframe.src = previewURL();
  fitStage();
}
function fitStage() {
  const { width, height } = cfg();
  const st = $('#stage');
  const s = Math.min((st.clientWidth - 48) / width, (st.clientHeight - 40) / height);
  iframe.style.width = `${width}px`; iframe.style.height = `${height}px`;
  iframe.style.transform = `scale(${s})`;
  $('#frame').style.width = `${width * s}px`; $('#frame').style.height = `${height * s}px`;
}
new ResizeObserver(() => { fitStage(); if (S.zoomFit) fitZoom(); }).observe($('#stage'));

async function seek(t, force = false) {
  const c = cfg();
  const maxT = c.duration - 1 / c.fps;
  S.time = clamp(Math.round(t * c.fps) / c.fps, 0, Math.max(0, maxT));
  $('#tcNow').textContent = fmtTC(S.time);
  positionPlayhead();
  if (!S.lm) return;
  if (S.seeking && !force) { S.pendingSeek = S.time; return; }
  S.seeking = true;
  try { await S.lm.seek(S.time); } catch (e) { console.error(e); }
  S.seeking = false;
  if (S.pendingSeek != null) { const p = S.pendingSeek; S.pendingSeek = null; if (p !== S.time || true) await seek(p); }
}
function highlight() { try { iframe.contentWindow.postMessage({ type: 'lm:highlight', index: S.playing ? null : S.selected }, '*'); } catch { /* */ } }
addEventListener('message', (e) => { if (e.data?.type === 'lm:select') select(e.data.index); });

// ---- reprodução (com áudio sincronizado no preview)
let playStart = 0; let playFrom = 0; let audios = [];
function play() {
  if (!S.lm) return;
  if (S.time >= cfg().duration - 2 / cfg().fps) S.time = 0;
  S.playing = true; playStart = performance.now(); playFrom = S.time;
  $('#playBtn').innerHTML = icon('pause');
  highlight();
  startAudio(S.time);
  requestAnimationFrame(tick);
}
function stop() {
  S.playing = false; $('#playBtn').innerHTML = icon('play');
  audios.forEach((a) => { a.el.pause(); clearTimeout(a.timer); }); audios = [];
  highlight();
}
function tick(now) {
  if (!S.playing) return;
  let t = playFrom + (now - playStart) / 1000;
  const d = cfg().duration;
  if (t >= d) {
    if ($('#loopBtn').classList.contains('on')) { playFrom = 0; playStart = now; t = 0; stopAudio(); startAudio(0); } else { seek(d); stop(); return; }
  }
  if (!S.seeking) seek(t);
  requestAnimationFrame(tick);
}
function stopAudio() { audios.forEach((a) => { a.el.pause(); clearTimeout(a.timer); }); audios = []; }
function startAudio(t) {
  stopAudio();
  if (!$('#audioBtn').classList.contains('on')) return;
  for (const it of items().filter((i) => i.kind === 'audio' && i.src)) {
    const el = new Audio(`/p/${encodeURI(dirOf(S.path) + it.src)}`);
    el.volume = clamp(it.volume ?? 1, 0, 1);
    const local = t - it.absStart;
    const a = { el, timer: null };
    if (local >= 0) { el.currentTime = local; el.play().catch(() => {}); } else a.timer = setTimeout(() => el.play().catch(() => {}), -local * 1000);
    if (it.duration != null) setTimeout(() => el.pause(), (it.absStart + it.duration - t) * 1000);
    audios.push(a);
  }
}
$('#playBtn').onclick = () => (S.playing ? stop() : play());
$('#toStart').onclick = () => { stop(); seek(0); };
$('#prevFrame').onclick = () => { stop(); seek(S.time - 1 / cfg().fps); };
$('#nextFrame').onclick = () => { stop(); seek(S.time + 1 / cfg().fps); };
$('#loopBtn').onclick = (e) => e.currentTarget.classList.toggle('on');
$('#audioBtn').onclick = (e) => { e.currentTarget.classList.toggle('on'); if (S.playing) startAudio(S.time); };

// ============================================================ timeline
const LABEL_W = 190;
const tlScroll = $('#tlScroll');
function timelineWidth() { return Math.max(tlScroll.clientWidth, cfg().duration * S.pps + 120); }
function fitZoom() {
  S.zoomFit = true;
  S.pps = Math.max(10, (tlScroll.clientWidth - 40) / Math.max(1, cfg().duration));
  $('#zoom').value = 0;
  renderTimeline();
}
$('#fitBtn').onclick = fitZoom;
$('#zoom').oninput = (e) => {
  const fit = Math.max(10, (tlScroll.clientWidth - 40) / Math.max(1, cfg().duration));
  S.pps = fit * Math.pow(12, e.target.value / 100);
  S.zoomFit = +e.target.value === 0;
  renderTimeline();
};

function itemEnd(it) { return it.duration == null ? null : it.absStart + it.duration; }
function barGeom(it) {
  const d = cfg().duration;
  const end = it.duration == null ? Math.max(d, it.absStart + 1) : it.absStart + it.duration;
  return { left: it.absStart * S.pps, width: Math.max(6, (end - it.absStart) * S.pps), open: it.duration == null };
}

function renderRuler() {
  const w = timelineWidth();
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
  const major = steps.find((s) => s * S.pps >= 80) || 60;
  const minor = major / (major >= 1 ? 4 : 5);
  let html = '';
  for (let t = 0; t * S.pps < w; t = r3(t + minor)) {
    const isMajor = Math.abs(t / major - Math.round(t / major)) < 1e-6;
    html += `<div class="tick ${isMajor ? 'major' : ''}" style="left:${t * S.pps}px">${isMajor ? `<span>${t < 60 ? `${+t.toFixed(2)}s` : fmtTC(t)}</span>` : ''}</div>`;
  }
  $('#ruler').innerHTML = html;
}

function renderTimeline() {
  if (!S.comp) return;
  const its = items();
  const w = timelineWidth();
  $('#tlInner').style.width = `${w}px`;
  renderRuler();
  $('#tlLabels').innerHTML = '<div class="tl-corner"></div>' + its.map((it) => `<div class="tl-label ${it.index === S.selected ? 'on' : ''}" data-i="${it.index}" style="padding-left:${10 + it.depth * 14}px"><span class="sw" style="background:${KIND_COLOR[it.kind]}"></span>${icon(KIND_ICON[it.kind])}<span class="nm">${esc(it.label)}</span></div>`).join('');
  $$('.tl-label').forEach((el) => { el.onclick = () => select(+el.dataset.i); });
  $('#tracks').innerHTML = its.length ? its.map((it) => {
    const g = barGeom(it);
    return `<div class="track ${it.index === S.selected ? 'on' : ''}" data-i="${it.index}"><div class="clipbar ${g.open ? 'open' : ''} ${it.depth ? 'child' : ''} ${it.index === S.selected ? 'sel' : ''}" data-i="${it.index}" style="left:${g.left}px;width:${g.width}px;--c:${KIND_COLOR[it.kind]}">
      <div class="h l" data-h="l"></div><span class="nm">${esc(it.label)}</span><span class="dur">${it.duration == null ? '∞' : `${+it.duration.toFixed(2)}s`}</span><div class="h r" data-h="r"></div></div></div>`;
  }).join('') : '<div class="tl-empty">A timeline está vazia. Adicione um texto, uma cena ou arraste mídia para cá.</div>';
  const endX = cfg().duration * S.pps;
  $('#endMark').style.left = `${endX}px`;
  $('#endMark').style.width = `${Math.max(0, w - endX)}px`;
  positionPlayhead();
}
function positionPlayhead() { $('#playhead').style.left = `${S.time * S.pps}px`; }
tlScroll.addEventListener('scroll', () => { $('#tlLabels').scrollTop = tlScroll.scrollTop; });

// arrastar playhead pela régua
function scrubFrom(e) {
  const rect = $('#tlInner').getBoundingClientRect();
  const move = (ev) => { stop(); seek((ev.clientX - rect.left) / S.pps); };
  move(e);
  const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
  addEventListener('mousemove', move); addEventListener('mouseup', up);
}
$('#ruler').addEventListener('mousedown', scrubFrom);
$('.ph-head').addEventListener('mousedown', scrubFrom);
$('#tracks').addEventListener('mousedown', (e) => {
  if (e.target.closest('.clipbar')) return;
  if (e.target.closest('.track')) { select(null); scrubFrom(e); }
});

// arrastar / redimensionar clips
$('#tracks').addEventListener('mousedown', (e) => {
  const bar = e.target.closest('.clipbar'); if (!bar || e.button !== 0) return;
  e.preventDefault();
  const idx = +bar.dataset.i; const it = items()[idx];
  select(idx);
  const mode = e.target.dataset.h === 'l' ? 'l' : e.target.dataset.h === 'r' ? 'r' : 'move';
  const x0 = e.clientX; const parentAbs = it.absStart - it.start;
  const dur0 = it.duration ?? Math.max(0.1, cfg().duration - it.absStart);
  const descendants = items().filter((x) => isDescendant(x, idx));
  const others = items().filter((x) => x.index !== idx && !isDescendant(x, idx));
  const snapPts = [0, cfg().duration, S.time, ...others.flatMap((o) => [o.absStart, itemEnd(o)]).filter((v) => v != null)];
  const tip = document.createElement('div'); tip.className = 'drag-tip'; document.body.appendChild(tip);
  const snapline = document.createElement('div'); snapline.className = 'snapline'; snapline.style.display = 'none'; $('#tlInner').appendChild(snapline);
  let moved = false; let next = { abs: it.absStart, dur: it.duration };
  const snap = (t) => {
    if (!$('#snapChk').checked) { snapline.style.display = 'none'; return Math.round(t * cfg().fps) / cfg().fps; }
    const tol = 8 / S.pps; let best = null;
    for (const p of snapPts) if (Math.abs(p - t) < tol && (best == null || Math.abs(p - t) < Math.abs(best - t))) best = p;
    if (best != null) { snapline.style.display = ''; snapline.style.left = `${best * S.pps}px`; return best; }
    snapline.style.display = 'none';
    return Math.round(t * cfg().fps) / cfg().fps;
  };
  const onMove = (ev) => {
    const dt = (ev.clientX - x0) / S.pps;
    if (!moved && Math.abs(ev.clientX - x0) < 3) return;
    moved = true; bar.classList.add('drag');
    if (mode === 'move') {
      let abs = it.absStart + dt;
      const sStart = snap(abs); const sEnd = it.duration != null ? snap(abs + it.duration) : null;
      abs = sStart !== Math.round(abs * cfg().fps) / cfg().fps || sEnd == null ? sStart : sEnd - it.duration;
      abs = Math.max(parentAbs, abs);
      next = { abs, dur: it.duration };
    } else if (mode === 'r') {
      const end = Math.max(it.absStart + 1 / cfg().fps, snap(it.absStart + dur0 + dt));
      next = { abs: it.absStart, dur: end - it.absStart };
    } else {
      const end = it.absStart + dur0;
      const abs = clamp(snap(it.absStart + dt), parentAbs, end - 1 / cfg().fps);
      next = { abs, dur: end - abs };
    }
    const g = barGeom({ ...it, absStart: next.abs, duration: next.dur });
    bar.style.left = `${g.left}px`; bar.style.width = `${g.width}px`;
    bar.querySelector('.dur').textContent = next.dur == null ? '∞' : `${+next.dur.toFixed(2)}s`;
    const shift = next.abs - it.absStart;
    for (const d of descendants) { const b = $(`.clipbar[data-i="${d.index}"]`); if (b) b.style.left = `${(d.absStart + shift) * S.pps}px`; }
    tip.textContent = `${fmtTC(next.abs)} → ${next.dur == null ? '∞' : fmtTC(next.abs + next.dur)}  (${next.dur == null ? '∞' : `${next.dur.toFixed(2)}s`})`;
    tip.style.left = `${ev.clientX + 12}px`; tip.style.top = `${ev.clientY - 30}px`;
    livePreviewItem(idx, next.abs - parentAbs, next.dur);
  };
  const onUp = () => {
    removeEventListener('mousemove', onMove); removeEventListener('mouseup', onUp);
    tip.remove(); snapline.remove();
    if (!moved) return;
    const attrs = { 'data-start': r3(next.abs - parentAbs) };
    if (next.dur != null) attrs['data-duration'] = r3(next.dur);
    op({ op: 'setItem', index: idx, attrs }, { reload: false });
    // o preview já está atualizado ao vivo; recarrega em segundo plano para garantir
    setTimeout(loadPreview, 50);
  };
  addEventListener('mousemove', onMove); addEventListener('mouseup', onUp);
});
function isDescendant(x, idx) { let p = x.parent; while (p != null) { if (p === idx) return true; p = items()[p]?.parent; } return false; }
function livePreviewItem(idx, start, dur) {
  try {
    const el = iframe.contentDocument.querySelector(`[data-lm-index="${idx}"]`);
    if (!el) return;
    el.dataset.start = r3(start);
    if (dur != null) el.dataset.duration = r3(dur);
    seek(S.time);
  } catch { /* */ }
}

// soltar mídia na timeline
$('#tlBody').addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].some((t) => t === 'text/lm-asset' || t === 'Files')) e.preventDefault(); });
$('#tlBody').addEventListener('drop', async (e) => {
  e.preventDefault();
  const rect = $('#tlInner').getBoundingClientRect();
  const at = Math.max(0, (e.clientX - rect.left) / S.pps);
  const data = e.dataTransfer.getData('text/lm-asset');
  if (data) { const a = JSON.parse(data); addMedia(a.path, a.type, at); return; }
  if (e.dataTransfer.files.length) {
    const up = await uploadFiles(e.dataTransfer.files);
    for (const a of up) await addMedia(a.path, a.type, at);
  }
});

// ============================================================ seleção, camadas
function select(i) {
  S.selected = i == null || Number.isNaN(i) ? null : i;
  $$('.clipbar').forEach((b) => b.classList.toggle('sel', +b.dataset.i === S.selected));
  $$('.track').forEach((b) => b.classList.toggle('on', +b.dataset.i === S.selected));
  $$('.tl-label').forEach((b) => b.classList.toggle('on', +b.dataset.i === S.selected));
  $$('#layerList li').forEach((b) => b.classList.toggle('on', +b.dataset.i === S.selected));
  highlight();
  renderInspector();
  if (S.selected != null) {
    const it = items()[S.selected];
    if (it && (S.time < it.absStart || (itemEnd(it) != null && S.time >= itemEnd(it)))) seek(it.absStart + Math.min(0.5, (it.duration ?? 1) / 2));
    const tr = $(`.track[data-i="${S.selected}"]`);
    if (tr) { // rola as faixas (os nomes acompanham pelo listener de scroll)
      const top = tr.offsetTop; const h = tlScroll.clientHeight - 26;
      if (top < tlScroll.scrollTop) tlScroll.scrollTop = top;
      else if (top + tr.offsetHeight > tlScroll.scrollTop + h) tlScroll.scrollTop = top + tr.offsetHeight - h;
    }
  }
}
function renderLayers() {
  const its = items();
  $('#layerCount').textContent = its.length ? `${its.length}` : '';
  $('#layerList').innerHTML = its.map((it) => `<li data-i="${it.index}" class="${it.index === S.selected ? 'on' : ''}" style="padding-left:${8 + it.depth * 14}px"><span class="sw" style="background:${KIND_COLOR[it.kind]}"></span><span class="nm">${esc(it.label)}</span><span class="meta">${+it.absStart.toFixed(2)}s</span></li>`).join('') || '<li class="dim" style="cursor:default">Sem camadas</li>';
  $$('#layerList li[data-i]').forEach((li) => { li.onclick = () => select(+li.dataset.i); });
}

// ============================================================ inserir
const TEXT_SNIPPET = (t, label) => `<section class="clip" data-label="${label}" data-start="${r3(t)}" data-duration="3" data-enter="slide-up" data-exit="fade" style="position:absolute;inset:0;display:grid;place-items:center;">
    <h2 style="margin:0;color:#fff;font:800 ${Math.round(cfg().height * 0.09)}px/1.05 system-ui,sans-serif;letter-spacing:-0.02em;text-align:center;text-shadow:0 4px 30px #0008;">Seu texto aqui</h2>
  </section>`;
async function addText() {
  const n = items().filter((i) => (i.label || '').startsWith('Texto')).length + 1;
  await op({ op: 'insert', snippet: TEXT_SNIPPET(S.time, `Texto ${n}`) });
  select(items().length - 1);
}
async function addScene() {
  const n = items().filter((i) => (i.label || '').startsWith('Cena')).length + 1;
  const start = Math.min(S.time, Math.max(0, cfg().duration - 1));
  await op({ op: 'insert', snippet: `<section class="clip" data-label="Cena ${n}" data-start="${r3(start)}" data-duration="3" data-enter="fade" style="position:absolute;inset:0;background:linear-gradient(135deg,#1e1b4b,#0f172a);display:grid;place-items:center;">
    <h2 style="margin:0;color:#fff;font:700 ${Math.round(cfg().height * 0.07)}px system-ui,sans-serif;">Cena ${n}</h2>
  </section>` });
  select(items().length - 1);
}
async function addMedia(assetPath, type, at = S.time) {
  if (!S.path) return;
  const src = relFromComp(assetPath);
  const name = assetPath.split('/').pop().replace(/\.[^.]+$/, '');
  let snippet;
  if (type === 'image') snippet = `<img class="clip" data-label="${esc(name)}" src="${esc(src)}" data-start="${r3(at)}" data-duration="3" data-enter="fade" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`;
  else if (type === 'video') snippet = `<video class="clip" data-label="${esc(name)}" src="${esc(src)}" data-start="${r3(at)}" data-duration="4" muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></video>`;
  else if (type === 'audio') snippet = `<audio data-label="${esc(name)}" src="${esc(src)}" data-start="${r3(at)}" data-volume="1"></audio>`;
  else { toast('Esse tipo de arquivo não vai direto na timeline. Use-o pelo código (ex.: fontes no CSS).'); return; }
  await op({ op: 'insert', snippet });
  select(items().length - 1);
  toast(`${KIND_NAME[type]} adicionad${type === 'image' ? 'a' : 'o'} à timeline`, { type: 'ok' });
}
$('#addText').onclick = addText;
$('#addScene').onclick = addScene;
$('#addMedia').onclick = (e) => {
  const media = (S.project?.assets || []).filter((a) => ['image', 'video', 'audio'].includes(a.type));
  menu(e.currentTarget, [
    { label: 'Enviar arquivo…', icon: 'upload', onClick: () => $('#fileInput').click() },
    ...(media.length ? ['-'] : []),
    ...media.slice(0, 14).map((a) => ({ label: a.name, icon: a.type, meta: KIND_NAME[a.type], onClick: () => addMedia(a.path, a.type) })),
  ]);
};

// ============================================================ inspetor
const ENTER_OPTS = [['', 'Nenhuma'], ['fade', 'Fade'], ['slide-up', 'Subir'], ['slide-down', 'Descer'], ['slide-left', 'Da direita'], ['slide-right', 'Da esquerda'], ['zoom', 'Zoom'], ['pop', 'Pop'], ['blur', 'Desfoque'], ['wipe', 'Revelar']];
const FORMAT_PRESETS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080], ['4:5', 1080, 1350], ['4K', 3840, 2160]];
function readItemAttr(idx, name) {
  try { return iframe.contentDocument.querySelector(`[data-lm-index="${idx}"]`)?.getAttribute(name) ?? null; } catch { return null; }
}

function renderInspector() {
  const box = $('#inspector');
  if (!S.comp) { box.innerHTML = ''; return; }
  const it = S.selected != null ? items()[S.selected] : null;
  if (!it) { renderCompInspector(box); return; }
  const vars = (S.comp.model.vars || []).filter((v) => v.owner === it.index || isOwnedBy(v.owner, it.index));
  const enter = readItemAttr(it.index, 'data-enter') || ''; const exit = readItemAttr(it.index, 'data-exit') || '';
  box.innerHTML = `
    <div class="insp-sec"><div class="insp-title"><span class="kind" style="background:${KIND_COLOR[it.kind]}">${KIND_NAME[it.kind]}</span><span>${esc(it.label)}</span></div></div>
    <div class="insp-sec"><h5>Tempo</h5><div class="fields three">
      <div class="field"><label>Início</label><div class="unit" data-u="s"><input type="number" step="0.1" min="0" id="fStart" value="${r3(it.start)}"></div></div>
      <div class="field"><label>Duração</label><div class="unit" data-u="s"><input type="number" step="0.1" min="0.05" id="fDur" value="${it.duration ?? ''}" placeholder="∞"></div></div>
      <div class="field"><label>Fim</label><div class="unit" data-u="s"><input type="number" step="0.1" id="fEnd" value="${it.duration == null ? '' : r3(it.absStart + it.duration)}" placeholder="—"></div></div>
    </div>${it.parent != null ? `<p class="tip" style="margin-top:8px">Início relativo a “${esc(items()[it.parent].label)}” (absoluto: ${+it.absStart.toFixed(2)}s).</p>` : ''}</div>
    <div class="insp-sec"><h5>Nome</h5><div class="field"><input id="fLabel" value="${esc(readItemAttr(it.index, 'data-label') || '')}" placeholder="${esc(it.label)}"></div></div>
    ${it.kind !== 'audio' ? `<div class="insp-sec"><h5>Animação</h5><div class="fields">
      <div class="field"><label>Entrada</label><select id="fEnter">${ENTER_OPTS.map(([v, l]) => `<option value="${v}" ${v === enter ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Saída</label><select id="fExit" ${it.duration == null ? 'disabled title="Defina uma duração para usar saída"' : ''}>${ENTER_OPTS.map(([v, l]) => `<option value="${v}" ${v === exit ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div></div>` : ''}
    ${it.kind === 'audio' || it.kind === 'video' ? `<div class="insp-sec"><h5>Mídia</h5><div class="fields">
      ${it.kind === 'audio' ? `<div class="field"><label>Volume</label><input type="range" min="0" max="1.5" step="0.05" id="fVol" value="${it.volume}"></div>` : ''}
      <div class="field"><label>Começar a mídia em</label><div class="unit" data-u="s"><input type="number" step="0.1" min="0" id="fOffset" value="${readItemAttr(it.index, 'data-offset') || 0}"></div></div>
      <div class="field full"><label>Arquivo</label><input value="${esc(it.src || '')}" disabled></div>
    </div></div>` : ''}
    ${vars.length ? `<div class="insp-sec"><h5>Textos e variáveis</h5><div class="fields">${vars.map((v) => varField(v)).join('')}</div></div>` : ''}
    <div class="insp-sec"><div class="btn-row">
      <button class="mini" id="bDup">${icon('copy')}Duplicar</button>
      <button class="mini danger" id="bDel">${icon('trash')}Excluir</button>
      <button class="mini" id="bAsk">${icon('spark')}Pedir à IA</button>
    </div></div>`;
  const idx = it.index;
  const setAttrs = (attrs) => op({ op: 'setItem', index: idx, attrs });
  $('#fStart').onchange = (e) => setAttrs({ 'data-start': Math.max(0, +e.target.value) });
  $('#fDur').onchange = (e) => setAttrs({ 'data-duration': e.target.value === '' ? null : Math.max(0.05, +e.target.value) });
  $('#fEnd').onchange = (e) => { if (e.target.value !== '') setAttrs({ 'data-duration': Math.max(0.05, +e.target.value - it.absStart) }); };
  $('#fLabel').onchange = (e) => setAttrs({ 'data-label': e.target.value.trim() || null });
  if ($('#fEnter')) $('#fEnter').onchange = (e) => setAttrs({ 'data-enter': e.target.value || null });
  if ($('#fExit')) $('#fExit').onchange = (e) => setAttrs({ 'data-exit': e.target.value || null });
  if ($('#fVol')) $('#fVol').onchange = (e) => setAttrs({ 'data-volume': +e.target.value });
  if ($('#fOffset')) $('#fOffset').onchange = (e) => setAttrs({ 'data-offset': +e.target.value || null });
  bindVarFields(box);
  $('#bDup').onclick = () => duplicateSelected();
  $('#bDel').onclick = () => deleteSelected();
  $('#bAsk').onclick = () => { switchTab('right', 'ai'); const i = $('#aiInput'); i.value = `Na camada “${it.label}”, `; i.focus(); };
}
function isOwnedBy(owner, idx) { let p = owner; while (p != null) { if (p === idx) return true; p = items()[p]?.parent; } return false; }
function varField(v) {
  const long = (v.value || '').length > 28;
  return `<div class="field full"><label>${esc(v.name)}${v.kind === 'src' ? ' (arquivo)' : ''}</label>${long ? `<textarea rows="2" data-var="${esc(v.name)}">${esc(v.value)}</textarea>` : `<input data-var="${esc(v.name)}" value="${esc(v.value)}">`}</div>`;
}
function bindVarFields(box) {
  $$('[data-var]', box).forEach((inp) => {
    inp.oninput = () => { // preview instantâneo
      try { iframe.contentDocument.querySelectorAll(`[data-var="${CSS.escape(inp.dataset.var)}"]`).forEach((el) => { el.textContent = inp.value; }); } catch { /* */ }
    };
    inp.onchange = () => op({ op: 'setVar', name: inp.dataset.var, value: inp.value });
  });
}
function renderCompInspector(box) {
  const c = cfg(); const vars = S.comp.model?.vars || [];
  const fmt = FORMAT_PRESETS.find(([, w, h]) => w === c.width && h === c.height)?.[0];
  box.innerHTML = `
    <div class="insp-sec"><div class="insp-title">${icon('film')}<span>Composição</span></div><p class="tip" style="margin-top:6px">Clique numa camada da timeline ou no preview para editá-la.</p></div>
    <div class="insp-sec"><h5>Formato</h5><div class="presets">${FORMAT_PRESETS.map(([n, w, h]) => `<button data-w="${w}" data-h="${h}" class="${n === fmt ? 'on' : ''}"><span class="ar" style="width:${Math.round(w / Math.max(w, h) * 14)}px;height:${Math.round(h / Math.max(w, h) * 14)}px"></span>${n}</button>`).join('')}</div>
      <div class="fields" style="margin-top:10px">
        <div class="field"><label>Largura</label><div class="unit" data-u="px"><input type="number" id="cW" value="${c.width}"></div></div>
        <div class="field"><label>Altura</label><div class="unit" data-u="px"><input type="number" id="cH" value="${c.height}"></div></div>
        <div class="field"><label>Duração</label><div class="unit" data-u="s"><input type="number" step="0.5" min="0.5" id="cD" value="${c.duration}"></div></div>
        <div class="field"><label>FPS</label><select id="cF">${[24, 25, 30, 50, 60].map((f) => `<option ${f === c.fps ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      </div><p class="tip" style="margin-top:8px">Ao mudar o formato, o layout não se adapta sozinho. Peça à IA: “adapte para 9:16”.</p></div>
    ${vars.length ? `<div class="insp-sec"><h5>Textos e variáveis</h5><div class="fields">${vars.map(varField).join('')}</div><p class="tip" style="margin-top:8px">Variáveis viram campos de template: <code>loopmotion render --props dados.json</code></p></div>` : ''}
    <div class="insp-sec"><h5>Verificação</h5>${lintListHTML()}</div>`;
  $$('.presets button', box).forEach((b) => { b.onclick = () => op({ op: 'setConfig', config: { width: +b.dataset.w, height: +b.dataset.h } }); });
  $('#cW').onchange = (e) => op({ op: 'setConfig', config: { width: Math.max(16, +e.target.value) } });
  $('#cH').onchange = (e) => op({ op: 'setConfig', config: { height: Math.max(16, +e.target.value) } });
  $('#cD').onchange = (e) => op({ op: 'setConfig', config: { duration: Math.max(0.1, +e.target.value) } });
  $('#cF').onchange = (e) => op({ op: 'setConfig', config: { fps: +e.target.value } });
  bindVarFields(box);
  $$('.ln', box).forEach((l) => { l.onclick = () => gotoLine(+l.dataset.line); });
}
async function duplicateSelected() {
  const it = items()[S.selected]; if (!it) return;
  await op({ op: 'duplicate', index: it.index, offset: it.duration ?? 0 });
  select(it.index + 1 + items().filter((x) => isDescendant(x, it.index)).length);
}
async function deleteSelected() {
  const it = items()[S.selected]; if (!it) return;
  S.selected = null;
  await op({ op: 'remove', index: it.index });
  toast(`“${it.label}” excluído`, { action: 'Desfazer', onAction: undo });
}

// ============================================================ código
let cm; let codeDirty = false; let codeTimer; let applyingCode = false;
function initCode() {
  cm = new EditorView({
    parent: $('#code'),
    state: EditorState.create({
      doc: '',
      extensions: [basicSetup, htmlLang(), oneDark, EditorView.lineWrapping,
        keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => { flushCode(); return true; } }]),
        EditorView.updateListener.of((u) => {
          if (!u.docChanged || applyingCode) return;
          codeDirty = true; $('#codeStatus').textContent = 'editando…';
          clearTimeout(codeTimer); codeTimer = setTimeout(flushCode, 900);
        })],
    }),
  });
}
async function flushCode() {
  clearTimeout(codeTimer);
  if (!codeDirty) return;
  codeDirty = false;
  $('#codeStatus').textContent = 'salvando…';
  try { await saveSource(cm.state.doc.toString()); } catch (e) { $('#codeStatus').textContent = `erro: ${e.message}`; }
}
function syncCode(force) {
  if (!cm || !S.comp) return;
  const src = S.comp.source;
  if (!force && (codeDirty || cm.state.doc.toString() === src)) return;
  applyingCode = true;
  const sel = Math.min(cm.state.selection.main.head, src.length);
  cm.dispatch({ changes: { from: 0, to: cm.state.doc.length, insert: src }, selection: { anchor: sel } });
  applyingCode = false; codeDirty = false; $('#codeStatus').textContent = 'salvo';
}
function gotoLine(n) {
  switchTab('right', 'code');
  const line = cm.state.doc.line(clamp(n, 1, cm.state.doc.lines));
  cm.dispatch({ selection: { anchor: line.from }, scrollIntoView: true }); cm.focus();
}

// ============================================================ IA
const SUGGESTIONS = ['Deixe as animações mais dinâmicas', 'Adicione legendas animadas', 'Crie uma versão vertical 9:16', 'Troque a paleta para laranja e preto', 'Adicione uma cena final com CTA'];
function renderAI() {
  const log = $('#aiLog');
  if (!S.aiMessages.length) {
    const ok = S.project?.ai?.configured;
    log.innerHTML = `<div class="ai-welcome"><div class="spark">${icon('spark')}</div><h3>Edite com IA</h3><p>Descreva a mudança e o assistente reescreve a composição. Tudo pode ser desfeito.</p>
      ${ok ? `<p class="tip">Modelo: <code>${esc(S.project.ai.model)}</code></p>` : `<p class="tip">Para usar, adicione sua chave da Anthropic.</p><button class="mini" id="aiCfg">${icon('gear')}Configurar chave</button>`}</div>`;
    $('#aiCfg')?.addEventListener('click', openSettings);
  } else {
    log.innerHTML = S.aiMessages.map((m, i) => aiMsgHTML(m, i)).join('');
    $$('[data-undo]', log).forEach((b) => { b.onclick = undo; });
    log.scrollTop = log.scrollHeight;
  }
  $('#aiSuggest').innerHTML = S.aiMessages.length ? '' : SUGGESTIONS.map((s) => `<button>${esc(s)}</button>`).join('');
  $$('#aiSuggest button').forEach((b) => { b.onclick = () => { $('#aiInput').value = b.textContent; $('#aiInput').focus(); }; });
}
function aiMsgHTML(m) {
  if (m.role === 'user') return `<div class="ai-msg user">${esc(m.display ?? m.content)}</div>`;
  if (m.role === 'error') return `<div class="ai-msg error">${esc(m.content)}</div>`;
  const hasBlock = /```html/.test(m.content);
  const text = m.content.replace(/```html[\s\S]*?(```|$)/g, '').trim();
  const writing = m.streaming && hasBlock && !/```html[\s\S]*```/.test(m.content);
  return `<div class="ai-msg assistant">${esc(text) || (m.streaming ? '<span class="dots">pensando</span>' : '')}
    ${writing ? `<div class="writing">${icon('spark')}<span class="dots">escrevendo a composição (${(m.content.split('```html')[1] || '').split('\n').length} linhas)</span></div>` : ''}
    ${m.unchanged ? '<div class="writing">Nenhuma mudança no arquivo.</div>' : ''}
    ${m.applied ? `<div class="applied">${icon('check')}Composição atualizada<button data-undo>Desfazer</button></div>` : ''}</div>`;
}
$('#aiForm').onsubmit = async (e) => {
  e.preventDefault();
  const text = $('#aiInput').value.trim();
  if (!text || S.aiBusy || !S.path) return;
  if (!S.project?.ai?.configured) { openSettings(); return; }
  await flushCode();
  $('#aiInput').value = '';
  S.aiMessages.push({ role: 'user', content: text });
  const msg = { role: 'assistant', content: '', streaming: true };
  S.aiMessages.push(msg);
  S.aiBusy = true; $('#aiSend').disabled = true;
  renderAI();
  const history = S.aiMessages.filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.streaming))
    .map((m) => ({ role: m.role, content: m.role === 'assistant' ? m.content.replace(/```html[\s\S]*?```/g, '[arquivo atualizado]') : m.content }));
  try {
    const r = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      path: S.path, messages: history, time: S.time, selection: S.selected, selectionLabel: S.selected != null ? items()[S.selected]?.label : null,
    }) });
    const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = ''; let lastRender = 0;
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let k;
      while ((k = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, k); buf = buf.slice(k + 2);
        if (!line.startsWith('data: ')) continue;
        const d = JSON.parse(line.slice(6));
        if (d.text) msg.content += d.text;
        if (d.error) { S.aiMessages.pop(); S.aiMessages.push({ role: 'error', content: d.error }); }
      }
      if (performance.now() - lastRender > 120) { lastRender = performance.now(); renderAI(); }
    }
    msg.streaming = false;
    const m = msg.content.match(/```html\s*\n([\s\S]*?)```/);
    if (m && m[1].includes('<')) {
      const next = m[1].trim() + '\n';
      if (next.trim() !== S.comp.source.trim()) { await saveSource(next); msg.applied = true; } else msg.unchanged = true;
    }
  } catch (err) {
    S.aiMessages.push({ role: 'error', content: err.message });
  }
  msg.streaming = false; S.aiBusy = false; $('#aiSend').disabled = false;
  renderAI();
};
$('#aiInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#aiForm').requestSubmit(); } });

// ============================================================ mídia (upload)
async function uploadFiles(files) {
  const out = [];
  for (const f of files) {
    toast(`Enviando ${f.name}…`, { ms: 1500 });
    const r = await fetch(`/api/upload?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
    const d = await r.json();
    if (!r.ok) { toast(d.error, { type: 'err' }); continue; }
    const ext = f.name.split('.').pop().toLowerCase();
    const type = /^(png|jpe?g|webp|gif|svg|avif)$/.test(ext) ? 'image' : /^(mp4|webm|mov|m4v)$/.test(ext) ? 'video' : /^(mp3|wav|ogg|m4a|aac)$/.test(ext) ? 'audio' : 'other';
    out.push({ path: d.path, type });
  }
  await loadProject();
  return out;
}
$('#fileInput').onchange = async (e) => { const up = await uploadFiles(e.target.files); e.target.value = ''; if (up.length) { switchTab('left', 'media'); toast('Mídia enviada. Clique para adicionar à timeline.', { type: 'ok' }); } };
const dz = $('#dropZone');
dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('over'));
dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); uploadFiles(e.dataTransfer.files); });

// ============================================================ exportar
function openExport() {
  if (!S.path) return;
  const c = cfg();
  const errs = (S.comp.lint || []).filter((l) => l.level === 'error');
  const sizes = [[`Original (${c.width}×${c.height})`, 0], ['Metade', 0.5], ...(c.width >= 3000 ? [] : [['2× (alta resolução)', 2]])];
  modal({
    title: 'Exportar vídeo',
    body: `${errs.length ? `<div class="ai-msg error" style="max-width:none">A composição tem ${errs.length} erro(s). Corrija antes de exportar: ${esc(errs[0].message)}</div>` : ''}
      <div class="fields">
        <div class="field full"><label>Resolução</label><select id="xRes">${sizes.map(([l, s]) => `<option value="${s}">${l}</option>`).join('')}</select></div>
        <div class="field"><label>FPS</label><select id="xFps">${[24, 25, 30, 50, 60].map((f) => `<option ${f === c.fps ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
        <div class="field"><label>Qualidade</label><select id="xQ"><option value="23">Leve (web)</option><option value="18" selected>Alta</option><option value="12">Máxima</option></select></div>
      </div>
      <p class="tip">MP4 (H.264 + AAC) · ${c.duration}s · ${Math.round(c.duration * c.fps)} frames. O arquivo é salvo em <code>exports/</code>.</p>`,
    actions: [{ label: 'Cancelar' }, {
      label: 'Exportar MP4', primary: true, onClick: async (el) => {
        const s = +$('#xRes', el).value;
        const body = { path: S.path, fps: +$('#xFps', el).value, crf: +$('#xQ', el).value };
        if (s) body.width = Math.round((c.width * s) / 2) * 2;
        await api('/api/render', { method: 'POST', body: JSON.stringify(body) });
        switchTab('left', 'project');
        toast('Exportação iniciada', { type: 'ok' });
      },
    }],
  });
}
$('#exportBtn').onclick = openExport;
function showVideo(p) {
  modal({
    title: p.split('/').pop(), wide: true,
    body: `<video src="/p/${encodeURI(p)}" controls autoplay style="width:100%;border-radius:8px;background:#000"></video>`,
    actions: [{ label: 'Fechar' }, { label: 'Baixar', primary: true, onClick: () => { const a = document.createElement('a'); a.href = `/p/${encodeURI(p)}`; a.download = p.split('/').pop(); a.click(); return false; } }],
  });
}

// ============================================================ configurações
async function openSettings() {
  const s = await api('/api/settings');
  modal({
    title: 'Configurações',
    body: `<div class="field"><label>Chave da API Anthropic ${s.hasKey ? '(configurada)' : ''}</label><input id="sKey" type="password" placeholder="${s.hasKey ? '•••••••• (deixe vazio para manter)' : 'sk-ant-…'}"></div>
      <div class="field"><label>Modelo</label><input id="sModel" value="${esc(s.model)}"></div>
      <p class="tip">A chave fica salva só no seu computador, em <code>~/.loopmotion/config.json</code>.</p>`,
    actions: [{ label: 'Cancelar' }, {
      label: 'Salvar', primary: true, onClick: async (el) => {
        const body = { model: $('#sModel', el).value.trim() };
        if ($('#sKey', el).value.trim()) body.anthropicApiKey = $('#sKey', el).value.trim();
        await api('/api/settings', { method: 'PUT', body: JSON.stringify(body) });
        await loadProject(); renderAI(); toast('Configurações salvas', { type: 'ok' });
      },
    }],
  });
}
$('#settingsBtn').onclick = openSettings;

// ============================================================ abas, cabeçalho, teclado
function switchTab(group, tab) {
  const root = group === 'left' ? $('#left') : $('#right');
  $$('.tabs button', root).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $$('.pane', root).forEach((p) => p.classList.toggle('on', p.dataset.pane === tab));
  if (tab === 'code' && cm) requestAnimationFrame(() => cm.requestMeasure());
}
$$('.tabs').forEach((nav) => $$('button', nav).forEach((b) => { b.onclick = () => switchTab(nav.dataset.group, b.dataset.tab); }));
$('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
$('#lintBtn').onclick = () => { select(null); switchTab('right', 'inspector'); $('#inspector').scrollTop = 1e6; };
$('#compSwitch').onclick = (e) => menu(e.currentTarget, [
  ...(S.project?.compositions || []).map((c) => ({ label: c.name, icon: 'film', meta: `${c.config.width}×${c.config.height}`, onClick: () => openComp(c.path) })),
  '-', { label: 'Nova a partir de template…', icon: 'spark', onClick: () => switchTab('left', 'templates') },
]);
$('#newCompBtn').onclick = () => switchTab('left', 'templates');

addEventListener('keydown', (e) => {
  const typing = e.target.closest('input, textarea, select, .cm-editor');
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z' && !e.target.closest('.cm-editor') && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (typing) return;
  if (e.code === 'Space') { e.preventDefault(); S.playing ? stop() : play(); }
  else if (e.key === 'ArrowRight') { stop(); seek(S.time + (e.shiftKey ? 1 : 1 / cfg().fps)); }
  else if (e.key === 'ArrowLeft') { stop(); seek(S.time - (e.shiftKey ? 1 : 1 / cfg().fps)); }
  else if (e.key === 'Home') { stop(); seek(0); }
  else if (e.key === 'End') { stop(); seek(cfg().duration); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && S.selected != null) { e.preventDefault(); deleteSelected(); }
  else if (mod && e.key.toLowerCase() === 'd' && S.selected != null) { e.preventDefault(); duplicateSelected(); }
  else if (e.key === 'Escape') select(null);
  else if (e.key.toLowerCase() === 't' && !mod) addText();
});

// redimensionar a timeline arrastando a borda
$('#timeline').addEventListener('mousedown', (e) => {
  const r = $('#timeline').getBoundingClientRect();
  if (e.clientY - r.top > 4) return;
  const move = (ev) => { document.body.style.setProperty('--tl-h', `${clamp(innerHeight - ev.clientY, 140, innerHeight - 260)}px`); fitStage(); };
  const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); if (S.zoomFit) fitZoom(); };
  addEventListener('mousemove', move); addEventListener('mouseup', up);
});

// ============================================================ eventos do servidor
function connectEvents() {
  const es = new EventSource('/api/events');
  es.onmessage = async (e) => {
    const d = JSON.parse(e.data);
    if (d.type === 'file' && d.path === S.path) {
      const st = await api(`/api/comp?path=${encodeURIComponent(S.path)}`);
      if (st.source !== S.comp?.source) {
        setComp(st, { resetCode: !codeDirty });
        if (d.external) { $('#liveDot').classList.remove('flash'); void $('#liveDot').offsetWidth; $('#liveDot').classList.add('flash'); toast('Arquivo atualizado por fora (agente/editor)', { action: 'Desfazer', onAction: undo }); }
      }
    } else if (d.type === 'tree') {
      await loadProject();
    } else if (d.type === 'render') {
      const p = S.project; if (!p) return;
      p.jobs = [...(p.jobs || []).filter((j) => j.id !== d.job.id), d.job];
      renderProjectLists();
      if (d.job.status === 'done') toast(`Exportado: ${d.job.output.split('/').pop()}`, { type: 'ok', action: 'Ver', onAction: () => showVideo(d.job.output), ms: 8000 });
      if (d.job.status === 'error') toast(`Erro na exportação: ${d.job.error.slice(0, 120)}`, { type: 'err', ms: 8000 });
    }
  };
  es.onerror = () => { $('#liveDot').style.color = 'var(--err)'; $('#liveDot').textContent = '● offline'; };
  es.onopen = () => { $('#liveDot').style.color = ''; $('#liveDot').textContent = '● ao vivo'; };
}

// ============================================================ início
initCode();
connectEvents();
loadBlocks().catch(() => {});
loadProject().catch((e) => toast(e.message, { type: 'err' }));
window.__studio = S; // para depuração
