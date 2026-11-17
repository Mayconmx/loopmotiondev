---
description: Cria um vídeo LoopMotion a partir de uma descrição (ex.: /loopmotion:video reel de 15s anunciando nosso app)
argument-hint: <o que o vídeo deve mostrar, formato, duração>
---

Crie um vídeo com a LoopMotion para este pedido:

$ARGUMENTS

Use a skill `loopmotion` e siga o ciclo de trabalho dela inteiro: planeje as cenas, crie o projeto com `npx loopmotion init`, use blocos prontos (`loopmotion-blocks`) quando servirem, anime com timelines por cena, rode `npx loopmotion lint` até zerar os erros, confira stills de cada cena e renderize o MP4. No fim, informe o caminho do vídeo e sugira `npx loopmotion studio <pasta>` para ajustes visuais.

Se o pedido tiver uma URL, use também a skill `website-to-loopmotion`. Se precisar de áudio, imagens ou legendas, use `loopmotion-media`.
