# Campus Connect 360

Campus services, upcoming events and event registration. A single Node server with no dependencies (Node 22.5+, uses the built-in `node:sqlite`).

## Run

```bash
npm start        # http://localhost:3300
npm run dev      # same, restarts on file changes
```

- Site: `/`
- Organizer page: `/admin` (see every registration, filter by event, export CSV, remove entries)

## Data

- Database: `data/campus.db` (SQLite, created on first run and seeded with the three events)
- Organizer key: set `ADMIN_KEY` in the environment. Without it, a key is generated once and saved to `data/admin-key.txt`.
- `data/` is git-ignored. Back it up, since it holds every registration.

To add or change events, edit the `events` table (for example with `sqlite3 data/campus.db`) or the seed list in `server.js` before the first run.

## Environment

| Variable    | Default    | Purpose                          |
|-------------|------------|----------------------------------|
| `PORT`      | `3300`     | Port to listen on                |
| `ADMIN_KEY` | generated  | Organizer key for `/admin`       |
| `DATA_DIR`  | `./data`   | Where the database and key live  |

## API

| Method | Path                                  | Auth      |
|--------|---------------------------------------|-----------|
| GET    | `/api/events`                         | public    |
| GET    | `/api/stats`                          | public    |
| POST   | `/api/registrations`                  | public    |
| GET    | `/api/admin/registrations?event=`     | organizer |
| GET    | `/api/admin/registrations.csv?event=` | organizer |
| DELETE | `/api/admin/registrations/:id`        | organizer |

Organizer routes take `Authorization: Bearer <ADMIN_KEY>`.

## Deploying

Any host that runs a long-lived Node process with a persistent disk works (Render, Railway, Fly.io, a VPS). Set `ADMIN_KEY`, and point `DATA_DIR` at the persistent volume. Serverless hosts without a disk (Vercel, Netlify) will lose the SQLite file.
