# Setup & Environment (server)

This file explains how to configure environment variables, set up PostgreSQL for local development, and configure the Hugging Face token used by the server.

1) .env (local development)

- Copy `server/.env.example` to `server/.env` and fill the values. Do NOT commit your real `.env` into Git.
- Important keys used by the server code:
  - MODE (development|production)
  - PORT
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  - (OR) DATABASE_URL — used when MODE=production
  - REDIS_URL
  - JWT_SECRET
  - FRONTEND_URL, PUBLIC_URL
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  - GEMINI_API_URL, GEMINI_API_KEY
  - HUGGINGFACE_API_TAPAS_URL, HUGGINGFACE_API_MARIANMT_URL, HUGGINGFACE_API_TOKEN

2) PostgreSQL local setup

Option A — Native install (psql/pgAdmin):

- Install Postgres for Windows: https://www.postgresql.org/download/windows/
- Open `psql` (or use pgAdmin). Example commands (run inside psql):

```
CREATE ROLE kse_user WITH LOGIN PASSWORD 'your_db_password';
CREATE DATABASE kse_smart_watt OWNER kse_user;
GRANT ALL PRIVILEGES ON DATABASE kse_smart_watt TO kse_user;
\c kse_smart_watt
```

Option B — Docker (recommended for 
reproducible dev):

```
docker run --name kse-postgres -e POSTGRES_USER=kse_user -e POSTGRES_PASSWORD=your_db_password -e POSTGRES_DB=kse_smart_watt -p 5432:5432 -d postgres:15
```

After this, set the corresponding DB_* vars in `server/.env`.

3) Production DATABASE_URL example

Set `MODE=production` and provide a `DATABASE_URL` such as:

```
postgres://<user>:<password>@<host>:5432/<dbname>?sslmode=require
```

4) Hugging Face and other AI tokens

The server makes inference calls to Hugging Face models (Tapas/MarianMT). Store the Hugging Face token in the server environment as `HUGGINGFACE_API_TOKEN`.

Get a token at: https://huggingface.co/settings/tokens

Important: never embed `HUGGINGFACE_API_TOKEN` in client-side bundles. Always call HF from the server or proxy requests through the server.

5) Client integration notes (React / Vite)

- The client reads Vite-prefixed env vars from `client/.env` (see `client/.env.example`).
- Set `VITE_BACKEND_URL` to your server address (e.g. `http://localhost:8080`).
- Do not put private tokens (Hugging Face, SMTP, JWT_SECRET) in client-side envs for production.

6) Run locally

Server:

```
cd server
# copy server/.env.example -> server/.env and edit
go run ./cmd
```

Client (from repo root):

```
cd client
# copy client/.env.example -> client/.env and edit
npm install
npm run dev
```

7) Additional tips

- The Go server uses GORM AutoMigrate on startup to create tables for `Appliance` and `Users`. For production, prefer explicit migrations.
- Use a secret manager in production environments and enable SSL connections for the DB.
