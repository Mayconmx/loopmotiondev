// Servidor local: serve a pasta da composição e injeta o runtime no <head>.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

// Bibliotecas servidas localmente (render funciona offline)
const BUILTINS = {
  '/__lm/runtime.js': path.join(here, 'runtime.js'),
  '/__lm/player.html': path.join(here, 'player.html'),
  '/__lm/gsap.js': require.resolve('gsap/dist/gsap.min.js'),
};

export const RUNTIME_TAG = '<script src="/__lm/runtime.js"></script>';

/** Injeta o runtime (e opcionalmente props) logo após o <head>. */
export function injectRuntime(html, props) {
  const inject = (props ? `<script>window.__LM_PROPS__=${JSON.stringify(props).replace(/</g, '\\u003c')};</script>` : '') + RUNTIME_TAG;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
}

export { BUILTINS, MIME };

export function startServer({ entry, props = {}, watch = false, port = 0 }) {
  const rootDir = path.dirname(path.resolve(entry));
  const entryName = path.basename(entry);
  const inject =
    `<script>window.__LM_PROPS__=${JSON.stringify(props).replace(/</g, '\\u003c')};</script>` +
    `<script src="/__lm/runtime.js"></script>`;

  // Hot reload para o preview: avisa o player quando algo na pasta muda
  const clients = new Set();
  if (watch) {
    let timer;
    fs.watch(rootDir, { recursive: true }, (_, name) => {
      if (name && /(^|[\\/])(node_modules|\.git)[\\/]|\.mp4$/.test(name)) return;
      clearTimeout(timer);
      timer = setTimeout(() => clients.forEach((c) => c.write('data: reload\n\n')), 120);
    });
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/__lm/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(': ok\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let file = BUILTINS[url.pathname];
    if (!file) {
      const rel = decodeURIComponent(url.pathname === '/' ? `/${entryName}` : url.pathname);
      file = path.join(rootDir, path.normalize(rel));
      if (!file.startsWith(rootDir)) { res.writeHead(403).end(); return; }
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
      const ext = path.extname(file).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      if (ext === '.html' && !file.includes(`${path.sep}src${path.sep}player.html`)) {
        let html = fs.readFileSync(file, 'utf8');
        html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(html);
        return;
      }
      // Suporte a Range (necessário para seek de <video>)
      const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
      if (range) {
        const start = range[1] ? +range[1] : 0;
        const end = range[2] ? +range[2] : st.size - 1;
        res.writeHead(206, {
          'Content-Type': type, 'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(file).pipe(res);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/`, port });
    });
  });
}
