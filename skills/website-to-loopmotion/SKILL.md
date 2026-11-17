---
name: website-to-loopmotion
description: Transforma um site (URL) em vídeo LoopMotion — captura screenshots, cores, fontes, títulos e CTAs da página e monta um vídeo de produto/promo com a identidade do site. Use quando o usuário pedir "faça um vídeo do meu site", "vídeo de lançamento a partir desta URL", "promo da landing page".
---

# Site → vídeo

Leia antes a skill `loopmotion` (contrato e ciclo de trabalho).

## 1. Capture

```bash
npx loopmotion init video-site --template blank
npx loopmotion capture https://site.com -o video-site/assets/site
```

Isso gera em `assets/site/`:
- `hero.png`: a primeira dobra
- `fullpage.png`: a página inteira
- `section-N.png`: as seções principais
- `site.json`: título, descrição, headings, textos de botões, cores mais usadas, fontes e ícone

Leia o `site.json` e **abra as imagens** antes de planejar.

## 2. Extraia a identidade

- **Cores:** em `site.json → colors`, escolha a cor de fundo dominante, um texto e 1–2 cores de destaque (as mais saturadas). Coloque-as em `:root { --bg; --ink; --accent; --accent2 }`.
- **Fonte:** se `fonts[0]` for uma fonte comum do sistema, use-a. Senão, use `system-ui` e avise que, para usar a fonte exata, é preciso o arquivo `.woff2` em `assets/`.
- **Mensagem:** a promessa principal costuma ser o `h1` (`headings[0]`). Os benefícios estão nos `h2`. A CTA está em `ctas`.

## 3. Roteiro padrão (15–20 s, ajuste ao pedido)

| Cena | Tempo | Conteúdo |
|---|---|---|
| Gancho | 0–2,5 s | A promessa principal (h1), grande, com a cor de destaque |
| Produto | 2,5–7 s | `hero.png` em moldura de navegador, com zoom lento e o título por cima |
| Benefícios | 7–13 s | 2–3 benefícios (h2) com as imagens `section-N.png` rolando ou em cards |
| Prova | 13–15 s | Número, logo de cliente ou citação, se o site tiver |
| CTA | 15–18 s | Texto do botão principal + domínio |

## 4. Padrões úteis

**Moldura de navegador com rolagem da página:**

```html
<section class="clip" id="produto" data-label="Produto" data-start="2.5" data-duration="4.5" style="position:absolute;inset:0;display:grid;place-items:center">
  <div class="win" style="width:76vw;height:76vh;border-radius:1.4vmin;overflow:hidden;background:#fff;box-shadow:0 4vmin 10vmin #0007">
    <div style="height:4.2vmin;background:#e9e9ef;display:flex;align-items:center;gap:1vmin;padding:0 1.6vmin">
      <i style="width:1.4vmin;height:1.4vmin;border-radius:50%;background:#ff5f57"></i><i style="width:1.4vmin;height:1.4vmin;border-radius:50%;background:#febc2e"></i><i style="width:1.4vmin;height:1.4vmin;border-radius:50%;background:#28c840"></i>
    </div>
    <img class="pg" src="assets/site/fullpage.png" style="width:100%;display:block">
  </div>
</section>
<script>
  loopmotion.timeline('#produto')
    .from('#produto .win', { y: '20vh', opacity: 0, scale: 0.9, duration: 0.8, ease: 'power3.out' }, 0)
    .to('#produto .pg', { yPercent: -45, duration: 3.4, ease: 'power1.inOut' }, 0.8);  // rola a página
</script>
```
Ajuste o `yPercent` à altura do `fullpage.png`: quanto maior a página, menor a porcentagem para rolar a mesma distância.

**Seções em cards:** use `section-N.png` como `<img>` com `object-fit: cover` e `object-position: top`, dentro de cards com borda arredondada entrando em stagger.

## 5. Finalize

`npx loopmotion lint` → stills de cada cena → `render`. Avise o usuário que as imagens vieram do site dele e que ele pode trocar textos e cores pelo Studio (`npx loopmotion studio video-site`).
