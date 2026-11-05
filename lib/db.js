// Storage for Campus Connect 360.
//   DATABASE_URL set  -> Postgres (Neon / Vercel Postgres / any Postgres)
//   otherwise         -> SQLite file in data/ (or DATA_DIR)
// Both expose the same small async API: all(sql, params), get(sql, params), run(sql, params) -> { changes }.
// SQL is written with `?` placeholders; the Postgres adapter rewrites them to $1, $2, ...
const fs = require('node:fs');
const path = require('node:path');

const ON_VERCEL = !!process.env.VERCEL;
const DATA_DIR = process.env.DATA_DIR || (ON_VERCEL ? '/tmp/campus-connect' : path.join(__dirname, '..', 'data'));

// ---------- Seed content ----------
const SEED_EVENTS = [
  ['ai-summit', 'AI & Innovation Summit', 'A session on emerging technologies and creative innovation.', '2026-11-12', '10:00', 'Main Auditorium', 250],
  ['hackathon', 'Campus Hackathon 2026', 'A 24-hour build challenge to solve real-world problems.', '2026-11-18', '09:00', 'Innovation Lab, Block C', 120],
  ['cultural-fest', 'Cultural Connect Fest', 'A celebration of creativity, performance and campus culture.', '2026-11-25', '16:00', 'Central Lawn', 500],
];

const SEED_CLUBS = [
  ['code-crafters', 'Code Crafters', 'Technical', 'Weekly coding nights, DSA practice and open-source sprints.', 'Wed · 6:00 PM · Lab 2', 142],
  ['robotics', 'Robotics Society', 'Technical', 'Build and race robots, from line followers to drones.', 'Sat · 11:00 AM · Workshop B', 86],
  ['ai-data', 'AI & Data Science Circle', 'Technical', 'Paper readings, Kaggle teams and hands-on ML workshops.', 'Thu · 5:30 PM · Seminar Hall 1', 118],
  ['stagecraft', 'Stagecraft Theatre', 'Cultural', 'Street plays, stage productions and improv nights.', 'Tue · 6:30 PM · Open Air Theatre', 64],
  ['rhythm', 'Rhythm Music Club', 'Cultural', 'Bands, jam sessions and the annual unplugged night.', 'Fri · 6:00 PM · Music Room', 97],
  ['nritya', 'Nritya Dance Crew', 'Cultural', 'Classical, folk and hip-hop. All levels welcome.', 'Mon & Thu · 7:00 PM · Dance Studio', 75],
  ['lens-light', 'Lens & Light Photography', 'Arts', 'Photo walks, editing workshops and campus exhibitions.', 'Sun · 7:00 AM · Main Gate', 58],
  ['debate-mun', 'Debate & MUN Society', 'Arts', 'Parliamentary debate, MUN conferences and public speaking.', 'Wed · 5:00 PM · Room 204', 71],
  ['athletics', 'Athletics & Fitness Club', 'Sports', 'Morning runs, track training and inter-college meets.', 'Daily · 6:00 AM · Sports Complex', 133],
  ['esports', 'E-Sports League', 'Sports', 'Competitive gaming teams and campus tournaments.', 'Sat · 4:00 PM · Gaming Lounge', 104],
  ['green-campus', 'Green Campus Volunteers', 'Social', 'Tree drives, waste audits and community outreach.', 'Sun · 9:00 AM · Student Centre', 89],
  ['e-cell', 'E-Cell Entrepreneurship', 'Professional', 'Startup talks, pitch nights and founder mentorship.', 'Fri · 5:00 PM · Incubation Centre', 92],
];

const SEED_NOTICES = [
  ['Mid-semester exam timetable released', 'The timetable for mid-semester exams (24 Nov – 2 Dec) is now on the academic portal. Check your hall and seat number a day before each paper.', 'Exams', 1, '2026-11-03T09:00:00.000Z'],
  ['Library open until midnight during exams', 'From 20 Nov to 2 Dec the central library reading halls stay open until 12:00 AM. Carry your ID card after 8 PM.', 'Library', 0, '2026-11-02T11:30:00.000Z'],
  ['Hostel fee deadline: 20 November', 'Second-semester hostel fees are due by 20 Nov. A late fee applies after the deadline. Pay through the fees portal or at the accounts office.', 'Deadlines', 1, '2026-11-01T08:00:00.000Z'],
  ['Campus closed on 15 November', 'The campus will remain closed on 15 Nov for Founders’ Day. The library and canteen will run on weekend hours.', 'Holidays', 0, '2026-10-30T10:00:00.000Z'],
];

