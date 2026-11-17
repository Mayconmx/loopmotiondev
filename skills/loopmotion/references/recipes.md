# Receitas prontas

Nos exemplos, cada cena tem a própria `loopmotion.timeline('#cena')` com **tempos locais** (0 = início do clip). Copie e troque os seletores.

## Logo reveal

```html
<section class="clip scene" id="logo" data-label="Logo" data-start="0" data-duration="3">
  <img src="assets/logo.svg" class="mark" style="width:220px">
  <div class="name" data-var="brand">Marca</div>
</section>
<script>
  loopmotion.timeline('#logo')
    .from('#logo .mark', { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.6)' }, 0.1)
    .from('#logo .name', { clipPath: 'inset(0 100% 0 0)', duration: 0.7, ease: 'power3.inOut' }, 0.6)
    .to('#logo', { scale: 1.06, opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.6);
</script>
```

## Lower third

```html
<div class="clip lt" id="lt" data-label="Lower third" data-start="1" data-duration="5" style="position:absolute;left:120px;bottom:140px;display:flex">
  <div class="stripe" style="width:12px;background:var(--accent)"></div>
  <div class="box" style="padding:24px 40px;background:#000c">
    <div data-var="name" style="font:800 60px system-ui;color:#fff">Nome</div>
    <div data-var="role" style="font:600 32px system-ui;color:var(--accent)">Cargo</div>
  </div>
</div>
<script>
  loopmotion.timeline('#lt')   // clip começa em 1 s e dura 5 s → tempos de 0 a 5
    .from('#lt .stripe', { scaleY: 0, transformOrigin: 'bottom', duration: 0.35, ease: 'power3.out' }, 0)
    .from('#lt .box', { clipPath: 'inset(0 100% 0 0)', duration: 0.6, ease: 'power3.inOut' }, 0.2)
    .to('#lt .box', { clipPath: 'inset(0 100% 0 0)', duration: 0.45, ease: 'power3.in' }, 4.4);
</script>
```

## Legendas sincronizadas

```html
<div class="clip caption" data-label="Leg 1" data-start="0.2" data-duration="2.1" data-enter="pop"><span>Primeira frase</span></div>
<div class="clip caption" data-label="Leg 2" data-start="2.3" data-duration="2.4" data-enter="pop"><span>Segunda <em>frase</em></span></div>
<style>
  .caption { position:absolute; left:70px; right:70px; bottom:380px; text-align:center; font:800 60px/1.15 system-ui; }
  .caption span { background:#000; color:#fff; padding:6px 18px; border-radius:14px; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
  .caption em { font-style:normal; color:var(--accent); }
</style>
```
Para gerar a partir de uma transcrição com tempos (SRT), crie um `.clip caption` por bloco.

## Contador numérico

```js
const el = document.querySelector('#num'); const alvo = 12500;
loopmotion.onFrame((t) => {              // t local à cena #numeros
  const p = gsap.parseEase('power3.out')(Math.min(1, Math.max(0, (t - 1.0) / 1.5)));
  el.textContent = Math.round(alvo * p).toLocaleString('pt-BR');
}, '#numeros');
```

## Barras animadas a partir de dados

```js
const data = [['Jan', 120], ['Fev', 210], ['Mar', 330]];
const max = Math.max(...data.map((d) => d[1]));
chart.innerHTML = data.map(([k, v]) => `<div class="col"><div class="bar" style="height:${v / max * 80}%"></div><span>${k}</span></div>`).join('');
loopmotion.timeline('#grafico').from('.bar', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.2, duration: 0.9, ease: 'power3.out' }, 0.8);
```

## Ken Burns (zoom lento em foto)

```html
<img class="clip kb" id="kb" src="assets/foto.jpg" data-start="0" data-duration="5" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<script> loopmotion.timeline('#kb').fromTo('#kb', { scale: 1.0, x: 0 }, { scale: 1.15, x: -40, duration: 5, ease: 'none' }, 0); </script>
```

## B-roll em vídeo com título por cima

```html
<section class="clip" data-label="B-roll" data-start="3" data-duration="4" style="position:absolute;inset:0">
  <video src="assets/broll.mp4" muted playsinline data-offset="8" style="width:100%;height:100%;object-fit:cover"></video>
  <div style="position:absolute;inset:0;background:linear-gradient(transparent 50%,#000c)"></div>
  <h2 class="clip" data-start="0.4" data-enter="slide-up" style="position:absolute;left:100px;bottom:90px;font:800 90px system-ui;color:#fff;margin:0">Título</h2>
</section>
```
O `<video>` dentro de um `.clip` começa junto com o clip pai.

## Fundo vivo (degradê + partículas)

```js
const ctx = bg.getContext('2d');
const dots = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 20 + Math.random() * 60 }));
loopmotion.onFrame((t) => {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2 + Math.sin(t * 0.5) * 300, H / 2, 0, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, '#7c5cff44'); g.addColorStop(1, '#0000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff6';
  for (const d of dots) { ctx.beginPath(); ctx.arc(d.x, (d.y - t * d.s + H) % H, 2, 0, 7); ctx.fill(); }
});
```

## Barra de progresso

```js
gsap.fromTo('#prog', { width: '0%' }, { width: '100%', duration: loopmotion.config.duration, ease: 'none' });  // global: tempo absoluto
```

## Transição "empurrar" entre cenas

```js
// cena A (0–3 s) sai para a esquerda; cena B (data-start="2.5") entra da direita
loopmotion.timeline('#a').to('#a', { x: -1920, duration: 0.5, ease: 'power3.inOut' }, 2.5);
loopmotion.timeline('#b').from('#b', { x: 1920, duration: 0.5, ease: 'power3.inOut' }, 0);
```
B começa em 2,5 s (sobrepõe 0,5 s com A) e A termina em 3 s.
