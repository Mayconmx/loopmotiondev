# LoopMotion

**Editor de vídeo como código.** Você monta vídeos numa timeline visual, edita com IA ou deixa um agente (Claude Code, Cursor…) escrever. Por baixo, cada vídeo é uma página HTML que vira MP4 de forma determinística.

```
LoopMotion
├── Studio   editor visual: preview, timeline, propriedades, código, mídia, templates, IA, exportar
├── Engine   runtime + renderizador (Chrome headless + FFmpeg, em paralelo)
├── Blocos   14 trechos prontos (títulos, lower third, legenda, contador, gráfico, CTA, transições…)
├── Skills   6 skills para agentes + plugin do Claude Code
└── CLI      init, studio, add, captions, capture, lint, still, render, skills
```

## Requisitos

- Node.js 20+
- FFmpeg no PATH (`brew install ffmpeg` · `sudo apt install ffmpeg` · `winget install ffmpeg`)
- Google Chrome instalado (ou `LOOPMOTION_CHROME=/caminho/do/chrome`)

## Começando

```bash
npm install
npm link                              # deixa o comando `loopmotion` disponível

loopmotion studio meus-videos         # abre o editor em http://127.0.0.1:3800/studio/
```

No Studio, escolha um template e edite. Também dá para criar pelo terminal:

```bash
loopmotion init meus-videos/lancamento --template promo
loopmotion studio meus-videos
```

## O Studio

| Área | O que faz |
|---|---|
| **Preview** | Mostra o frame exato do render. Clique num elemento para selecionar a camada. |
| **Timeline** | Arraste para mover, puxe as bordas para mudar a duração. Ímã nos cortes, no playhead e no início/fim. Zoom e régua. Solte mídia direto nela. |
| **Propriedades** | Início, duração, nome, animação de entrada/saída (sem código), volume e offset de mídia, textos e variáveis. Sem seleção: formato (16:9, 9:16, 1:1, 4:5, 4K), FPS, duração e verificação. |
| **Código** | Editor HTML completo (CodeMirror). Salva sozinho e o preview atualiza. |
| **IA** | Descreva a mudança ("deixe a cena 2 mais rápida", "crie uma versão 9:16"). A IA reescreve a composição usando as skills da LoopMotion e você pode desfazer. |
| **Mídia** | Upload por arrastar e soltar. Clique ou arraste para a timeline. |
| **Templates** | Em branco, Promo, Reels/TikTok, Lower third, Tipografia cinética e Gráfico animado. |
| **Exportar** | MP4 (H.264 + AAC) em segundo plano, com progresso. O arquivo vai para `exports/`. |
| **Desfazer** | Vale para tudo: timeline, inspetor, código, IA e edições externas. |
| **Ao vivo** | Se um agente editar o arquivo no disco, o Studio atualiza na hora. |

Atalhos: `Espaço` play/pause · `←/→` frame (com `Shift`: 1 s) · `Home/End` · `Delete` exclui · `Ctrl/Cmd+D` duplica · `Ctrl/Cmd+Z` desfaz · `T` novo texto · `Esc` limpa a seleção.

### Configurar a IA

Em ⚙ **Configurações**, cole sua chave da Anthropic. Ela fica salva só no seu computador, em `~/.loopmotion/config.json`. Você também pode usar variáveis de ambiente:

```bash
ANTHROPIC_API_KEY=sk-ant-... LOOPMOTION_MODEL=claude-sonnet-5-5 loopmotion studio
```

## Para agentes de IA (igual à HyperFrames)

O usuário instala as skills uma vez e depois só pede o vídeo ao agente. O agente lê a skill, escreve o HTML, roda `npx loopmotion lint`, confere os frames e renderiza.

**Claude Code (plugin):**
```bash
claude plugin marketplace add SEU-USUARIO/loopmotion
claude plugin install loopmotion@loopmotion
```
ou, numa sessão: `/plugin install loopmotion --marketplace SEU-USUARIO/loopmotion`

Depois: *"crie um reel de 15 s anunciando nosso app"* ou `/loopmotion:video reel de 15 s anunciando nosso app`.

**Qualquer agente (Claude Code, Codex, Cursor, OpenCode…):**
```bash
npx skills add SEU-USUARIO/loopmotion          # escolha as skills no seletor
npx skills add SEU-USUARIO/loopmotion --all    # todas
```

**Pela própria CLI:**
```bash
npx loopmotion skills update            # conjunto principal no projeto (.claude/skills e .agents/skills)
npx loopmotion skills update --global   # para todos os projetos
npx loopmotion init meu-video           # cria o projeto e instala as skills se faltarem
```

### Skills

| Skill | Conjunto | O que ensina |
|---|---|---|
| `loopmotion` | principal | **Ler primeiro.** Contrato de render, ciclo de trabalho, regras, referências (composição, animação, design, receitas) |
| `loopmotion-cli` | principal | Comandos por tarefa, verificação e solução de falhas |
| `loopmotion-blocks` | principal | Catálogo de blocos prontos (`npx loopmotion add`) para usar antes de construir à mão |
| `loopmotion-media` | principal | Música, narração, mixagem, imagens, vídeo, fontes e legendas |
| `website-to-loopmotion` | sob demanda | URL → vídeo (`npx loopmotion capture`) |
| `remotion-to-loopmotion` | sob demanda | Portar projetos Remotion |

