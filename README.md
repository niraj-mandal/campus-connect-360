# Campus Connect 360

One platform for campus services, events and student life. Plain HTML/CSS/JS pages served by a small Node server, with SQLite by default (Node 22.13+, uses the built-in `node:sqlite`; no packages to install).

## Run

```bash
npm start        # http://localhost:3300
npm run dev      # same, restarts on file changes
```

## What's in it

| Page | What students can do |
|------|----------------------|
| `/` Home | Campus services (tap for hours, contacts, map), upcoming events (details, register, add to calendar, share), latest notices, **Manage my registration** (look up / cancel with confirmation ID + email), FAQs, contact form |
| `/clubs` | Browse 12 clubs by category or search, send a join request |
| `/notices` | Official announcements, pinned first, filter and search |
| `/lost-found` | Report lost or found items, reply to a post without seeing the poster's email, manage your post (read replies, mark returned) with its post ID |
| `/help-desk` | Raise a ticket (hostel, IT, library, fees…), track it with the ticket ID and read replies |
| `/campus` | LPU campus map: interactive OpenStreetMap map with the real campus boundary and pins, Google Maps and satellite views, key facilities, facts about LPU, official contacts and how to reach Phagwara |
| `/admin` | Organizer dashboard (key required): registrations + CSV export, create/delete events, post/pin notices, approve club requests, moderate lost & found, update tickets with replies, read contact messages |

Every page has search (press `/`), dark mode, and a phone layout.

## LPU information

Campus Connect 360 is an independent student project for Lovely Professional University; it is not an official LPU site (the footer and campus page say so).

- Map pins and the campus outline come from OpenStreetMap (relation 21599790, ODbL). Only places that are mapped there get a pin; other facilities link to a Google Maps search. `public/data/lpu-boundary.json` is the boundary.
- Facts, contacts and travel distances on `/campus` come from LPU’s contact and visitor pages, Wikipedia, and news reports of the NAAC grade (sources are linked on the page). Re-check them on lpu.in before relying on them.
- The three starter events, the 12 clubs and the starter notices are sample content. Replace them from `/admin` (events, notices) or `lib/db.js` (clubs).

## Data

- Database: `data/campus.db` (SQLite, created on first run and seeded with 3 events, 12 clubs and 4 notices). Older databases are upgraded in place.
- Set `DATABASE_URL` to use Postgres instead (run `npm install` once for the `pg` driver).
- Organizer key: set `ADMIN_KEY`. Without it, a key is generated once and saved to `data/admin-key.txt`.
- `data/` is git-ignored. Back it up; it holds every registration, ticket and message.

| Variable       | Default   | Purpose                              |
|----------------|-----------|--------------------------------------|
| `PORT`         | `3300`    | Port to listen on                    |
| `ADMIN_KEY`    | generated | Organizer key for `/admin`           |
| `DATA_DIR`     | `./data`  | Where the SQLite file and key live   |
| `DATABASE_URL` | unset     | Postgres connection string (optional)|

## Code layout

- `dev-server.js`: serves `public/` with clean URLs and sends `/api/*` to the API
- `lib/app.js`: every API route, validation and organizer auth
- `lib/db.js`: schema, migrations, seed data, SQLite/Postgres adapters
- `api/index.js`: the same API wrapped as a serverless function (for a later Vercel setup)
- `public/common.js`: shared header, footer, search, popups, toasts and form helpers; one script per page

## API

Public: `GET /api/events | stats | notices | clubs | lost-found | health`, `POST /api/registrations`, `/api/registrations/lookup`, `/api/registrations/cancel`, `/api/messages`, `/api/clubs/:id/join`, `/api/lost-found`, `/api/lost-found/:ref/reply`, `/api/lost-found/manage`, `/api/lost-found/resolve`, `/api/tickets`, `/api/tickets/track`.

Organizer (`Authorization: Bearer <ADMIN_KEY>`): everything under `/api/admin/` (overview, registrations + CSV, events, notices, club-requests, lost-found, tickets, messages).

## Deploying to Vercel

`vercel.json` serves `public/` as static pages (clean URLs: `/clubs` → `clubs.html`) and rewrites every `/api/*` request to one function, `api/index.js`.

In the Vercel project, set two things, then redeploy:

1. **Database:** Storage → Create Database → Neon (Postgres) → connect it to this project. This adds `DATABASE_URL`. Tables and starter content are created on the first request.
2. **Organizer key:** Settings → Environment Variables → `ADMIN_KEY` = a long random string (for example the output of `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`).

Without `DATABASE_URL` the site still works but stores data in temporary storage that Vercel wipes; the organizer page shows a warning. Without `ADMIN_KEY` the organizer page is locked with a message saying so.

`GET /api/health` reports `storage` (`postgres` or `sqlite`), `temporary` and `admin` (whether a key is set) to check a deployment.

Other hosts with a persistent disk (Render, Railway, Fly.io, a VPS) work with `npm start`: set `ADMIN_KEY` and point `DATA_DIR` at the volume.
