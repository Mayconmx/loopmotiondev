# Design de vídeo

## Formatos

| Formato | Tamanho | Uso |
|---|---|---|
| 16:9 | 1920×1080 (4K: 3840×2160) | YouTube, site, apresentações |
| 9:16 | 1080×1920 | Reels, TikTok, Shorts, Stories |
| 1:1 | 1080×1080 | Feed |
| 4:5 | 1080×1350 | Feed do Instagram (ocupa mais tela) |

Ao adaptar de 16:9 para 9:16, **refaça o layout** (empilhe na vertical, aumente o texto). Não só escale.

## Áreas seguras

- 16:9: margem de ~90 px nas laterais e ~60 px em cima/embaixo para texto.
- 9:16: deixe livres ~250 px em cima (perfil, barra) e ~380 px embaixo (legenda e botões do app), além de ~120 px à direita (ícones de curtir/comentar). Coloque legendas por volta de y = 1400–1600.

## Tipografia (1080p de referência)

| Elemento | 16:9 (1920×1080) | 9:16 (1080×1920) |
|---|---|---|
| Título de impacto | 120–200 px | 110–160 px |
| Título | 72–110 px | 80–110 px |
| Texto de apoio | 36–48 px | 44–56 px |
| Legenda | 44–56 px | 54–66 px |
| Mínimo absoluto | 28 px | 36 px |

- Peso 700–900 para títulos e `letter-spacing` negativo (-0.02 a -0.05em) em tamanhos grandes.
- No máximo ~8 palavras por tela em títulos e ~2 linhas por legenda.
- Garanta contraste (texto claro em fundo escuro ou vice-versa). Sobre imagem, use um degradê ou caixa por trás do texto.
- Fontes do sistema (`system-ui`, `Inter` se disponível) funcionam em qualquer máquina. Fontes próprias vão para `assets/` com `@font-face`.

## Ritmo

- **Gancho em até 1,5 s** em vídeos sociais: a primeira frase precisa aparecer imediatamente.
- Cenas de 2–4 s. Textos curtos: ~1 s de leitura por 3–4 palavras, mais 0,5 s de folga.
- Vídeos sociais: 6–30 s. Promo: 15–45 s. Explicativo: 45–120 s.
- Termine com uma chamada clara (CTA) visível por pelo menos 1,5–2 s.
- Movimento em tudo, mas **uma coisa importante por vez**: o olho segue o que se mexe.

## Cor e composição

- Paleta de 2–3 cores + neutros. Use uma variável CSS para a cor de destaque (`--accent`), para trocar por cliente com `--props`.
- Fundo nunca 100% estático em vídeos longos: um degradê que se move devagar, partículas sutis ou zoom lento (Ken Burns).
- Alinhe tudo a uma grade. Centralizado funciona para frases de impacto; alinhado à esquerda, para listas e explicações.

## Legendas

- 80% do conteúdo social é assistido sem som: legende tudo que é falado.
- Uma legenda por clip (`.clip` com `data-start` e `data-duration`), sincronizada com a fala.
- Caixa escura com cantos arredondados ou texto branco com contorno ou sombra forte.
- Destaque a palavra-chave com a cor de acento.

## Movimento

- Entradas desaceleram (`ease-out`), saídas aceleram (`ease-in`).
- Elementos relacionados entram em sequência (stagger), não todos juntos.
- Escala 0,8→1 e deslocamento de 40–100 px são suficientes. Exagero cansa.
- Mantenha a mesma "linguagem" de movimento no vídeo inteiro (mesmos eases e durações).
