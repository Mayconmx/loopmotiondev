# Como publicar a LoopMotion (para o modelo "instala a skill, pede o vídeo")

São três canais, todos a partir **deste mesmo repositório**:

| Canal | O usuário roda | Precisa de |
|---|---|---|
| npm | `npx loopmotion …` | Publicar o pacote no npm |
| Plugin do Claude Code | `claude plugin marketplace add SEU-USUARIO/loopmotion` | Repositório público no GitHub com `.claude-plugin/` |
| Skills para qualquer agente | `npx skills add SEU-USUARIO/loopmotion` | O mesmo repositório (a pasta `skills/`) |

As skills mandam o agente rodar `npx loopmotion`. Por isso **publique no npm primeiro**.

## 1. Troque os placeholders

Procure e substitua `SEU-USUARIO` pelo usuário ou organização do GitHub:

```bash
grep -rl "SEU-USUARIO" . --exclude-dir=node_modules | xargs sed -i '' 's/SEU-USUARIO/minha-org/g'   # macOS
grep -rl "SEU-USUARIO" . --exclude-dir=node_modules | xargs sed -i 's/SEU-USUARIO/minha-org/g'      # Linux
```

Arquivos: `package.json`, `.claude-plugin/plugin.json`, `README.md`, este arquivo.

## 2. GitHub

```bash
git init && git add . && git commit -m "LoopMotion 0.2.0"
gh repo create minha-org/loopmotion --public --source=. --push
```

O repositório precisa ser **público** para `npx skills add` e para o marketplace funcionarem sem autenticação.

## 3. npm

```bash
npm login
npm run catalog            # atualiza o catálogo de blocos na skill (também roda no prepublishOnly)
npm publish --access public
```

Teste num diretório vazio:

```bash
npx loopmotion@latest --version
npx loopmotion@latest init teste --template promo && npx loopmotion@latest render teste
```

O nome `loopmotion` estava livre no npm em 17/11/2026. Se for registrado antes, use um escopo (`@loopmotion/cli`) e troque `npx loopmotion` por `npx @loopmotion/cli` nas skills (`grep -rl "npx loopmotion" skills commands`).

## 4. Plugin do Claude Code

Já está pronto em `.claude-plugin/marketplace.json` (marketplace `loopmotion`) e `.claude-plugin/plugin.json` (plugin `loopmotion`, com a raiz do repositório como fonte). Para validar:

```bash
claude plugin validate .
```

Para os usuários:

```bash
claude plugin marketplace add minha-org/loopmotion
claude plugin install loopmotion@loopmotion
```

As skills ficam disponíveis como `/loopmotion:loopmotion`, `/loopmotion:loopmotion-blocks`… e os comandos como `/loopmotion:video` e `/loopmotion:studio`. Os usuários podem ativar a atualização automática em `/plugin`.

**Versões:** a cada release, suba `version` no `package.json` **e** no `.claude-plugin/plugin.json` (os dois iguais).

Para alcançar todo mundo, você pode depois submeter o plugin ao diretório oficial da Anthropic (veja a documentação de plugins do Claude Code).

## 5. Skills para outros agentes

Nada a fazer além do passo 2. O `npx skills add minha-org/loopmotion` encontra as 6 skills em `skills/`. Para divulgar:

```bash
npx skills add minha-org/loopmotion --skill loopmotion --skill loopmotion-cli --skill loopmotion-blocks --skill loopmotion-media
```

## 6. Checklist de release

- [ ] `npm run catalog` e `npm run thumbs` (se blocos/templates mudaram)
- [ ] `for t in templates/*/; do npx loopmotion lint $t; done`: tudo OK
- [ ] `claude plugin validate .`: passou
- [ ] versão igual em `package.json` e `.claude-plugin/plugin.json`
- [ ] `npm publish` → `git tag v0.x.y && git push --tags`

## Como ficou o fluxo para o usuário final

```
$ claude plugin install loopmotion@loopmotion        (uma vez)
$ claude
> crie um reel de 12s lançando nosso app, cores laranja e amarelo, com legendas

  Claude lê a skill loopmotion → planeja 5 cenas
  → npx loopmotion init reel --template blank
  → npx loopmotion add title-card / list-reveal / counter / cta / flash-transition
  → npx loopmotion captions legendas.srt --to reel
  → npx loopmotion lint reel            ✔ tudo certo
  → npx loopmotion still reel --time …  (confere cada cena)
  → npx loopmotion render reel -o reel.mp4
  ✔ reel.mp4 (1080×1920, 12 s). Para ajustar: npx loopmotion studio .
```
