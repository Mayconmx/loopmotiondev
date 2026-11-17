---
name: loopmotion
description: Cria e edita vídeos com LoopMotion (vídeo como código, HTML → MP4). LEIA PRIMEIRO sempre que o usuário pedir para criar, editar, animar ou renderizar um vídeo, motion graphics, reels/TikTok/shorts, vinheta, intro de logo, lower third, legendas animadas, gráfico animado, vídeo de produto ou qualquer composição LoopMotion (também "make a video", "animate this", "render to mp4"). Contém o contrato de render, o ciclo de trabalho e as referências.
---

# LoopMotion: vídeo como código

Uma composição LoopMotion é **uma página HTML** que vira MP4. Em cada frame, o renderizador (Chrome headless + FFmpeg) chama `loopmotion.seek(t)`, posiciona tudo no instante `t` e captura a tela. Por isso o mesmo HTML sempre gera o mesmo vídeo.

Comandos: use `npx loopmotion <comando>`. Se o pacote estiver instalado globalmente, `loopmotion <comando>` também funciona. Requisitos: Node 20+, FFmpeg e Chrome.

## Skills relacionadas

| Skill | Use quando |
|---|---|
| `loopmotion-cli` | Precisar de um comando: criar projeto, verificar, ver frames, renderizar, resolver falhas |
| `loopmotion-blocks` | **Antes de construir à mão** algo comum (título, lower third, legenda, contador, gráfico, CTA, transição, fundo) |
| `loopmotion-media` | Precisar de música, narração, imagens, vídeo, fontes ou legendas a partir de áudio/SRT |
| `website-to-loopmotion` | O pedido partir de um site ("faça um vídeo do meu site/produto em URL") |
| `remotion-to-loopmotion` | Precisar portar um projeto Remotion (React) para LoopMotion |

## Ciclo de trabalho (siga nesta ordem)

1. **Entenda o pedido.** Defina formato (16:9, 9:16, 1:1, 4:5), duração, público, tom e chamada final. Se faltar algo essencial e o usuário estiver presente, pergunte uma vez; senão, escolha padrões sensatos e diga quais escolheu.
2. **Planeje as cenas** numa lista curta: início, duração e mensagem de cada uma. Uma ideia por cena, de 2 a 4 s. Gancho no primeiro 1,5 s em vídeos sociais (veja `references/design.md`).
3. **Crie o projeto:** `npx loopmotion init <pasta> --template <blank|promo|reel|lower-third|kinetic|chart>`. Para editar um projeto existente, leia o `index.html` inteiro antes.
4. **Monte com blocos** (`npx loopmotion add <bloco> --to <pasta> --at <s>`) e **complete à mão** o que for específico, seguindo o contrato em `references/composition.md`.
5. **Anime** cada cena com `loopmotion.timeline('#cena')`, com tempos locais à cena (veja `references/animation.md`). Use também os presets `data-enter`/`data-exit`, CSS ou `loopmotion.onFrame`.
6. **Verifique:** `npx loopmotion lint <pasta>` até não restar nenhum erro.
7. **Olhe os frames:** gere `npx loopmotion still <pasta> --time <t> -o /tmp/f-<t>.png` no meio de cada cena e logo após cada transição, e **abra as imagens**. Corrija cortes, sobreposições, texto ilegível ou fora da área segura.
8. **Renderize:** `npx loopmotion render <pasta> -o <nome>.mp4`. Informe o caminho do arquivo, a duração e o formato. Se o usuário quiser ajustar visualmente, sugira `npx loopmotion studio <pasta>`: ele vê suas edições ao vivo e pode arrastar cenas na timeline.

## Regras inegociáveis

- **Determinismo.** Toda animação é função do tempo. Nunca use `setTimeout`/`setInterval`/`Date` para animar, nunca acumule estado entre frames (`x += 1`), nunca chame `.play()` em mídia, nunca use `fetch` durante o render.
- **Sem dependências externas.** Nada de CDN, Google Fonts ou imagens por `http`. O GSAP vem embutido: `<script src="/__lm/gsap.js"></script>` no `<head>`. Toda mídia fica na pasta do projeto (`assets/`), com caminho relativo.
- **Uma timeline por cena, tempo local:** `loopmotion.timeline('#cena')`, onde 0 = início do clip. Assim as animações acompanham a cena quando ela é movida no Studio. Use o GSAP global (tempo absoluto) só para coisas que atravessam o vídeo todo, como uma barra de progresso.
- **Toda cena é um `.clip`** com `id`, `data-label`, `data-start` e `data-duration`, e termina até o `data-duration` do `<html>`.
- **Textos editáveis com `data-var`.** Isso vira campo no Studio e template com `--props`.
- **Layout no tamanho exato do formato**, com cenas em `position:absolute; inset:0` e respeitando as áreas seguras. Unidades `vmin`/`vw`/`vh` deixam o layout adaptável a outros formatos.
- **Edite sem destruir.** Ao modificar um arquivo existente, preserve ids, `data-var`, scripts e mídia que não foram citados no pedido.

## Referências

| Arquivo | Quando ler |
|---|---|
| `references/composition.md` | Sempre: contrato completo (atributos, clips, mídia, variáveis, presets, API do runtime) |
| `references/animation.md` | Ao animar: timelines por cena, eases, durações, texto por palavra/letra, transições, erros comuns |
| `references/design.md` | Ao planejar: formatos, áreas seguras, tipografia, ritmo, cor, legendas |
| `references/recipes.md` | Padrões para adaptar quando não houver um bloco pronto |

## Esqueleto mínimo

```html
<!doctype html>
<html data-width="1920" data-height="1080" data-fps="30" data-duration="6">
<head>
<meta charset="utf-8">
<script src="/__lm/gsap.js"></script>
<style>
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #0b0b10; color: #fff; font-family: system-ui, sans-serif; }
  .scene { position: absolute; inset: 0; display: grid; place-items: center; }
  h1 { font-size: 11vmin; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
</style>
</head>
<body>
  <section class="clip scene" id="abertura" data-label="Abertura" data-start="0" data-duration="3">
    <h1 data-var="title">Olá, mundo</h1>
  </section>
  <section class="clip scene" id="final" data-label="Final" data-start="3" data-duration="3" data-enter="fade">
    <h1 data-var="cta">Até logo</h1>
  </section>
<script>
  loopmotion.timeline('#abertura')            // tempos locais: 0 = início da cena
    .from('#abertura h1', { y: 80, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.1)
    .to('#abertura h1', { opacity: 0, y: -40, duration: 0.4, ease: 'power2.in' }, 2.5);
</script>
</body>
</html>
```
