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
| `/campus` | Interactive campus map and live opening hours ("open now / closes at…") |
| `/admin` | Organizer dashboard (key required): registrations + CSV export, create/delete events, post/pin notices, approve club requests, moderate lost & found, update tickets with replies, read contact messages |

Every page has search (press `/`), dark mode, and a phone layout.

## Data

- Database: `data/campus.db` (SQLite, created on first run and seeded with 3 events, 12 clubs and 4 notices). Older databases are upgraded in place.
- Set `DATABASE_URL` to use Postgres instead (needs `npm install pg`).
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

## Deploying

Not set up yet. Any host with a long-lived Node process and a persistent disk works as is (Render, Railway, Fly.io, a VPS): set `ADMIN_KEY` and point `DATA_DIR` at the volume. Serverless hosts (Vercel) need `DATABASE_URL` pointing at Postgres, because their disk is wiped.