Comandos do plugin: `/loopmotion:video <pedido>` e `/loopmotion:studio [pasta]`.

O assistente de IA do Studio usa a skill `loopmotion` como instrução de sistema.

### Comandos que os agentes usam

```bash
npx loopmotion init <pasta> --template <id>      # blank, promo, reel, lower-third, kinetic, chart
npx loopmotion add --list                        # catálogo de blocos
npx loopmotion add <bloco> --to <pasta> --at 3   # insere um bloco
npx loopmotion captions legendas.srt --to <pasta>
npx loopmotion capture https://site.com -o <pasta>/assets/site
npx loopmotion lint <pasta>
npx loopmotion still <pasta> --time 2.5 -o frame.png
npx loopmotion render <pasta> -o video.mp4
npx loopmotion studio <pasta>
```

Publicar tudo isso: veja **PUBLICAR.md**.

## Contrato de composição (resumo)

```html
<html data-width="1920" data-height="1080" data-fps="30" data-duration="9">
<head><script src="/__lm/gsap.js"></script></head>
<body>
  <section class="clip" id="s1" data-label="Abertura" data-start="0" data-duration="3">
    <h1 data-var="title">Título</h1>
  </section>
  <section class="clip" id="s2" data-label="Produto" data-start="3" data-duration="4" data-enter="fade" data-exit="slide-down">…</section>
  <audio src="assets/trilha.mp3" data-start="0" data-volume="0.8"></audio>
<script>
  loopmotion.timeline('#s1')     // tempos locais à cena: se ela for movida, a animação vai junto
    .from('#s1 h1', { y: 80, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.1);
</script>
</body>
</html>
```

O contrato completo está em `skills/loopmotion/references/composition.md`.

## CLI

```bash
loopmotion studio [pasta]                    # editor
loopmotion init <pasta> --template <id>      # blank, promo, reel, lower-third, kinetic, chart
loopmotion lint <arquivo|pasta>              # verificação estática + no navegador
loopmotion still <arquivo> --time 2.5        # PNG de um frame
loopmotion render <arquivo> -o out.mp4 [--props dados.json] [--fps 30] [--width 1280] [--workers 4] [--crf 18]
loopmotion skills install [--global]
```

Render em lote, com um template para N vídeos:

```bash
for f in clientes/*.json; do loopmotion render template --props "$f" -o "out/$(basename "$f" .json).mp4"; done
```

## Arquitetura

```
bin/loopmotion.js        CLI
src/runtime.js           injetado em toda composição: relógio virtual, seek(t), clips, presets,
                         timelines por cena, variáveis, mídia, integração com o Studio
src/composition.js       modelo da composição (parse5): lê a timeline e edita o HTML sem perder formatação
src/lint.js              verificação estática + em tempo de execução
src/render.js            Chrome headless → frames → FFmpeg; paralelo por pedaços + mixagem de áudio
src/server.js            servidor simples para preview/render
studio/server.js         API do Studio: projeto, edição, histórico, upload, fila de render, IA, eventos ao vivo
studio/ui/               interface do editor (HTML/CSS/JS sem build; CodeMirror empacotado em vendor/)
blocks/                  catálogo de blocos (block.html + meta.json + thumb.jpg)
skills/                  6 skills para agentes (SKILL.md + referências)
.claude-plugin/          marketplace.json + plugin.json (plugin do Claude Code)
commands/                comandos do plugin (/loopmotion:video, /loopmotion:studio)
src/blocks.js            inserção de blocos · src/captions.js SRT/VTT → clips · src/capture.js site → assets
templates/               templates (index.html + meta.json + thumb.jpg)
scripts/                 miniaturas de templates/blocos e geração do catálogo da skill
```

Princípios:

- **O arquivo HTML é a fonte da verdade.** Timeline, inspetor, código, IA e agentes externos editam o mesmo arquivo. As edições são cirúrgicas: só os atributos mudam, o resto do código fica intacto.
- **Determinismo.** O runtime controla `Date`, `performance.now`, `requestAnimationFrame` e `Math.random`. Renderizar com 1 ou com N workers gera frames idênticos.
- **Sem build.** O Studio é servido direto. Para customizar, edite `studio/ui/*`.

## Próximos passos para virar produto (SaaS)

1. **Render na nuvem:** a divisão do vídeo em pedaços já existe. Mande faixas de frames para workers (filas, Lambda, Cloud Run) e concatene no final.
2. **Contas e projetos na nuvem:** troque o sistema de arquivos local por armazenamento por usuário (S3 + banco). A API do Studio já é a fronteira certa.
3. **Colaboração:** presença e comentários na timeline, além do histórico de versões que já existe por arquivo.
4. **API pública:** `POST /v1/renders { template, props }` → webhook com o MP4 (vídeos personalizados em escala).
5. **Marketplace de templates** e um **design system** de marca por workspace (cores, fontes e logo como props).
6. **Mais saídas:** WebM com transparência, GIF, legendas automáticas a partir de áudio (transcrição → clips de legenda).