// ---------- Schema ----------
function ddl(kind) {
  const ID = kind === 'pg' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  return `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      starts_on TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 200
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id ${ID}, ref TEXT NOT NULL UNIQUE, name TEXT NOT NULL, reg_no TEXT NOT NULL, email TEXT NOT NULL,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, UNIQUE (reg_no, event_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id ${ID}, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL, body TEXT NOT NULL,
      handled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notices (
      id ${ID}, title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
      meets TEXT NOT NULL, base_members INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS club_requests (
      id ${ID}, club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      name TEXT NOT NULL, reg_no TEXT NOT NULL, email TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, UNIQUE (club_id, reg_no)
    );
    CREATE TABLE IF NOT EXISTS lost_items (
      id ${ID}, ref TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      location TEXT NOT NULL, happened_on TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lost_replies (
      id ${ID}, item_id INTEGER NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
      name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id ${ID}, ref TEXT NOT NULL UNIQUE, name TEXT NOT NULL, reg_no TEXT NOT NULL, email TEXT NOT NULL,
      category TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );`;
}

// Columns added after the first release; added in place on older databases.
const ADDED_COLUMNS = [
  ['events', 'start_time', "TEXT NOT NULL DEFAULT '10:00'"],
  ['events', 'venue', "TEXT NOT NULL DEFAULT 'Main Campus'"],
];

function sqliteStore() {
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, 'campus.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return {
    kind: 'sqlite',
    temporary: ON_VERCEL,
    async exec(sql) { db.exec(sql); },
    async all(sql, params = []) { return db.prepare(sql).all(...params); },
    async get(sql, params = []) { return db.prepare(sql).get(...params); },
    async run(sql, params = []) { const r = db.prepare(sql).run(...params); return { changes: Number(r.changes) }; },
    async columns(table) { return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name); },
    isUniqueError: (err) => /UNIQUE constraint failed/.test(err.message),
  };
}

function pgStore() {
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL;
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new Pool({ connectionString: url, max: 5, ssl: local || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false } });
  const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => '$' + ++i); };
  return {
    kind: 'postgres',
    temporary: false,
    async exec(sql) { await pool.query(sql); },
    async all(sql, params = []) { return (await pool.query(toPg(sql), params)).rows; },
    async get(sql, params = []) { return (await pool.query(toPg(sql), params)).rows[0]; },
    async run(sql, params = []) { return { changes: (await pool.query(toPg(sql), params)).rowCount }; },
    async columns(table) {
      return (await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', [table])).rows.map((r) => r.column_name);
    },
    isUniqueError: (err) => err.code === '23505',
  };
}

async function count(store, table) {
  return Number((await store.get(`SELECT CAST(COUNT(*) AS INTEGER) AS n FROM ${table}`)).n);
}

async function migrate(store) {
  await store.exec(ddl(store.kind === 'postgres' ? 'pg' : 'sqlite'));
  for (const [table, col, def] of ADDED_COLUMNS) {
    if (!(await store.columns(table)).includes(col)) await store.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }

  if ((await count(store, 'events')) === 0) {
    for (const e of SEED_EVENTS) {
      await store.run('INSERT INTO events (id, title, description, starts_on, start_time, venue, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)', e);
    }
  } else {
    // Fill in the new columns for the original events on databases created before they existed.
    for (const [id, , , , time, venue] of SEED_EVENTS) {
      await store.run("UPDATE events SET start_time = ?, venue = ? WHERE id = ? AND venue = 'Main Campus'", [time, venue, id]);
    }
  }
  if ((await count(store, 'clubs')) === 0) {
    for (const c of SEED_CLUBS) await store.run('INSERT INTO clubs (id, name, category, description, meets, base_members) VALUES (?, ?, ?, ?, ?, ?)', c);
  }
  if ((await count(store, 'notices')) === 0) {
    for (const n of SEED_NOTICES) await store.run('INSERT INTO notices (title, body, category, pinned, created_at) VALUES (?, ?, ?, ?, ?)', n);
  }
}

let ready = null;
function getStore() {
  if (!ready) {
    ready = (async () => {
      const store = process.env.DATABASE_URL ? pgStore() : sqliteStore();
      await migrate(store);
      if (store.temporary) console.warn('[campus-connect] No DATABASE_URL: using temporary SQLite in /tmp. Data will be lost.');
      return store;
    })().catch((err) => { ready = null; throw err; });
  }
  return ready;
}

module.exports = { getStore, DATA_DIR, ON_VERCEL };
