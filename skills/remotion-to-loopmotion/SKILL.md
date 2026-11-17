---
name: remotion-to-loopmotion
description: Porta composições Remotion (React — useCurrentFrame, interpolate, spring, Sequence, AbsoluteFill, Audio, Video, Img) para LoopMotion (HTML + timelines). Use quando o usuário quiser migrar um projeto ou componente Remotion para LoopMotion.
---

# Remotion → LoopMotion

Leia antes a skill `loopmotion`. A ideia é a mesma (o vídeo é função do tempo). Muda a forma de escrever: em vez de componentes React que recebem o `frame`, você escreve HTML estático e anima com timelines, ou com `onFrame` quando a lógica é de fato por frame.

## Mapa de conceitos

| Remotion | LoopMotion |
|---|---|
| `<Composition width height fps durationInFrames>` | `<html data-width data-height data-fps data-duration="durationInFrames / fps">` |
| `<AbsoluteFill>` | `<section style="position:absolute;inset:0">` |
| `<Sequence from={30} durationInFrames={90}>` | `.clip` com `data-start="1" data-duration="3"` (frames ÷ fps) |
| `<Series>` | Clips em sequência (cada `data-start` = soma dos anteriores) |
| `useCurrentFrame()` dentro de uma Sequence | Tempo local da cena: `loopmotion.timeline('#cena')` ou `onFrame((tLocal) => …, '#cena')` |
| `interpolate(frame, [0, 20], [0, 1])` | Tween: `.fromTo(el, {opacity:0}, {opacity:1, duration: 20/fps, ease:'none'}, 0)` |
| `interpolate` com `extrapolateRight: 'clamp'` | Comportamento padrão de um tween |
| `Easing.out(Easing.cubic)` | `ease: 'power2.out'` (quad → `power1`, cubic → `power2`, quart → `power3`, quint → `power4`) |
| `spring({ frame, fps })` | `ease: 'back.out(1.4)'` (pulo leve) ou `'elastic.out(1, 0.5)'` (mola forte). Duração típica de 0,6–1 s |
| `<Img src={staticFile('x.png')}>` | `<img src="assets/x.png">` |
| `<Video src startFrom={60}>` | `<video class="clip" src="assets/v.mp4" data-offset="2" muted>` |
| `<Audio src volume={0.5} startFrom>` | `<audio src="assets/a.mp3" data-volume="0.5" data-offset="…">` |
| `<OffthreadVideo>` | `<video>` (a LoopMotion já faz seek determinístico) |
| `inputProps` / `defaultProps` | `data-var` + `--props` / `loopmotion.props` |
| `random('seed')` | `Math.random()` (a semente é fixa) |
| `delayRender()` / `continueRender()` | Desnecessário: o render espera fontes, imagens e vídeos. Para dados, embuta-os no HTML ou passe via props |
| `staticFile()` / `public/` | `assets/` relativo ao `index.html` |
| `npx remotion render` | `npx loopmotion render` |
| Remotion Studio | `npx loopmotion studio` |

## Processo

1. Leia o `Root.tsx` (composições, tamanho, fps, duração) e os componentes. Liste as `Sequence` com `from` e `durationInFrames`.
2. Converta cada `Sequence` de primeiro nível num `.clip` com `id` e `data-label`. Os tempos são frames ÷ fps, com até 3 casas decimais.
3. Converta o JSX em HTML e o estilo (inline/CSS-in-JS) em CSS. Valores numéricos sem unidade em React (`fontSize: 80`) viram `px`.
4. Para cada `interpolate`/`spring`, crie um tween na `loopmotion.timeline` da cena, com o frame inicial ÷ fps como posição.
5. Lógica que depende do frame de forma não trivial (desenho em canvas, texto que muda por frame, contadores) vai para `loopmotion.onFrame((t) => …, '#cena')`, com `frame = Math.round(t * fps)`.
6. Copie `public/*` para `assets/`. Troque `staticFile('x')` por `assets/x`.
7. `npx loopmotion lint` → compare stills dos mesmos instantes com o Remotion (`npx remotion still`) → `render`.

## Exemplo

```tsx
// Remotion
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
const y = interpolate(spring({ frame, fps }), [0, 1], [80, 0]);
return <Sequence from={30} durationInFrames={90}><AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
  <h1 style={{ opacity, transform: `translateY(${y}px)`, fontSize: 120 }}>Olá</h1></AbsoluteFill></Sequence>;
```

```html
<!-- LoopMotion (30 fps): from 30 → 1 s, 90 frames → 3 s -->
<section class="clip" id="ola" data-label="Olá" data-start="1" data-duration="3" style="position:absolute;inset:0;display:grid;place-items:center">
  <h1 style="font-size:120px;margin:0">Olá</h1>
</section>
<script>
  loopmotion.timeline('#ola')
    .fromTo('#ola h1', { opacity: 0 }, { opacity: 1, duration: 20 / 30, ease: 'none' }, 0)
    .fromTo('#ola h1', { y: 80 }, { y: 0, duration: 0.8, ease: 'back.out(1.4)' }, 0);
</script>
```
