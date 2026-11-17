# Contrato de composição LoopMotion

## O documento

```html
<html data-width="1920" data-height="1080" data-fps="30" data-duration="9">
```

| Atributo | Padrão | Significado |
|---|---|---|
| `data-width` / `data-height` | 1920 / 1080 | Tamanho do vídeo em pixels. O viewport do navegador tem exatamente esse tamanho. |
| `data-fps` | 30 | Frames por segundo (24, 25, 30, 50, 60). |
| `data-duration` | 5 | Duração total em segundos. |

`<body>` deve ter `margin:0; overflow:hidden` e ocupar 100% (`width:100%;height:100%`). O fundo do `html`/`body` é o fundo do vídeo.

## Clips (a timeline)

Qualquer elemento com a classe **`clip`** vira um item da timeline:

```html
<section class="clip" data-label="Cena 2" data-start="3" data-duration="4"> ... </section>
```

- `data-start`: quando aparece, em segundos. Padrão: 0.
- `data-duration`: por quanto tempo fica visível. Sem esse atributo, fica até o fim do vídeo.
- `data-label`: nome mostrado na timeline do Studio. **Sempre coloque.**
- Fora da janela `[start, start+duration)` o clip fica com `visibility:hidden`. Ele continua no layout, então use `position:absolute` nas cenas.
- **Clips aninhados somam os tempos:** um `.clip data-start="0.5"` dentro de um clip que começa em 3 s aparece em 3,5 s. Use isso para elementos que entram em sequência dentro de uma cena.
- A ordem no HTML define a sobreposição (o que vem depois fica por cima), salvo `z-index`.

## Mídia

```html
<img   class="clip" src="assets/foto.jpg"  data-start="2" data-duration="3" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<video class="clip" src="assets/broll.mp4" data-start="0" data-duration="5" data-offset="12" muted playsinline style="..."></video>
<audio src="assets/trilha.mp3" data-start="0" data-volume="0.8" data-offset="0" data-duration="20"></audio>
```

- **Vídeo:** a LoopMotion posiciona `currentTime` em cada frame. `data-offset` = em que segundo do arquivo começar. Sempre `muted` (o som do vídeo não entra; para isso use um `<audio>` com o mesmo arquivo).
- **Áudio:** é mixado pelo FFmpeg no render. `data-start` = quando entra no vídeo, `data-offset` = ponto de início dentro do arquivo, `data-volume` (1 = original), `data-duration` = corte. Dentro de um `.clip`, o início soma o do clip pai.
- Caminhos são **relativos ao arquivo HTML**. Não use URLs http.
- Fontes: `@font-face { src: url(assets/MinhaFonte.woff2) }`. O render espera `document.fonts.ready`.

## Variáveis (templates)

```html
<h1 data-var="title">Texto padrão</h1>
<img data-var-src="logo" src="assets/logo.png">
```

- `--props '{"title":"Novo texto","logo":"assets/cliente.png"}'` troca os valores no render.
- Toda prop string/número também vira variável CSS no `<html>`: `{"accent":"#ff5c35"}` → `var(--accent)`.
- Em scripts: `loopmotion.props.title`.
- As variáveis são aplicadas **antes** dos scripts da composição rodarem, então é seguro ler `el.textContent` para quebrar em letras ou palavras.
- O Studio mostra cada `data-var` como um campo editável.

## Presets de animação (sem código)

```html
<div class="clip" data-start="1" data-duration="3" data-enter="slide-up" data-exit="fade" data-enter-dur="0.6" data-exit-dur="0.5">
```

`data-enter` / `data-exit`: `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `zoom`, `pop`, `blur`, `wipe`. A entrada acontece no início do clip e a saída termina exatamente no fim. A saída exige `data-duration`. Não combine preset e GSAP animando a **mesma propriedade no mesmo elemento**; anime um filho com GSAP.

## API do runtime (`window.loopmotion`)

| API | Uso |
|---|---|
| `loopmotion.timeline('#cena')` | Timeline GSAP com tempo **local** à cena. É a forma recomendada de animar: acompanha a cena se ela for movida. |
| `loopmotion.onFrame((t) => {...})` | Chamado em cada frame com `t` absoluto (s). Para canvas, WebGL, Three.js, contadores. |
| `loopmotion.onFrame((tLocal, t) => {...}, '#cena')` | O mesmo, com tempo local à cena. |
| `loopmotion.props` | Objeto das variáveis. |
| `loopmotion.config` | `{ width, height, fps, duration }` |
| `loopmotion.seek(t)` | Usado pelo renderizador e pelo Studio. Não chame na composição. |

Determinismo garantido pelo runtime: `Date.now()`, `new Date()`, `performance.now()` e `requestAnimationFrame` seguem o relógio do vídeo, e `Math.random()` tem semente fixa (mesmos números em todo render).

## O que o runtime posiciona em cada frame

1. Visibilidade dos `.clip`
2. Animações CSS / Web Animations / presets, no tempo local do clip
3. Timelines de cena (`loopmotion.timeline`) no tempo local, e a timeline global do GSAP no tempo absoluto
4. Animações Lottie (`lottie-web`) registradas, no tempo local do clip
5. `<video>`, com `currentTime` = tempo local + `data-offset`
6. Callbacks de `requestAnimationFrame` e `onFrame(t)`
