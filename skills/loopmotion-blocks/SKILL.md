---
name: loopmotion-blocks
description: Catálogo de blocos prontos da LoopMotion (títulos, lower third, legenda, logo reveal, contador, gráfico de barras, CTA, citação, lista, siga nas redes, transições flash/wipe, fundo animado, barra de progresso) inseridos com `npx loopmotion add`. Use ANTES de construir à mão qualquer um desses elementos num vídeo LoopMotion.
---

# Blocos da LoopMotion

Blocos são trechos prontos e testados: uma cena ou elemento com layout, animação e variáveis. Eles usam unidades `vmin`/`vw`/`vh`, então funcionam em 16:9, 9:16, 1:1 e 4:5 sem ajuste.

## Como usar

```bash
npx loopmotion add --list                                 # catálogo atualizado
npx loopmotion add title-card --to meu-video --at 0       # insere em 0 s
npx loopmotion add lower-third --to meu-video --at 2.5 --duration 4
```

O comando:
- gera um `id` único (`title-card-1`, `title-card-2`…)
- coloca o GSAP no `<head>` se faltar
- insere o bloco no `index.html`

Depois, **personalize no próprio HTML**:

1. **Textos:** edite o conteúdo dos elementos com `data-var` (ou passe `--props` no render).
2. **Cores:** os blocos usam `var(--accent)` e `var(--accent2)`. Defina no `<style>` da composição: `:root { --accent: #ff5c35; --accent2: #ffd23f; }`.
3. **Tempo:** mude `data-start`/`data-duration` do bloco. As animações internas são locais, então acompanham.
4. **Dados:** o `counter` usa `data-value`, `data-prefix` e `data-suffix` no `.num`; o `bar-chart` usa `data-data="Jan:120,Fev:210"` no `.ch`.
5. **Estilo:** ajuste os `style` inline. Mantenha as unidades relativas.

Não remova o `<script>` de dentro do bloco: ele cria a animação daquela instância. Se duplicar um bloco à mão, troque **todos** os `#id` dentro dele.

## Catálogo

Veja `references/catalog.md`, com nome, uso, duração padrão e variáveis de cada bloco.

## Dicas de composição

- **Fundo:** `particles-bg` entra no começo do `<body>`, atrás de tudo. Adicione-o primeiro.
- **Transições** (`flash-transition`, `wipe-transition`): centralize no corte. Para um corte em 3 s com flash de 0,6 s, use `--at 2.7`.
- **Legendas:** para muitas, prefira `npx loopmotion captions arquivo.srt` (skill `loopmotion-media`).
- **Barra de progresso:** adicione por último. Ela já ocupa o vídeo inteiro.
- Se nenhum bloco servir, use as receitas em `loopmotion/references/recipes.md`.
