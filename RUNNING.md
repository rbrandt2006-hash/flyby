# Flyby AI — How to Run It Locally

Flyby AI is corporate travel management: it plans trips, tracks spend against
policy, and keeps the conversation around a trip in one place.

It's two apps that talk to each other:

| Part     | Tech                        | Folder                    | Port |
| -------- | --------------------------- | ------------------------- | ---- |
| Backend  | Flask + SQLAlchemy + SQLite | `/Users/ahaan/flyby_ai`   | 8659 |
| Frontend | React + Vite + TypeScript   | `/Users/ahaan/flyby`      | 8080 |

The frontend talks to the backend through `src/integrations/backend/client.ts`.
In development the Vite dev server proxies `/api`, `/auth`, `/rest`,
`/functions` and `/storage` to `http://localhost:8659`, so the browser is
same-origin and there's no CORS to set up.

---

## 0. Prerequisites (install once)

- **Python 3.10+** → check with `python3 --version`
- **Node 18+** and **npm** → check with `node -v` and `npm -v`

---

## 1. Start the Backend (port 8659)

```bash
cd /Users/ahaan/flyby_ai

# First time only: create the virtual environment + install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Every time: start the API
python main.py
```

You should see:

```
  Flyby AI backend  ->  http://localhost:8659

 * Running on http://127.0.0.1:8659
```

Leave this terminal running.

> After the first setup, starting the backend is just:
> ```bash
> cd /Users/ahaan/flyby_ai && source venv/bin/activate && python main.py
> ```

---

## 2. Start the Frontend (port 8080)

Open a **second** terminal:

```bash
cd /Users/ahaan/flyby

# First time only: install dependencies
make install

# Every time: start the app
make
```

You should see:

```
  ➜  Local:   http://localhost:8080/
```

---

## 3. Open the App

Go to **http://localhost:8080**.

Sign in with a seeded account, or create your own:

| Email            | Password     | What you get                              |
| ---------------- | ------------ | ----------------------------------------- |
| `demo@flyby.ai`  | `Flyby!2024` | A normal traveler                         |
| `admin@flyby.ai` | `Flyby!2024` | Admin — also unlocks `/admin` and console |

Signing up with a **work email** puts you in the workspace for your email
domain, so everyone at `@acme.com` shares one company. A personal address
(gmail, outlook, …) creates a solo account instead.

---

## Run BOTH with one command

From the frontend folder:

```bash
cd /Users/ahaan/flyby
make install     # first time only — installs frontend AND backend
make run         # starts the backend AND the frontend
```

Press `Ctrl+C` to stop both.

---

## All `make` commands (run from `/Users/ahaan/flyby`)

```bash
make            # start the frontend dev server (:8080)
make install    # install frontend + backend dependencies
make run        # start backend AND frontend together
make backend    # start only the Flask backend (:8659)
make build      # production build of the frontend
make seed       # create backend tables and seed demo accounts
make health     # check the backend is responding
make stop       # free ports 8659 and 8080
make help       # list all commands
```

---

## What's stored where

Everything the app used to keep only in the browser now lives in the backend
database, so it follows you across devices and browsers:

| Feature                | Endpoint                | Table              |
| ---------------------- | ----------------------- | ------------------ |
| Trips                  | `/api/trips`            | `trips`            |
| Expenses               | `/api/expenses`         | `expenses`         |
| Conversations          | `/api/chats`            | `chats`            |
| Notifications          | `/api/notifications`    | `notifications`    |
| Itineraries            | `/api/itineraries`      | `itineraries`      |
| Traveler preferences   | `/api/preferences`      | `travel_preferences` |
| Client companies       | `/api/client-companies` | `client_companies` |
| Profile, settings, 2FA | `/rest/v1/profiles`     | `profiles`         |
| Roles and permissions  | `/rest/v1/user_roles`   | `user_roles`       |

`localStorage` is still used, but only as a cache so the first paint is instant.
The server is the source of truth.

---

## Configuration

**Backend** — `/Users/ahaan/flyby_ai/.env` (see `.env.example`)

```
SECRET_KEY=<change before deploying>
FLASK_PORT=8659
ADMIN_PASSWORD=Flyby!2024
DEFAULT_PASSWORD=Flyby!2024
```

**Frontend** — `/Users/ahaan/flyby/.env`

```
VITE_API_URL=""     # leave blank for local dev (the Vite proxy handles it)
```

### Optional integrations

Both degrade gracefully — the app works fully without them:

- **`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`** — real
  SMS for two-step verification. Without them the verification code is printed
  to the **backend terminal**, so you can still test the whole 2FA flow.
- **`OPENAI_API_KEY`** — voice transcription. Without it, dictation tells you a
  key is needed instead of failing quietly.

---

## Troubleshooting

**`Address already in use` / `Port 8659 is in use`**

```bash
lsof -ti tcp:8659 | xargs kill -9      # backend
lsof -ti tcp:8080 | xargs kill -9      # frontend
# or, from the frontend folder:
make stop
```

**The app loads but nothing saves / you get signed out**
The backend isn't running. Start it (Step 1) and confirm:

```bash
curl http://localhost:8659/health
```

**`attempt to write a readonly database`**
An old backend process is still holding the database. Kill it by port
(`make stop`) rather than by name, then restart.

**Want a clean slate**

```bash
cd /Users/ahaan/flyby_ai
rm -f instance/volumes/flyby.db
python main.py            # recreates the tables and seeded accounts
```

**`command not found: make`**
Install the Xcode command line tools: `xcode-select --install`
Or run the frontend directly: `npm install` then `npm run dev`.

---

## Quick health checks

```bash
# Is the backend up?
curl http://localhost:8659/health

# Sign in and get a token
curl -X POST 'http://localhost:8659/auth/v1/token?grant_type=password' \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@flyby.ai","password":"Flyby!2024"}'

# Search travel inventory
curl 'http://localhost:8659/functions/v1/search-travel?type=all&city=Austin'
```

---

## The backend console

**http://localhost:8659** shows service status, live database counts, and the
API surface. Signing in as `admin@flyby.ai` also unlocks **Accounts**, where you
can change roles, reset passwords and delete accounts.

It's the same user table as the app — one account, one password, both places.
