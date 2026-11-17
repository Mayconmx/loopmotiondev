# Animação na LoopMotion

## Qual ferramenta usar

| Situação | Use |
|---|---|
| Entrada/saída simples de um bloco | presets `data-enter` / `data-exit` |
| Coreografia com várias peças, stagger, sequências | **GSAP** (uma timeline) |
| Loops decorativos simples (girar, pulsar) | CSS `@keyframes` |
| Canvas, WebGL, partículas, contadores, física | `loopmotion.onFrame(t)` |

## GSAP: o padrão principal

**Uma timeline por cena**, criada com `loopmotion.timeline(seletorDaCena)`. Os tempos são **locais**: 0 = início daquele `.clip`.

```html
<script src="/__lm/gsap.js"></script>
...
<section class="clip scene" id="s1" data-label="Abertura" data-start="0" data-duration="3">…</section>
<section class="clip scene" id="s2" data-label="Produto"  data-start="3" data-duration="4">…</section>
<script>
  loopmotion.timeline('#s1')
    .from('#s1 h1', { y: 100, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.2)
    .from('#s1 p',  { y: 40,  opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.5)
    .to('#s1',      { opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.6);       // sai antes do clip acabar (3 s)

  loopmotion.timeline('#s2')                                                       // 0 aqui = 3 s no vídeo
    .from('#s2 .card', { scale: 0.8, opacity: 0, stagger: 0.12, duration: 0.5, ease: 'back.out(1.7)' }, 0.1);

  // elementos globais (atravessam o vídeo todo) usam o GSAP direto, em tempo absoluto
  gsap.fromTo('#progress', { width: '0%' }, { width: '100%', duration: loopmotion.config.duration, ease: 'none' });
</script>
```

Por que assim: no LoopMotion Studio o usuário arrasta cenas na timeline. Com `loopmotion.timeline`, as animações acompanham a cena. Com tempos absolutos, ficariam para trás.

Regras:
- Sempre passe a **posição explícita** (3º argumento) em cada tween. Isso deixa claro quando cada coisa acontece.
- O último tween da cena deve terminar antes de `data-duration` daquela cena.
- `repeat: -1` só se o ciclo fechar com a duração. Prefira `repeat: N` calculado.
- Selecione por `#id` da cena (`#s2 .card`) para não pegar elementos de outras cenas.
- Não use `gsap.delayedCall`, `ScrollTrigger` nem `gsap.ticker.add` para lógica de tempo.
- Para `onFrame` com tempo local: `loopmotion.onFrame((tLocal, tAbs) => {...}, '#s2')`.

### Eases recomendados
- Entradas: `power3.out`, `expo.out`, `back.out(1.7)` (com "pulo")
- Saídas: `power2.in`, `power3.in`
- Movimento contínuo/câmera: `none` ou `power1.inOut`
- Evite `elastic` e `bounce` em textos longos (fica difícil de ler)

### Durações
- Entrada de texto: 0,4–0,8 s. Saída: 0,3–0,5 s (saídas são mais rápidas que entradas).
- Stagger de letras: 0,02–0,05 s. Palavras: 0,06–0,12 s. Cards: 0,1–0,2 s.
- Deixe o texto **parado e legível** por pelo menos ~1 s por linha.

## Texto por palavra ou por letra

```js
const h = document.querySelector('#titulo');
h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(' ');
loopmotion.timeline('#s1').from('#titulo .w', { y: 120, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'back.out(1.6)' }, 0.3);
```
Para letras: `[...h.textContent].map(c => c === ' ' ? ' ' : `<span class="c" style="display:inline-block">${c}</span>`)`. Leia `textContent` **antes** de reescrever o HTML. Isso funciona com `data-var`, porque as props já foram aplicadas.

## CSS

```css
.ring { animation: spin 3s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.tagline { animation: rise .8s 1.6s cubic-bezier(.2,.8,.2,1) both; }  /* 1,6 s após o início do clip */
```
O tempo é **local ao clip** mais próximo. Use `both` ou `backwards` no `animation-fill-mode` para o estado inicial valer antes do delay.

## onFrame: função pura do tempo

```js
const ctx = canvas.getContext('2d');
loopmotion.onFrame((t) => {
  ctx.clearRect(0, 0, W, H);
  const x = 200 + t * 300;                     // ✅ derivado de t
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);   // ✅ periódico
  // ❌ x += 5  (depende de quantos frames já rodaram e quebra o render paralelo)
});
```
- Use `Math.random()` só na **inicialização** (a semente é fixa) e nunca dentro do `onFrame`.
- Easing manual: `gsap.parseEase('power3.out')(p)` com `p = clamp((t - inicio) / duracao, 0, 1)`.

## Transições entre cenas

- **Corte seco:** a cena A termina em 3, a B começa em 3. É o mais limpo; use na maioria das vezes.
- **Crossfade:** sobreponha 0,3–0,5 s (B começa em 2,6 com `data-enter="fade"`, A sai com `data-exit="fade"` até 3).
- **Empurrar/wipe:** anime A para fora (`x: -W`) e B para dentro com o mesmo ease e a mesma duração.
- Mantenha o mesmo tipo de transição no vídeo inteiro.

## Erros comuns

| Sintoma | Causa | Correção |
|---|---|---|
| Elemento "pisca" no primeiro frame | `gsap.from` com início depois de 0 e o clip já visível | Ok se o clip começa junto; senão use `immediateRender` padrão do `from` (não mude para false) |
| Animação não aparece / fora de hora | Timeline global (`gsap.timeline()`) com tempos locais, ou o contrário | Use `loopmotion.timeline('#cena')` com tempos locais |
| Some no meio da animação | Clip acabou antes da animação | Aumente `data-duration` ou adiante a animação |
| Render diferente do preview | `setTimeout`, `fetch`, estado acumulado | Reescreva como função de `t` |
| Preset de entrada brigando com GSAP | Mesma propriedade no mesmo elemento | Anime um filho no GSAP |
