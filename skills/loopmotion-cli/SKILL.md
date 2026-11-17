---
name: loopmotion-cli
description: Comandos da CLI da LoopMotion organizados por tarefa (criar projeto, abrir o Studio, inserir blocos, legendas, capturar site, verificar, gerar frames, renderizar, render em lote) e como resolver falhas de render. Use quando precisar rodar qualquer comando `npx loopmotion` ou quando um render/lint falhar.
---

# CLI da LoopMotion

Use `npx loopmotion <comando>`. Se a pasta for informada, o comando usa o `index.html` dentro dela.

## Por tarefa

| Tarefa | Comando |
|---|---|
| Criar projeto | `npx loopmotion init <pasta> --template <blank\|promo\|reel\|lower-third\|kinetic\|chart>` |
| Abrir o editor visual | `npx loopmotion studio <pasta-do-projeto>` → http://127.0.0.1:3800/studio/ |
| Ver blocos prontos | `npx loopmotion add --list` |
| Inserir bloco | `npx loopmotion add <bloco> --to <pasta> --at <segundos> [--duration s]` |
| Legendas de SRT/VTT | `npx loopmotion captions legendas.srt --to <pasta> [--offset s]` |
| Capturar um site | `npx loopmotion capture https://site.com -o <pasta>/assets/site` |
| Verificar | `npx loopmotion lint <pasta>` (rápido: `--static`, para máquina: `--json`) |
| Ver um frame | `npx loopmotion still <pasta> --time 2.5 -o /tmp/f.png` |
| Renderizar | `npx loopmotion render <pasta> -o video.mp4` |
| Render de teste rápido | `npx loopmotion render <pasta> -o /tmp/teste.mp4 --width 960 --fps 15 --crf 28` |
| Mudar textos no render | `npx loopmotion render <pasta> --props '{"title":"Oi"}'` ou `--props dados.json` |
| Atualizar skills | `npx loopmotion skills update` (`--global` para todos os projetos) |

Opções de `render`: `--fps`, `--width`/`--height` (tamanho do arquivo final; o layout é escalado, não cortado), `--workers` (navegadores em paralelo; padrão = CPUs − 1), `--crf` (qualidade H.264: 18 = alta, 23 = web, 0 = sem perdas), `--duration`.

## Verificação antes de entregar

1. `npx loopmotion lint <pasta>`: **zero erros**. Leia também os avisos.
2. `still` no meio de cada cena e logo após cada transição. Abra as imagens e confira:
   - nada cortado nas bordas ou fora das áreas seguras
   - texto legível
   - cenas sem sobreposição acidental
   - textos padrão substituídos
3. `render`, depois informe ao usuário o caminho, a duração e a resolução.

## Render em lote (um template → N vídeos)

```bash
for f in dados/*.json; do
  npx loopmotion render template -o "saida/$(basename "$f" .json).mp4" --props "$f"
done
```

## Problemas comuns

| Sintoma / mensagem | Causa provável | Solução |
|---|---|---|
| `Chrome não encontrado` | Chrome fora do lugar padrão | `export LOOPMOTION_CHROME=/caminho/do/chrome` (ou Chromium) |
| `spawn ffmpeg ENOENT` | FFmpeg não instalado | macOS `brew install ffmpeg` · Ubuntu `sudo apt install ffmpeg` · Windows `winget install ffmpeg` |
| lint: `GSAP usado mas não carregado` | Falta o script no `<head>` | `<script src="/__lm/gsap.js"></script>` |
| lint: `Arquivo não encontrado` / `404` | Caminho de mídia errado | Caminhos são relativos ao `index.html`; confira `assets/…` |
| lint: `Recurso externo` | CDN, Google Fonts, URL http | Baixe para `assets/` e use caminho relativo |
| lint: `Erro de script` | Exceção no JS da composição | Corrija a linha indicada; rode o `lint` de novo |
| Frame em branco / elemento sumido | Clip fora da janela de tempo, ou `from` sem posição | Confira `data-start`/`data-duration` e a posição dos tweens |
| Animação fora de hora | Timeline global com tempos locais (ou o contrário) | Use `loopmotion.timeline('#cena')` com tempos locais |
| Render lento | Muitos frames ou efeitos pesados (blur grande, sombras) | Faça um teste com `--width 960 --fps 15`; reduza `filter: blur` grandes |
| Vídeo embutido não aparece | Codec não suportado pelo Chrome | Converta: `ffmpeg -i in.mov -c:v libx264 -pix_fmt yuv420p -an assets/out.mp4` |
| Fonte diferente no render | Fonte não instalada / não carregada | `@font-face` com arquivo em `assets/` |
| Sem som | `<audio>` sem `src` válido, ou volume 0 | Confira o caminho e o `data-volume`; o áudio entra só no MP4 final |
