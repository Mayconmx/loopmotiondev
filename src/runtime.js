/*
 * LoopMotion runtime — injetado em toda composição ANTES de qualquer script dela.
 * Responsável pelo determinismo: o tempo só anda quando o renderizador (ou o
 * player de preview) chama loopmotion.seek(t).
 */
(() => {
  if (window.loopmotion) return;

  const realRAF = window.requestAnimationFrame.bind(window);
  const RealDate = Date;
  const EPOCH = 1700000000000; // data fixa: Date.now() é igual em todo render

  let nowMs = 0;

  // ---- Relógio virtual -------------------------------------------------
  performance.now = () => nowMs;
  Date.now = () => EPOCH + nowMs;
  window.Date = class extends RealDate {
    constructor(...a) { a.length ? super(...a) : super(EPOCH + nowMs); }
    static now() { return EPOCH + nowMs; }
  };

  let rafId = 0;
  let rafQueue = new Map();
  window.requestAnimationFrame = (cb) => { rafQueue.set(++rafId, cb); return rafId; };
  window.cancelAnimationFrame = (id) => rafQueue.delete(id);

  // Math.random determinístico (mulberry32) — mesma semente, mesmo vídeo
  let seed = 0x1007_0000;
  Math.random = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const frameCallbacks = [];
  const sceneTimelines = []; // { el, tl } — timelines GSAP com tempo local à cena
  const root = () => document.documentElement;
  const num = (v, d) => (v == null || v === '' ? d : Number(v));

  // Tempo de início de um elemento = soma dos data-start dos .clip ancestrais
  function clipStart(el) {
    let s = 0;
    for (let n = el && el.closest && el.closest('.clip'); n; n = n.parentElement && n.parentElement.closest('.clip')) {
      s += num(n.dataset.start, 0);
    }
    return s;
  }

  // Variáveis são aplicadas ANTES de cada <script> da composição rodar
  // (o navegador entrega os MutationObservers antes de executar um script do parser).
  const applied = new WeakSet();
  function applyProps() {
    const props = window.loopmotion.props;
    document.querySelectorAll('[data-var]').forEach((el) => {
      if (applied.has(el)) return; applied.add(el);
      const v = props[el.dataset.var];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-var-src]').forEach((el) => {
      if (applied.has(el)) return; applied.add(el);
      const v = props[el.dataset.varSrc];
      if (v != null) el.setAttribute('src', v);
    });
    if (!applied.has(root())) {
      applied.add(root());
      for (const [k, v] of Object.entries(props)) {
        if (typeof v === 'string' || typeof v === 'number') root().style.setProperty(`--${k}`, String(v));
      }
    }
  }
  const mo = new MutationObserver((records) => {
    if (records.some((r) => [...r.addedNodes].some((n) => n.tagName === 'SCRIPT'))) applyProps();
  });
  mo.observe(document, { childList: true, subtree: true });

  function waitEvent(el, ev, ms = 3000) {
    return new Promise((res) => {
      const done = () => { el.removeEventListener(ev, done); res(); };
      el.addEventListener(ev, done);
      setTimeout(done, ms);
    });
  }

  let gsapReady = false;

  // ---- Presets de entrada/saída: data-enter="fade" data-exit="slide-down" -----
  const ENTER = {
    fade: [{ opacity: 0 }, { opacity: 1 }],
    'slide-up': [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'none' }],
    'slide-down': [{ opacity: 0, transform: 'translateY(-60px)' }, { opacity: 1, transform: 'none' }],
    'slide-left': [{ opacity: 0, transform: 'translateX(90px)' }, { opacity: 1, transform: 'none' }],
    'slide-right': [{ opacity: 0, transform: 'translateX(-90px)' }, { opacity: 1, transform: 'none' }],
    zoom: [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }],
    pop: [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.7 }, { opacity: 1, transform: 'none' }],
    blur: [{ opacity: 0, filter: 'blur(24px)' }, { opacity: 1, filter: 'none' }],
    wipe: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  };
  const reverse = (k) => k.slice().reverse().map((f) => ({ ...f, offset: f.offset != null ? 1 - f.offset : undefined }));
  const EXIT = Object.fromEntries(Object.entries(ENTER).map(([k, v]) => [k, reverse(v)]));
  EXIT['slide-up'] = reverse(ENTER['slide-down']); EXIT['slide-down'] = reverse(ENTER['slide-up']);
  EXIT['slide-left'] = reverse(ENTER['slide-right']); EXIT['slide-right'] = reverse(ENTER['slide-left']);
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const presetCache = new WeakMap();
  function syncPresets() {
    document.querySelectorAll('[data-enter],[data-exit]').forEach((el) => {
      const d = el.dataset;
      const key = [d.enter, d.exit, d.enterDur, d.exitDur, d.duration].join('|');
      const prev = presetCache.get(el);
      if (prev && prev.key === key) return;
      prev?.anims.forEach((a) => a.cancel());
      const anims = [];
      if (d.enter && ENTER[d.enter]) {
        anims.push(el.animate(ENTER[d.enter], { duration: num(d.enterDur, 0.6) * 1000, easing: EASE, fill: 'backwards' }));
      }
      const dur = num(d.duration, null);
      if (d.exit && EXIT[d.exit] && dur != null) {
        const ed = num(d.exitDur, 0.5);
        anims.push(el.animate(EXIT[d.exit], { duration: ed * 1000, delay: Math.max(0, dur - ed) * 1000, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' }));
      }
      anims.forEach((a) => a.pause());
      presetCache.set(el, { key, anims });
    });
  }

  window.loopmotion = {
    props: window.__LM_PROPS__ || (() => {
      try { return JSON.parse(new URLSearchParams(location.search).get('lmprops') || '{}'); } catch { return {}; }
    })(),
    get config() {
      const r = root();
      return {
        width: num(r.dataset.width, 1920),
        height: num(r.dataset.height, 1080),
        fps: num(r.dataset.fps, 30),
        duration: num(r.dataset.duration, 5),
      };
    },
    /**
     * Callback chamado a cada frame. Sem escopo recebe o tempo absoluto (s);
     * com escopo (seletor/elemento de um .clip) recebe o tempo LOCAL à cena.
     */
    onFrame(cb, scope) {
      const el = typeof scope === 'string' ? document.querySelector(scope) : scope;
      frameCallbacks.push(el ? (t) => cb(t - clipStart(el), t) : cb);
    },

    /**
     * Timeline GSAP presa a uma cena: os tempos são LOCAIS (0 = início do clip).
     * Se a cena for movida na timeline do Studio, as animações vão junto.
     */
    timeline(scope, vars = {}) {
      if (!window.gsap) throw new Error('loopmotion.timeline precisa do GSAP: <script src="/__lm/gsap.js"></script>');
      const el = typeof scope === 'string' ? document.querySelector(scope) : scope;
      if (!el) throw new Error(`loopmotion.timeline: cena não encontrada (${scope})`);
      const tl = gsap.timeline({ ...vars, paused: true });
      gsap.globalTimeline.remove(tl);
      sceneTimelines.push({ el, tl });
      return tl;
    },

    /** Espera fontes, imagens e vídeos carregarem. */
    async ready() {
      if (document.readyState === 'loading') await waitEvent(document, 'DOMContentLoaded', 10000);
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => (img.complete ? 0 : waitEvent(img, 'load', 10000))));
      await Promise.all([...document.querySelectorAll('video')].map((v) => {
        v.muted = true; v.pause();
        return v.readyState >= 2 ? 0 : waitEvent(v, 'loadeddata', 10000);
      }));
    },

    /** Posiciona TUDO no instante t (segundos). É o coração do determinismo. */
    async seek(t) {
      nowMs = t * 1000;

      // 1) Clips: visíveis só dentro da janela [start, start + duration)
      document.querySelectorAll('.clip').forEach((el) => {
        const s = clipStart(el);
        const d = num(el.dataset.duration, Infinity);
        el.style.visibility = t >= s && t < s + d ? '' : 'hidden';
      });

      // 2) Animações CSS / Web Animations / presets — tempo local ao clip
      syncPresets();
      document.getAnimations().forEach((a) => {
        a.pause();
        const target = a.effect && a.effect.target;
        a.currentTime = Math.max(0, (t - clipStart(target)) * 1000);
      });

      // 3) GSAP (timeline global pausada e posicionada)
      if (window.gsap) {
        if (!gsapReady) { gsap.ticker.lagSmoothing(0); gsap.globalTimeline.pause(); gsapReady = true; }
        gsap.globalTimeline.seek(t, false);
        for (const { el, tl } of sceneTimelines) tl.seek(Math.max(0, t - clipStart(el)), false);
      }

      // 4) Lottie (lottie-web): animações com data-lottie são posicionadas por frame
      if (window.lottie && lottie.getRegisteredAnimations) {
        lottie.getRegisteredAnimations().forEach((anim) => {
          const local = t - clipStart(anim.wrapper);
          anim.goToAndStop(Math.max(0, local * 1000), false);
        });
      }

      // 5) Vídeos embutidos
      await Promise.all([...document.querySelectorAll('video')].map((v) => {
        const local = Math.max(0, t - clipStart(v)) + num(v.dataset.offset, 0);
        if (Math.abs(v.currentTime - local) < 0.001) return 0;
        v.currentTime = local;
        return waitEvent(v, 'seeked', 3000);
      }));

      // 6) requestAnimationFrame e callbacks do usuário
      const q = rafQueue; rafQueue = new Map();
      q.forEach((cb) => { try { cb(nowMs); } catch (e) { console.error(e); } });
      frameCallbacks.forEach((cb) => cb(t));

      // 7) Espera um paint real
      await new Promise((r) => realRAF(() => r()));
    },

    /** Lista os áudios da composição para o mixer do FFmpeg. */
    audioTracks() {
      return [...document.querySelectorAll('audio[src]')].map((a) => ({
        src: a.src,
        start: clipStart(a) + num(a.dataset.start, 0) * (a.classList.contains('clip') ? 0 : 1),
        offset: num(a.dataset.offset, 0),
        volume: num(a.dataset.volume, 1),
        duration: a.dataset.duration != null ? Number(a.dataset.duration) : null,
      }));
    },
  };

  document.addEventListener('DOMContentLoaded', () => { applyProps(); mo.disconnect(); });

  // ---- Integração com o estúdio (só quando aberto dentro do editor) ----
  if (new URLSearchParams(location.search).has('lmstudio')) {
    const style = document.createElement('style');
    style.textContent = '[data-lm-selected]{outline:4px solid #7c5cff !important;outline-offset:-4px}';
    document.documentElement.appendChild(style);
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('[data-lm-index]');
      e.preventDefault();
      parent.postMessage({ type: 'lm:select', index: el ? Number(el.dataset.lmIndex) : null }, '*');
    }, true);
    window.addEventListener('message', (e) => {
      if (e.data?.type !== 'lm:highlight') return;
      document.querySelectorAll('[data-lm-selected]').forEach((n) => n.removeAttribute('data-lm-selected'));
      if (e.data.index != null) document.querySelector(`[data-lm-index="${e.data.index}"]`)?.setAttribute('data-lm-selected', '');
    });
  }
})();
