// Campus Connect 360 API: one request handler, used by the local server (dev-server.js)
// and, later, by a Vercel Function (api/index.js).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { getStore, DATA_DIR, ON_VERCEL } = require('./db');

// ---------- Organizer key ----------
// Production: set ADMIN_KEY. Locally a key is generated once into data/admin-key.txt.
let cachedKey;
function adminKey() {
  if (process.env.ADMIN_KEY) return process.env.ADMIN_KEY;
  if (ON_VERCEL) return null; // a generated key would differ per instance, so require the env var
  if (cachedKey) return cachedKey;
  const file = path.join(DATA_DIR, 'admin-key.txt');
  if (!fs.existsSync(file)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(18).toString('base64url') + '\n');
  }
  return (cachedKey = fs.readFileSync(file, 'utf8').trim());
}

// ---------- Validation ----------
const NAME_RE = /^[\p{L} .'-]{3,60}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MSG_TOPICS = ['General', 'Services', 'Events', 'Technical'];
const NOTICE_CATS = ['Exams', 'Deadlines', 'Holidays', 'Library', 'General'];
const TICKET_CATS = ['Hostel', 'IT & Wi-Fi', 'Library', 'Fees', 'Academics', 'General & feedback', 'Other'];
const TICKET_STATUS = ['open', 'in_progress', 'resolved'];
const REQUEST_STATUS = ['pending', 'approved', 'declined'];

// Event photos end up in a CSS url(): https only, and no characters that could break out of it.
const IMAGE_URL_RE = /^https:\/\/[^\s'"()<>\\]{8,500}$/;
const str = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
const oneLine = (v, max) => str(v, max).replace(/\s+/g, ' ');
const len = (min, max, label) => (v) => v.length < min || v.length > max ? `${label} must be ${min}–${max} characters.` : '';

const R = {
  name: (v) => !v ? 'Please enter your full name.' : !NAME_RE.test(v) ? 'Use letters only (3–60 characters).' : '',
  reg: (v) => !v ? 'Please enter your registration number.' : !/^[A-Za-z0-9-]{5,15}$/.test(v) ? '5–15 letters, numbers or dashes.' : '',
  email: (v) => !v ? 'Please enter your email address.' : (v.length > 120 || !EMAIL_RE.test(v)) ? 'Enter a valid email address.' : '',
  oneOf: (list, msg) => (v) => list.includes(v) ? '' : msg,
  date: (v) => !validDate(v) ? 'Pick a valid date.' : '',
};

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function check(rules, data) {
  const errors = {};
  for (const [k, rule] of Object.entries(rules)) { const m = rule(data[k]); if (m) errors[k] = m; }
  return Object.keys(errors).length ? errors : null;
}

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'item';
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const makeRef = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const refOk = (prefix, v) => new RegExp(`^${prefix}-[0-9A-F]{8}$`).test(v);

// ---------- HTTP helpers ----------
function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.statusCode = status;
  res.setHeader('Content-Type', isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(status === 204 ? undefined : isJson ? JSON.stringify(body) : body);
}

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function readJson(req, limit = 12_000) {
  // Some hosts (Vercel) pre-parse req.body and consume the stream.
  let pre;
  try { pre = req.body; } catch { throw httpError(400, 'Invalid JSON'); }
  if (pre !== undefined && pre !== null) {
    if (Buffer.isBuffer(pre)) pre = pre.toString('utf8');
    if (typeof pre === 'string') { try { return JSON.parse(pre || '{}'); } catch { throw httpError(400, 'Invalid JSON'); } }
    if (typeof pre === 'object') return pre;
  }
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw httpError(413, 'Payload too large');
    chunks.push(c);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw httpError(400, 'Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw httpError(400, 'Invalid JSON');
  return body;
}

function isAdmin(req, key) {
  const given = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(key);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

// In-memory rate limit (per process): 30 public writes per IP per 10 minutes.
const hits = new Map();
function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const t = Date.now(), windowMs = 10 * 60_000;
  const list = (hits.get(ip) || []).filter((x) => t - x < windowMs);
  list.push(t); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}
const TOO_MANY = { error: 'Too many requests from this device. Try again in a few minutes.' };

const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // block spreadsheet formula injection
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---------- Views ----------
const EVENT_COLS = `e.id, e.title, e.description, e.starts_on, e.start_time, e.venue, e.capacity, e.image,
  (SELECT CAST(COUNT(*) AS INTEGER) FROM registrations r WHERE r.event_id = e.id) AS registered`;
const eventView = (e) => e && ({ ...e, capacity: Number(e.capacity), registered: Number(e.registered), seats_left: Math.max(0, Number(e.capacity) - Number(e.registered)) });
const getEvent = async (db, id) => eventView(await db.get(`SELECT ${EVENT_COLS} FROM events e WHERE e.id = ?`, [id]));

const CLUB_COLS = `c.id, c.name, c.category, c.description, c.meets,
  c.base_members + (SELECT CAST(COUNT(*) AS INTEGER) FROM club_requests q WHERE q.club_id = c.id AND q.status = 'approved') AS members`;
const clubView = (c) => c && ({ ...c, members: Number(c.members) });

// Public view of a lost & found post: never includes the poster's email.
const itemView = (i) => i && ({ ref: i.ref, kind: i.kind, title: i.title, description: i.description, location: i.location, happened_on: i.happened_on, status: i.status, created_at: i.created_at, replies: i.replies !== undefined ? Number(i.replies) : undefined });
const ticketView = (t) => t && ({ ref: t.ref, name: t.name, category: t.category, subject: t.subject, description: t.description, status: t.status, note: t.note, created_at: t.created_at, updated_at: t.updated_at });

// ---------- Public routes ----------
const routes = [];
const on = (method, pattern, fn, opts = {}) => routes.push({ method, pattern, fn, ...opts });

on('GET', '/api/health', async ({ db }) => [200, { ok: true, storage: db.kind, temporary: db.temporary, admin: !!adminKey() }]);

on('GET', '/api/stats', async ({ db }) => {
  const s = await db.get(`SELECT
    (SELECT CAST(COUNT(*) AS INTEGER) FROM events WHERE starts_on >= ?) AS events,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM registrations) AS registrations,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM clubs) AS communities`, [today()]);
  return [200, { services: 8, events: Number(s.events), registrations: Number(s.registrations), communities: Number(s.communities) }];
});

// Events & registration
on('GET', '/api/events', async ({ db }) => {
  const rows = await db.all(`SELECT ${EVENT_COLS} FROM events e WHERE e.starts_on >= ? ORDER BY e.starts_on, e.start_time`, [today()]);
  return [200, rows.map(eventView)];
});

on('POST', '/api/registrations', async ({ db, body }) => {
  const data = { name: oneLine(body.name, 80), reg: str(body.reg, 30).toUpperCase(), email: str(body.email, 200).toLowerCase(), event: str(body.event, 60) };
  const errors = check({ name: R.name, reg: R.reg, email: R.email, event: (v) => v ? '' : 'Please choose an event.' }, data) || {};
  const event = data.event ? await getEvent(db, data.event) : null;
  if (data.event && !event) errors.event = 'That event does not exist.';
  else if (event && event.starts_on < today()) errors.event = 'Registration for this event has closed.';
  if (Object.keys(errors).length) return [400, { errors }];
  if (event.seats_left <= 0) return [409, { errors: { event: 'Sorry, this event is full.' } }];
  const ref = makeRef('CC');
  try {
    await db.run('INSERT INTO registrations (ref, name, reg_no, email, event_id, created_at) VALUES (?, ?, ?, ?, ?, ?)', [ref, data.name, data.reg, data.email, data.event, now()]);
  } catch (err) {
    if (db.isUniqueError(err)) return [409, { errors: { reg: 'This registration number is already signed up for this event.' } }];
    throw err;
  }
  return [201, { ref, name: data.name, email: data.email, event: await getEvent(db, data.event) }];
}, { limited: true });

async function findOwn(db, table, prefix, body) {
  const ref = str(body.ref, 20).toUpperCase();
  const email = str(body.email, 200).toLowerCase();
  if (!refOk(prefix, ref) || !email) throw httpError(400, `Enter your ID (like ${prefix}-1A2B3C4D) and the email you used.`);
  const row = await db.get(`SELECT * FROM ${table} WHERE ref = ? AND email = ?`, [ref, email]);
  if (!row) throw httpError(404, 'Nothing matches that ID and email. Check both and try again.');
  return row;
}

on('POST', '/api/registrations/lookup', async ({ db, body }) => {
  const row = await findOwn(db, 'registrations', 'CC', body);
  return [200, { ref: row.ref, name: row.name, reg_no: row.reg_no, email: row.email, created_at: row.created_at, event: await getEvent(db, row.event_id) }];
}, { limited: true });

on('POST', '/api/registrations/cancel', async ({ db, body }) => {
  const row = await findOwn(db, 'registrations', 'CC', body);
  await db.run('DELETE FROM registrations WHERE id = ?', [row.id]);
  return [200, { cancelled: true, ref: row.ref }];
}, { limited: true });

// Contact
on('POST', '/api/messages', async ({ db, body }) => {
  const data = { name: oneLine(body.name, 80), email: str(body.email, 200).toLowerCase(), topic: str(body.topic, 20), body: str(body.body, 1200) };
  const errors = check({ name: R.name, email: R.email, topic: R.oneOf(MSG_TOPICS, 'Please choose a topic.'), body: len(10, 1000, 'Your message') }, data);
  if (errors) return [400, { errors }];
  await db.run('INSERT INTO messages (name, email, topic, body, created_at) VALUES (?, ?, ?, ?, ?)', [data.name, data.email, data.topic, data.body, now()]);
  return [201, { ok: true }];
}, { limited: true });

// Notices
on('GET', '/api/notices', async ({ db }) => [200, await db.all('SELECT id, title, body, category, pinned, created_at FROM notices ORDER BY pinned DESC, created_at DESC')]);

// Clubs
on('GET', '/api/clubs', async ({ db }) => [200, (await db.all(`SELECT ${CLUB_COLS} FROM clubs c ORDER BY c.category, c.name`)).map(clubView)]);

on('POST', /^\/api\/clubs\/([\w-]{1,60})\/join$/, async ({ db, body, match }) => {
  const club = await db.get('SELECT id, name FROM clubs WHERE id = ?', [match[1]]);
  if (!club) return [404, { error: 'That club does not exist.' }];
  const data = { name: oneLine(body.name, 80), reg: str(body.reg, 30).toUpperCase(), email: str(body.email, 200).toLowerCase(), note: str(body.note, 400) };
  const errors = check({ name: R.name, reg: R.reg, email: R.email, note: (v) => v.length > 300 ? 'Keep it under 300 characters.' : '' }, data);
  if (errors) return [400, { errors }];
  try {
    await db.run('INSERT INTO club_requests (club_id, name, reg_no, email, note, created_at) VALUES (?, ?, ?, ?, ?, ?)', [club.id, data.name, data.reg, data.email, data.note, now()]);
  } catch (err) {
    if (db.isUniqueError(err)) return [409, { errors: { reg: `You have already asked to join ${club.name}.` } }];
    throw err;
  }
  return [201, { ok: true, club: club.name }];
}, { limited: true });

// Lost & Found
on('GET', '/api/lost-found', async ({ db }) => {
  const rows = await db.all("SELECT * FROM lost_items WHERE status = 'open' ORDER BY created_at DESC LIMIT 200");
  return [200, rows.map(itemView)];
});

on('POST', '/api/lost-found', async ({ db, body }) => {
  const data = {
    kind: str(body.kind, 10), title: oneLine(body.title, 90), description: str(body.description, 600), location: oneLine(body.location, 90),
    happened_on: str(body.happened_on, 10), name: oneLine(body.name, 80), email: str(body.email, 200).toLowerCase(),
  };
  const errors = check({
    kind: R.oneOf(['lost', 'found'], 'Choose lost or found.'), title: len(3, 80, 'Item name'), description: len(10, 500, 'Description'),
    location: len(2, 80, 'Location'), happened_on: (v) => R.date(v) || (v > today() ? 'The date cannot be in the future.' : ''), name: R.name, email: R.email,
  }, data);
  if (errors) return [400, { errors }];
  const ref = makeRef('LF');
  await db.run('INSERT INTO lost_items (ref, kind, title, description, location, happened_on, name, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [ref, data.kind, data.title, data.description, data.location, data.happened_on, data.name, data.email, now()]);
  return [201, { ref }];
}, { limited: true });

on('POST', /^\/api\/lost-found\/(LF-[0-9A-F]{8})\/reply$/, async ({ db, body, match }) => {
  const item = await db.get("SELECT id FROM lost_items WHERE ref = ? AND status = 'open'", [match[1]]);
  if (!item) return [404, { error: 'This post is no longer open.' }];
  const data = { name: oneLine(body.name, 80), email: str(body.email, 200).toLowerCase(), body: str(body.body, 600) };
  const errors = check({ name: R.name, email: R.email, body: len(10, 500, 'Your message') }, data);
  if (errors) return [400, { errors }];
  await db.run('INSERT INTO lost_replies (item_id, name, email, body, created_at) VALUES (?, ?, ?, ?, ?)', [item.id, data.name, data.email, data.body, now()]);
  return [201, { ok: true }];
}, { limited: true });

on('POST', '/api/lost-found/manage', async ({ db, body }) => {
  const item = await findOwn(db, 'lost_items', 'LF', body);
  const replies = await db.all('SELECT name, email, body, created_at FROM lost_replies WHERE item_id = ? ORDER BY created_at', [item.id]);
  return [200, { ...itemView(item), replies }];
}, { limited: true });

on('POST', '/api/lost-found/resolve', async ({ db, body }) => {
  const item = await findOwn(db, 'lost_items', 'LF', body);
  await db.run("UPDATE lost_items SET status = 'resolved' WHERE id = ?", [item.id]);
  return [200, { ok: true }];
}, { limited: true });

// Help desk
on('POST', '/api/tickets', async ({ db, body }) => {
  const data = {
    name: oneLine(body.name, 80), reg: str(body.reg, 30).toUpperCase(), email: str(body.email, 200).toLowerCase(),
    category: str(body.category, 20), subject: oneLine(body.subject, 110), description: str(body.description, 1200),
  };
  const errors = check({
    name: R.name, reg: R.reg, email: R.email, category: R.oneOf(TICKET_CATS, 'Choose a category.'),
    subject: len(5, 100, 'Subject'), description: len(20, 1000, 'Description'),
  }, data);
  if (errors) return [400, { errors }];
  const ref = makeRef('TK');
  const t = now();
  await db.run('INSERT INTO tickets (ref, name, reg_no, email, category, subject, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [ref, data.name, data.reg, data.email, data.category, data.subject, data.description, t, t]);
  return [201, { ref }];
}, { limited: true });

on('POST', '/api/tickets/track', async ({ db, body }) => [200, ticketView(await findOwn(db, 'tickets', 'TK', body))], { limited: true });

// ---------- Organizer routes (Authorization: Bearer <ADMIN_KEY>) ----------
const admin = (method, pattern, fn) => on(method, pattern, fn, { admin: true });

admin('GET', '/api/admin/overview', async ({ db }) => {
  const c = await db.get(`SELECT
    (SELECT CAST(COUNT(*) AS INTEGER) FROM registrations) AS registrations,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM club_requests WHERE status = 'pending') AS requests,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM tickets WHERE status <> 'resolved') AS tickets,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM lost_items WHERE status = 'open') AS lost,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM messages WHERE handled = 0) AS messages`);
  return [200, { storage: db.kind, temporary: db.temporary, counts: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Number(v)])) }];
});

const regListSql = (filtered) => `SELECT r.id, r.ref, r.name, r.reg_no, r.email, r.event_id, e.title AS event_title, r.created_at
  FROM registrations r JOIN events e ON e.id = r.event_id ${filtered ? 'WHERE r.event_id = ?' : ''} ORDER BY r.created_at DESC`;

admin('GET', '/api/admin/registrations', async ({ db, url }) => {
  const ev = url.searchParams.get('event');
  return [200, await db.all(regListSql(!!ev), ev ? [ev] : [])];
});

admin('GET', '/api/admin/registrations.csv', async ({ db, url }) => {
  const ev = url.searchParams.get('event');
  const rows = await db.all(regListSql(!!ev), ev ? [ev] : []);
  const head = ['Confirmation ID', 'Name', 'Registration No.', 'Email', 'Event', 'Registered At'];
  const csv = [head, ...rows.map((r) => [r.ref, r.name, r.reg_no, r.email, r.event_title, r.created_at])].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return [200, '﻿' + csv, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="registrations${ev ? '-' + ev.replace(/[^\w-]/g, '') : ''}.csv"`,
  }];
});

admin('DELETE', /^\/api\/admin\/registrations\/(\d+)$/, async ({ db, match }) =>
  (await db.run('DELETE FROM registrations WHERE id = ?', [Number(match[1])])).changes ? [204, ''] : [404, { error: 'Registration not found.' }]);

// Events
admin('GET', '/api/admin/events', async ({ db }) => [200, (await db.all(`SELECT ${EVENT_COLS} FROM events e ORDER BY e.starts_on, e.start_time`)).map(eventView)]);
admin('POST', '/api/admin/events', async ({ db, body }) => {
  const data = {
    title: oneLine(body.title, 100), description: str(body.description, 300), starts_on: str(body.starts_on, 10),
    start_time: str(body.start_time, 5), venue: oneLine(body.venue, 100), capacity: Number(body.capacity), image: str(body.image, 600),
  };
  const errors = check({
    title: len(3, 80, 'Title'), description: len(10, 200, 'Description'), starts_on: R.date,
    start_time: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? '' : 'Use a time like 14:30.',
    venue: len(2, 80, 'Venue'), image: (v) => !v || IMAGE_URL_RE.test(v) ? '' : 'Use an https:// image link (no spaces or quotes).', capacity: (v) => Number.isInteger(v) && v >= 1 && v <= 10000 ? '' : 'Capacity must be 1–10000.',
  }, data);
  if (errors) return [400, { errors }];
  let id = slug(data.title), n = 1;
  while (await db.get('SELECT id FROM events WHERE id = ?', [id])) id = `${slug(data.title)}-${++n}`;
  await db.run('INSERT INTO events (id, title, description, starts_on, start_time, venue, capacity, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, data.title, data.description, data.starts_on, data.start_time, data.venue, data.capacity, data.image]);
  return [201, await getEvent(db, id)];
});
admin('DELETE', /^\/api\/admin\/events\/([\w-]{1,60})$/, async ({ db, match }) => {
  await db.run('DELETE FROM registrations WHERE event_id = ?', [match[1]]);
  return (await db.run('DELETE FROM events WHERE id = ?', [match[1]])).changes ? [204, ''] : [404, { error: 'Event not found.' }];
});

// Notices
admin('POST', '/api/admin/notices', async ({ db, body }) => {
  const data = { title: oneLine(body.title, 120), body: str(body.body, 1200), category: str(body.category, 20), pinned: body.pinned ? 1 : 0 };
  const errors = check({ title: len(5, 100, 'Title'), body: len(10, 1000, 'Notice text'), category: R.oneOf(NOTICE_CATS, 'Choose a category.') }, data);
  if (errors) return [400, { errors }];
  await db.run('INSERT INTO notices (title, body, category, pinned, created_at) VALUES (?, ?, ?, ?, ?)', [data.title, data.body, data.category, data.pinned, now()]);
  return [201, { ok: true }];
});
admin('PATCH', /^\/api\/admin\/notices\/(\d+)$/, async ({ db, body, match }) =>
  (await db.run('UPDATE notices SET pinned = ? WHERE id = ?', [body.pinned ? 1 : 0, Number(match[1])])).changes ? [200, { ok: true }] : [404, { error: 'Notice not found.' }]);
admin('DELETE', /^\/api\/admin\/notices\/(\d+)$/, async ({ db, match }) =>
  (await db.run('DELETE FROM notices WHERE id = ?', [Number(match[1])])).changes ? [204, ''] : [404, { error: 'Notice not found.' }]);

// Club join requests
admin('GET', '/api/admin/club-requests', async ({ db }) => [200, await db.all(`SELECT q.*, c.name AS club_name FROM club_requests q JOIN clubs c ON c.id = q.club_id
  ORDER BY CASE q.status WHEN 'pending' THEN 0 ELSE 1 END, q.created_at DESC`)]);
admin('PATCH', /^\/api\/admin\/club-requests\/(\d+)$/, async ({ db, body, match }) => {
  const status = str(body.status, 20);
  if (!REQUEST_STATUS.includes(status)) return [400, { error: 'Unknown status.' }];
  return (await db.run('UPDATE club_requests SET status = ? WHERE id = ?', [status, Number(match[1])])).changes ? [200, { ok: true }] : [404, { error: 'Request not found.' }];
});
admin('DELETE', /^\/api\/admin\/club-requests\/(\d+)$/, async ({ db, match }) =>
  (await db.run('DELETE FROM club_requests WHERE id = ?', [Number(match[1])])).changes ? [204, ''] : [404, { error: 'Request not found.' }]);

// Lost & found
admin('GET', '/api/admin/lost-found', async ({ db }) => [200, await db.all(`SELECT i.*, (SELECT CAST(COUNT(*) AS INTEGER) FROM lost_replies r WHERE r.item_id = i.id) AS replies
  FROM lost_items i ORDER BY CASE i.status WHEN 'open' THEN 0 ELSE 1 END, i.created_at DESC`)]);
admin('PATCH', /^\/api\/admin\/lost-found\/(\d+)$/, async ({ db, body, match }) => {
  const status = str(body.status, 10);
  if (!['open', 'resolved'].includes(status)) return [400, { error: 'Unknown status.' }];
  return (await db.run('UPDATE lost_items SET status = ? WHERE id = ?', [status, Number(match[1])])).changes ? [200, { ok: true }] : [404, { error: 'Post not found.' }];
});
admin('DELETE', /^\/api\/admin\/lost-found\/(\d+)$/, async ({ db, match }) => {
  await db.run('DELETE FROM lost_replies WHERE item_id = ?', [Number(match[1])]);
  return (await db.run('DELETE FROM lost_items WHERE id = ?', [Number(match[1])])).changes ? [204, ''] : [404, { error: 'Post not found.' }];
});

// Tickets
admin('GET', '/api/admin/tickets', async ({ db }) => [200, await db.all(`SELECT * FROM tickets
  ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, created_at DESC`)]);
admin('PATCH', /^\/api\/admin\/tickets\/(\d+)$/, async ({ db, body, match }) => {
  const status = str(body.status, 20);
  const note = str(body.note, 600);
  if (!TICKET_STATUS.includes(status)) return [400, { error: 'Unknown status.' }];
  return (await db.run('UPDATE tickets SET status = ?, note = ?, updated_at = ? WHERE id = ?', [status, note, now(), Number(match[1])])).changes
    ? [200, { ok: true }] : [404, { error: 'Ticket not found.' }];
});

// Messages
admin('GET', '/api/admin/messages', async ({ db }) => [200, await db.all('SELECT * FROM messages ORDER BY handled, created_at DESC')]);
admin('PATCH', /^\/api\/admin\/messages\/(\d+)$/, async ({ db, body, match }) =>
  (await db.run('UPDATE messages SET handled = ? WHERE id = ?', [body.handled ? 1 : 0, Number(match[1])])).changes ? [200, { ok: true }] : [404, { error: 'Message not found.' }]);
admin('DELETE', /^\/api\/admin\/messages\/(\d+)$/, async ({ db, match }) =>
  (await db.run('DELETE FROM messages WHERE id = ?', [Number(match[1])])).changes ? [204, ''] : [404, { error: 'Message not found.' }]);

// ---------- Dispatcher ----------
async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  // A Vercel rewrite can send /api/<path> as /api?__path=<path>; restore the original path.
  const rewritten = url.searchParams.get('__path');
  if (rewritten !== null) {
    if (url.pathname === '/api' || url.pathname === '/api/') url.pathname = '/api/' + rewritten.replace(/^\/+/, '');
    url.searchParams.delete('__path');
  }
  const p = url.pathname.replace(/\/+$/, '') || '/';

  try {
    let found = null, match = null, pathMatched = false;
    for (const r of routes) {
      const mm = typeof r.pattern === 'string' ? (r.pattern === p ? [p] : null) : p.match(r.pattern);
      if (!mm) continue;
      pathMatched = true;
      if (r.method === req.method) { found = r; match = mm; break; }
    }
    if (!found) return send(res, pathMatched ? 405 : 404, { error: pathMatched ? 'Method not allowed.' : 'Not found.' });

    if (found.admin) {
      const key = adminKey();
      if (!key) return send(res, 503, { error: 'Organizer access is not set up. Add an ADMIN_KEY environment variable.' });
      if (!isAdmin(req, key)) return send(res, 401, { error: 'Organizer key required.' });
    }
    if (found.limited && rateLimited(req)) return send(res, 429, TOO_MANY);

    const db = await getStore();
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readJson(req) : {};
    const [status, payload, headers] = await found.fn({ db, body, url, match, req });
    send(res, status, payload, headers);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('[campus-connect]', err);
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Something went wrong on our side. Please try again.' : err.message });
  }
}

module.exports = { handler };
