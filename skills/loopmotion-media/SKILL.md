---
name: loopmotion-media
description: Mídia para vídeos LoopMotion — música/trilha, narração (voz), efeitos sonoros, mixagem e volume, imagens, vídeos (b-roll), fontes, logo e legendas a partir de SRT/VTT ou transcrição. Use quando o vídeo precisar de áudio, imagens, vídeos, fontes ou legendas.
---

# Mídia na LoopMotion

Toda mídia fica **dentro da pasta do projeto** (convenção: `assets/`), referenciada por caminho relativo ao `index.html`. Nunca use URLs `http`.

## Áudio

```html
<audio src="assets/trilha.mp3" data-label="Trilha" data-start="0" data-volume="0.6"></audio>
<audio src="assets/narracao.mp3" data-label="Narração" data-start="0.5" data-volume="1"></audio>
<audio src="assets/whoosh.wav" data-label="Whoosh" data-start="2.9" data-volume="0.8"></audio>
```

- `data-start`: quando entra. `data-offset`: de que segundo do arquivo começar. `data-duration`: corte. `data-volume`: 1 = original.
- O render mixa tudo com FFmpeg. Com narração, deixe a trilha em 0,15–0,3.
- **Fade da trilha:** gere uma versão com fade antes de usar:
  `ffmpeg -i in.mp3 -af "afade=in:d=0.5,afade=out:st=<dur-1.5>:d=1.5" assets/trilha.mp3`
- **Duração de um arquivo:** `ffprobe -v error -show_entries format=duration -of csv=p=0 assets/x.mp3`

### De onde tirar áudio

1. **Arquivos do usuário:** sempre a primeira opção. Pergunte se ele tem trilha, narração ou logo.
2. **Narração (TTS) local:**
   - macOS: `say -v Luciana -o /tmp/n.aiff "Texto" && ffmpeg -i /tmp/n.aiff assets/narracao.mp3`
   - Linux: `espeak-ng -v pt-br -w /tmp/n.wav "Texto" && ffmpeg -i /tmp/n.wav assets/narracao.mp3`
   - Se o usuário tiver uma API de voz (ElevenLabs, OpenAI etc.) e pedir, use a dele.
3. **Trilha simples gerada** (sem direitos autorais), quando não houver outra:
   ```bash
   ffmpeg -f lavfi -i "aevalsrc='0.15*sin(2*PI*110*t)*exp(-3*mod(t\,0.5))+0.05*sin(2*PI*220*t)+0.04*sin(2*PI*329.63*t)+0.1*sin(2*PI*55*t)*exp(-8*mod(t\,1))':s=44100:d=<dur>" -af "afade=in:d=0.5,afade=out:st=<dur-1>:d=1" assets/trilha.wav
   ```
   Avise que é uma trilha provisória e sugira trocar por uma licenciada.
4. **Bibliotecas livres** (Pixabay Music, YouTube Audio Library…): só com o arquivo baixado pelo usuário ou com permissão e acesso à rede. Confira a licença.

### Sincronizar com a narração

Meça a duração de cada frase de narração (`ffprobe`) e use esses tempos para o `data-start`/`data-duration` das cenas e legendas. **O vídeo segue a voz**, não o contrário.

## Legendas

- **Com SRT/VTT:** `npx loopmotion captions legendas.srt --to <pasta>` cria um clip de legenda por fala. Use `*palavra*` no SRT para destacar uma palavra.
- **Sem arquivo:** se houver uma transcrição com tempos (de Whisper, por exemplo), converta para SRT e use o comando acima. Para algo curto, use o bloco `caption` (`npx loopmotion add caption --at <s> --duration <s>`).
- Estilo e posição: veja `loopmotion/references/design.md` (legendas e áreas seguras).

## Imagens

```html
<img class="clip" src="assets/foto.jpg" data-start="2" data-duration="3" data-enter="fade"
     style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
```
- Para não parecer estática, use zoom lento (Ken Burns): `loopmotion.timeline('#foto').fromTo('#foto', {scale:1}, {scale:1.12, duration:<dur>, ease:'none'}, 0)`.
- Logos: prefira SVG. Para PNG, use resolução de pelo menos 2× o tamanho exibido.
- Texto sobre foto: um degradê escuro por cima (`linear-gradient(transparent 40%, #000c)`).

## Vídeo (b-roll, gravação de tela)

```html
<video class="clip" src="assets/broll.mp4" data-start="3" data-duration="4" data-offset="12" muted playsinline
       style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>
```
- Sempre `muted`. Se quiser o som do vídeo, adicione um `<audio>` com o mesmo arquivo, `data-start` e `data-offset`.
- Converta formatos estranhos (.mov, HEVC) para H.264: `ffmpeg -i in.mov -c:v libx264 -pix_fmt yuv420p -crf 20 -an assets/broll.mp4`.
- Para seek rápido, reencode com keyframes frequentes: acrescente `-g 15` ao comando acima.

## Fontes

```css
@font-face { font-family: "Marca"; src: url(assets/Marca-Bold.woff2) format("woff2"); font-weight: 700; }
h1 { font-family: "Marca", system-ui, sans-serif; }
```
O render espera `document.fonts.ready`. Sem arquivo de fonte, use `system-ui`, que funciona em qualquer máquina.

## Checklist

- [ ] Todos os arquivos em `assets/`, com caminhos relativos e sem `http`
- [ ] `npx loopmotion lint` sem `Arquivo não encontrado`
- [ ] Volume da trilha mais baixo que a narração
- [ ] Legendas sincronizadas com a fala
- [ ] Licença da música e das imagens conferida (ou o usuário avisado)
