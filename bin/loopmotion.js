#!/usr/bin/env node
// LoopMotion CLI — vídeo como código. Feita para humanos e para agentes de IA.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const SKILLS_DIR = path.join(ROOT, 'skills');
const CORE_SKILLS = ['loopmotion', 'loopmotion-cli', 'loopmotion-blocks', 'loopmotion-media'];

const [cmd, ...rest] = process.argv.slice(2);

function parse(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      o[k] = v ?? (args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true);
    } else if (a === '-o') o.output = args[++i];
    else o._.push(a);
  }
  return o;
}
const o = parse(rest);
const num = (v) => (v == null || v === true ? undefined : Number(v));

function loadProps(v) {
  if (!v) return {};
  if (fs.existsSync(v)) return JSON.parse(fs.readFileSync(v, 'utf8'));
  return JSON.parse(v);
}
function resolveEntry(p) {
  const e = path.resolve(p || '.');
  return fs.existsSync(e) && fs.statSync(e).isDirectory() ? path.join(e, 'index.html') : e;
}

/** Copia skills do pacote para as pastas que os agentes leem. */
function installSkills(names, { global = false, base = process.cwd(), quiet = false } = {}) {
  const targets = global
    ? [path.join(os.homedir(), '.claude', 'skills'), path.join(os.homedir(), '.agents', 'skills')]
    : [path.join(base, '.claude', 'skills'), path.join(base, '.agents', 'skills')];
  for (const t of targets) {
    fs.mkdirSync(t, { recursive: true });
    for (const n of names) {
      const src = path.join(SKILLS_DIR, n);
      if (!fs.existsSync(src)) throw new Error(`skill "${n}" não existe. Disponíveis: ${fs.readdirSync(SKILLS_DIR).join(', ')}`);
      fs.rmSync(path.join(t, n), { recursive: true, force: true });
      fs.cpSync(src, path.join(t, n), { recursive: true });
    }
  }
  if (!quiet) console.log(`✔ Skills (${names.join(', ')}) instaladas em:\n  ${targets.join('\n  ')}`);
  return targets;
}
function hasSkills(base) {
  return [path.join(base, '.claude/skills/loopmotion'), path.join(os.homedir(), '.claude/skills/loopmotion'),
    path.join(base, '.agents/skills/loopmotion'), path.join(os.homedir(), '.agents/skills/loopmotion')].some((p) => fs.existsSync(p));
}

const HELP = `
LoopMotion ${PKG.version} — vídeo como código

Criar e editar
  loopmotion init <pasta> [--template id]   novo projeto (instala as skills se faltarem)
  loopmotion studio [pasta]                  editor visual no navegador
  loopmotion add <bloco> [--to arq] [--at s] [--duration s]   insere um bloco pronto
  loopmotion add --list                      lista os blocos do catálogo
  loopmotion captions <legendas.srt|vtt> [--to arq] [--offset s]   cria clips de legenda
  loopmotion capture <url> [-o assets/site]  captura um site (screenshots, cores, textos)

Verificar e renderizar
  loopmotion lint    [arquivo|pasta] [--static] [--json]
  loopmotion still   [arquivo|pasta] --time 2.5 [-o frame.png]
  loopmotion render  [arquivo|pasta] [-o out.mp4] [--props json|arq] [--fps n] [--width n] [--workers n] [--crf n]
  loopmotion preview [arquivo|pasta]         player simples com hot reload

Agentes de IA
  loopmotion skills update [nome] [--global] instala/atualiza as skills (Claude Code, Codex, Cursor…)
  loopmotion skills list                     lista as skills disponíveis

Templates: ${fs.readdirSync(path.join(ROOT, 'templates')).join(', ')}
`;

