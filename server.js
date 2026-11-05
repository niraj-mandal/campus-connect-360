// Campus Connect 360 — API + static server. Zero dependencies (Node 22.5+ for node:sqlite).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT) || 3300;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });

// ---------- Organizer key ----------
// Set ADMIN_KEY in the environment for production. Locally, one is generated once and kept in data/admin-key.txt.
const KEY_FILE = path.join(DATA, 'admin-key.txt');
let ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) {
  if (!fs.existsSync(KEY_FILE)) fs.writeFileSync(KEY_FILE, crypto.randomBytes(18).toString('base64url') + '\n');
  ADMIN_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim();
}

// ---------- Database ----------
const db = new DatabaseSync(path.join(DATA, 'campus.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    starts_on   TEXT NOT NULL,          -- YYYY-MM-DD
    capacity    INTEGER NOT NULL DEFAULT 200
  );
  CREATE TABLE IF NOT EXISTS registrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ref        TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    reg_no     TEXT NOT NULL,
    email      TEXT NOT NULL,
    event_id   TEXT NOT NULL REFERENCES events(id),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (reg_no, event_id)
  );
`);

if (db.prepare('SELECT COUNT(*) n FROM events').get().n === 0) {
  const ins = db.prepare('INSERT INTO events (id, title, description, starts_on, capacity) VALUES (?, ?, ?, ?, ?)');
  [
    ['ai-summit', 'AI & Innovation Summit', 'A session on emerging technologies and creative innovation.', '2026-11-12', 250],
    ['hackathon', 'Campus Hackathon 2026', 'A 24-hour build challenge to solve real-world problems.', '2026-11-18', 120],
    ['cultural-fest', 'Cultural Connect Fest', 'A celebration of creativity, performance and campus culture.', '2026-11-25', 500],
  ].forEach((row) => ins.run(...row));
}

const q = {
  events: db.prepare(`
    SELECT e.id, e.title, e.description, e.starts_on, e.capacity,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
    FROM events e ORDER BY e.starts_on`),
  event: db.prepare(`
    SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
    FROM events e WHERE e.id = ?`),
  stats: db.prepare(`SELECT (SELECT COUNT(*) FROM events) AS events, (SELECT COUNT(*) FROM registrations) AS registrations`),
  insert: db.prepare('INSERT INTO registrations (ref, name, reg_no, email, event_id) VALUES (?, ?, ?, ?, ?)'),
  list: db.prepare(`
    SELECT r.id, r.ref, r.name, r.reg_no, r.email, r.event_id, e.title AS event_title, r.created_at
    FROM registrations r JOIN events e ON e.id = r.event_id
    WHERE (?1 IS NULL OR r.event_id = ?1)
    ORDER BY r.created_at DESC`),
  remove: db.prepare('DELETE FROM registrations WHERE id = ?'),
};

// ---------- Validation (mirrors the form) ----------
const RULES = {
  name: (v) => !v ? 'Please enter your full name.' : !/^[\p{L} .'-]{3,60}$/u.test(v) ? 'Use letters only (3–60 characters).' : '',
  reg: (v) => !v ? 'Please enter your registration number.' : !/^[A-Za-z0-9-]{5,15}$/.test(v) ? '5–15 letters, numbers or dashes.' : '',
  email: (v) => !v ? 'Please enter your email address.' : (v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ? 'Enter a valid email address.' : '',
  event: (v) => !v ? 'Please choose an event.' : '',
};

// ---------- Helpers ----------
function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readJson(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function isAdmin(req) {
  const given = Buffer.from((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(ADMIN_KEY);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

// Simple in-memory rate limit for sign-ups: 20 per IP per 10 minutes.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now(), windowMs = 10 * 60_000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now); hits.set(ip, list);
  return list.length > 20;
}

const eventView = (e) => ({ ...e, seats_left: Math.max(0, e.capacity - e.registered) });
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // block spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---------- API ----------
async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/events') return send(res, 200, q.events.all().map(eventView));

  if (route === 'GET /api/stats') return send(res, 200, { services: 4, communities: 12, ...q.stats.get() });

  if (route === 'POST /api/registrations') {
    if (rateLimited(req.socket.remoteAddress)) return send(res, 429, { error: 'Too many sign-ups from this device. Try again in a few minutes.' });
    const body = await readJson(req);
    const data = {
      name: String(body.name ?? '').trim().replace(/\s+/g, ' '),
      reg: String(body.reg ?? '').trim().toUpperCase(),
      email: String(body.email ?? '').trim().toLowerCase(),
      event: String(body.event ?? '').trim(),
    };
    const errors = {};
    for (const [k, rule] of Object.entries(RULES)) { const m = rule(data[k]); if (m) errors[k] = m; }
    const event = data.event && q.event.get(data.event);
    if (data.event && !event) errors.event = 'That event does not exist.';
    if (Object.keys(errors).length) return send(res, 400, { errors });
    if (event.registered >= event.capacity) return send(res, 409, { errors: { event: 'Sorry, this event is full.' } });

    const ref = 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
      q.insert.run(ref, data.name, data.reg, data.email, data.event);
    } catch (err) {
      if (/UNIQUE/.test(err.message)) return send(res, 409, { errors: { reg: 'This registration number is already signed up for this event.' } });
      throw err;
    }
    return send(res, 201, { ref, name: data.name, event: eventView(q.event.get(data.event)) });
  }

  // ----- Organizer-only -----
  if (url.pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Organizer key required.' });
    const eventFilter = url.searchParams.get('event') || null;

    if (route === 'GET /api/admin/registrations') return send(res, 200, q.list.all(eventFilter));

    if (route === 'GET /api/admin/registrations.csv') {
      const rows = q.list.all(eventFilter);
      const head = ['Confirmation ID', 'Name', 'Registration No.', 'Email', 'Event', 'Registered At'];
      const csv = [head, ...rows.map((r) => [r.ref, r.name, r.reg_no, r.email, r.event_title, r.created_at])]
        .map((r) => r.map(csvCell).join(',')).join('\r\n');
      return send(res, 200, '﻿' + csv, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registrations${eventFilter ? '-' + eventFilter : ''}.csv"`,
      });
    }

    const del = req.method === 'DELETE' && url.pathname.match(/^\/api\/admin\/registrations\/(\d+)$/);
    if (del) {
      const { changes } = q.remove.run(Number(del[1]));
      return changes ? send(res, 204, '') : send(res, 404, { error: 'Registration not found.' });
    }
  }

  return send(res, 404, { error: 'Not found.' });
}

// ---------- Static files ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
}

// ---------- Server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else serveStatic(req, res, url);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Something went wrong.' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Campus Connect 360 running at http://localhost:${PORT}`);
  console.log(`Organizer page: http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_KEY) console.log(`Organizer key is in ${KEY_FILE}`);
});
