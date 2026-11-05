// Local server: serves public/ with clean URLs (/clubs -> clubs.html) and sends /api/* to the API handler.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handler } = require('./lib/app');
const { DATA_DIR } = require('./lib/db');

const PORT = Number(process.env.PORT) || 3300;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.ics': 'text/calendar' };

function sendFile(res, file, status = 200, method = 'GET') {
  fs.readFile(file, (err, buf) => {
    if (err) {
      if (status === 404) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
      sendFile(res, path.join(PUBLIC, '404.html'), 404, method);
      return;
    }
    res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(method === 'HEAD' ? undefined : buf);
  });
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { res.writeHead(400).end(); return; }
  if (rel.endsWith('/')) rel += 'index.html';
  if (!path.extname(rel)) rel += '.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403).end(); return; }
  sendFile(res, file, 200, req.method);
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api' || pathname.startsWith('/api/')) handler(req, res);
  else serveStatic(req, res, pathname);
}).listen(PORT, () => {
  console.log(`Campus Connect 360 running at http://localhost:${PORT}`);
  console.log(`Organizer page: http://localhost:${PORT}/admin`);
  console.log(process.env.DATABASE_URL ? 'Storage: Postgres (DATABASE_URL)' : `Storage: SQLite in ${DATA_DIR}`);
  if (!process.env.ADMIN_KEY) console.log(`Organizer key is in ${path.join(DATA_DIR, 'admin-key.txt')}`);
});