try {
  if (cmd === 'render') {
    const { render } = await import('../src/render.js');
    await render(resolveEntry(o._[0]), {
      output: o.output, props: loadProps(o.props), fps: num(o.fps), duration: num(o.duration),
      width: num(o.width), height: num(o.height), workers: num(o.workers), crf: num(o.crf),
    });
  } else if (cmd === 'still') {
    const { still } = await import('../src/render.js');
    await still(resolveEntry(o._[0]), { time: num(o.time) ?? 0, output: o.output, props: loadProps(o.props) });
  } else if (cmd === 'preview') {
    const { startServer } = await import('../src/server.js');
    const { url } = await startServer({ entry: resolveEntry(o._[0]), props: loadProps(o.props), watch: true, port: num(o.port) ?? 3700 });
    console.log(`▶ Preview em ${url}__lm/player.html  (espaço = play, ←/→ = frame)`);
  } else if (cmd === 'studio') {
    const { startStudio } = await import('../studio/server.js');
    const root = path.resolve(o._[0] || '.');
    fs.mkdirSync(root, { recursive: true });
    const { url } = await startStudio({ root, port: num(o.port) ?? 3800, host: o.host || '127.0.0.1' });
    console.log(`\n  LoopMotion Studio\n  ▶ ${url}\n  projeto: ${root}\n`);
    if (!o['no-open']) {
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
      import('node:child_process').then(({ exec }) => exec(`${opener} ${url}`, () => {}));
    }
  } else if (cmd === 'lint') {
    const { lintFile, lintRuntime } = await import('../src/lint.js');
    const entry = resolveEntry(o._[0]);
    const issues = [...lintFile(entry), ...(o.static ? [] : await lintRuntime(entry))];
    if (o.json) { console.log(JSON.stringify(issues, null, 2)); process.exit(issues.some((i) => i.level === 'error') ? 1 : 0); }
    for (const i of issues) console.log(`${i.level === 'error' ? '✖ erro ' : '⚠ aviso'} ${i.line ? `[linha ${i.line}] ` : ''}${i.message}`);
    const errs = issues.filter((i) => i.level === 'error').length;
    console.log(errs ? `\n${errs} erro(s), ${issues.length - errs} aviso(s)` : issues.length ? `\n✔ sem erros (${issues.length} aviso(s))` : '✔ tudo certo');
    process.exit(errs ? 1 : 0);
  } else if (cmd === 'add') {
    const { listBlocks, addBlock } = await import('../src/blocks.js');
    if (o.list || !o._[0]) {
      let cat = '';
      for (const b of listBlocks()) {
        if (b.category !== cat) { cat = b.category; console.log(`\n${cat.toUpperCase()}`); }
        console.log(`  ${b.id.padEnd(18)} ${b.description}${b.vars?.length ? `  [vars: ${b.vars.join(', ')}]` : ''}`);
      }
      console.log('\nUso: loopmotion add <bloco> --to index.html --at 3');
    } else {
      const file = resolveEntry(o.to);
      const { source, id } = addBlock(fs.readFileSync(file, 'utf8'), o._[0], { at: num(o.at) ?? 0, duration: num(o.duration), id: o.id });
      fs.writeFileSync(file, source);
      console.log(`✔ Bloco "${o._[0]}" adicionado como #${id} em ${path.relative(process.cwd(), file)}`);
    }
  } else if (cmd === 'captions') {
    const { parseSubtitles, addCaptions } = await import('../src/captions.js');
    if (!o._[0]) throw new Error('uso: loopmotion captions legendas.srt --to index.html');
    const cues = parseSubtitles(fs.readFileSync(o._[0], 'utf8'));
    const file = resolveEntry(o.to);
    fs.writeFileSync(file, addCaptions(fs.readFileSync(file, 'utf8'), cues, { offset: num(o.offset) ?? 0 }));
    console.log(`✔ ${cues.length} legenda(s) adicionada(s) em ${path.relative(process.cwd(), file)}`);
  } else if (cmd === 'capture') {
    const { capture } = await import('../src/capture.js');
    if (!o._[0]) throw new Error('uso: loopmotion capture https://site.com -o assets/site');
    const s = await capture(o._[0], { out: o.output || 'assets/site', width: num(o.width) ?? 1920, height: num(o.height) ?? 1080 });
    console.log(`✔ ${s.files.length} imagens em ${o.output || 'assets/site'} + site.json\n  título: ${s.title}\n  cores: ${s.colors.slice(0, 5).join(' · ')}\n  fontes: ${s.fonts.join(', ')}`);
  } else if (cmd === 'skills') {
    const sub = o._[0] || 'update';
    if (sub === 'list') {
      for (const n of fs.readdirSync(SKILLS_DIR)) {
        const d = /description:\s*(.+)/.exec(fs.readFileSync(path.join(SKILLS_DIR, n, 'SKILL.md'), 'utf8'))?.[1] || '';
        console.log(`${CORE_SKILLS.includes(n) ? '●' : '○'} ${n.padEnd(24)} ${d.slice(0, 90)}${d.length > 90 ? '…' : ''}`);
      }
      console.log('\n● = conjunto principal (instalado por padrão)   ○ = sob demanda: loopmotion skills update <nome>');
    } else if (sub === 'update' || sub === 'install') {
      const names = o._.slice(1).length ? o._.slice(1) : o.all ? fs.readdirSync(SKILLS_DIR) : CORE_SKILLS;
      installSkills(names, { global: !!o.global });
    } else throw new Error(`subcomando desconhecido: skills ${sub}`);
  } else if (cmd === 'init') {
    const dir = path.resolve(o._[0] || 'meu-video');
    const tplRoot = path.join(ROOT, 'templates');
    const tpl = path.join(tplRoot, path.basename(o.template || 'blank'));
    if (!fs.existsSync(tpl)) throw new Error(`template não encontrado: ${o.template}. Opções: ${fs.readdirSync(tplRoot).join(', ')}`);
    if (fs.existsSync(path.join(dir, 'index.html')) && !o.force) throw new Error(`${dir}/index.html já existe (use --force para sobrescrever)`);
    fs.mkdirSync(dir, { recursive: true });
    fs.cpSync(tpl, dir, { recursive: true, filter: (f) => !/meta\.json$|thumb\.(jpg|png)$/.test(f) });
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
    console.log(`✔ Projeto criado em ${dir} (template: ${path.basename(tpl)})`);
    if (!o['no-skills'] && !hasSkills(process.cwd()) && !hasSkills(dir)) {
      installSkills(CORE_SKILLS, { base: process.cwd(), quiet: true });
      console.log('✔ Skills da LoopMotion instaladas em ./.claude/skills e ./.agents/skills');
    }
    const rel = path.relative(process.cwd(), dir) || '.';
    console.log(`\nPróximos passos:\n  npx loopmotion studio ${rel}      # editar no navegador\n  npx loopmotion render ${rel}      # gerar o MP4`);
  } else if (cmd === '--version' || cmd === '-v' || cmd === 'version') {
    console.log(PKG.version);
  } else {
    console.log(HELP);
  }
} catch (e) {
  console.error('✖', e.message);
  process.exit(1);
}
