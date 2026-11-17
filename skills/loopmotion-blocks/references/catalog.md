# Catálogo de blocos

Gerado de `blocks/*/meta.json`. Para inserir: `npx loopmotion add <id> --to <pasta> --at <s>`.

## Dados

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `counter` | Número grande contando até o valor, com rótulo. Use data-value no elemento .num. | 3 s | `label` |
| `bar-chart` | Barras animadas a partir de data-data="Rótulo:valor,...". A última barra fica em destaque. | 5 s | `title` |

## Fundo

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `particles-bg` | Degradê em movimento + partículas subindo. Coloque antes das cenas. | vídeo inteiro | — |

## Interface

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `progress-bar` | Barra fina no topo que acompanha o vídeo inteiro. | vídeo inteiro | — |
| `social-follow` | Pílula "Siga @usuario" com ícone e clique animado. | 3 s | `handle` |

## Marca

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `cta` | Frase final + botão com URL ou @. | 3 s | `headline`, `button` |
| `logo-reveal` | Anel girando + nome da marca revelado, com saída em zoom. | 3 s | `brand` |

## Texto

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `quote` | Citação grande com aspas e autor. | 4 s | `quote`, `author` |
| `caption` | Uma linha de legenda com caixa escura; palavra-chave em destaque com <em>. | 2.5 s | `text` |
| `list-reveal` | Título + 3 itens numerados entrando um a um. | 4.5 s | `title`, `item1`, `item2`, `item3` |
| `lower-third` | Nome e cargo no canto inferior, com faixa colorida. | 5 s | `name`, `role` |
| `title-card` | Título grande centralizado com subtítulo, entrada palavra por palavra. | 3 s | `title`, `subtitle` |

## Transição

| id | O que é | Duração padrão | Variáveis (data-var) |
|---|---|---|---|
| `flash-transition` | Clarão branco rápido para disfarçar um corte. Posicione centralizado no corte. | 0.6 s | — |
| `wipe-transition` | Painel colorido que varre a tela da esquerda para a direita. Centralize no corte. | 0.9 s | — |
