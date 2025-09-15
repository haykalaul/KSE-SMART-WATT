# Deployment guide (Postgres, Redis, and systemd service)

This file shows how to run Postgres and Redis with Docker Compose, and how to deploy the Go server as a systemd service on a Linux server.

## 1) Run Postgres & Redis with Docker Compose

From the `server/` directory there is a `docker-compose.yml` that starts Postgres and Redis.

1. Create a `.env` file in `server/` or export the variables used by the compose file (DB_USER, DB_PASSWORD, DB_NAME).
2. Start the services:

```sh
cd server
docker compose up -d
```

The compose file mounts `init_db.sql` to `docker-entrypoint-initdb.d` so the DB/user will be created on first startup.

Check containers:

```sh
docker ps
docker compose logs -f postgres
```

## 2) Build & install the Go binary

On the server (example):

```sh
# clone or copy repo
git clone <repo-url>
cd KSE\ SMART\ WATT/server

# build static linux binary (amd64 example)
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /opt/kse-smart-watt/kse-smart-watt ./cmd

# create a service user and set ownership (optional but recommended)
sudo useradd -r -s /bin/false kse
sudo mkdir -p /opt/kse-smart-watt
sudo chown -R kse:kse /opt/kse-smart-watt
```

## 3) Systemd unit and environment

An example systemd unit is provided at `server/deploy/kse-smart-watt.service` and an env example at `server/deploy/kse-smart-watt.env.example`.

Copy them to the server and enable:

```sh
sudo cp server/deploy/kse-smart-watt.env.example /etc/kse-smart-watt/kse-smart-watt.env
sudo edit /etc/kse-smart-watt/kse-smart-watt.env # set real values (DATABASE_URL, secrets)

sudo cp server/deploy/kse-smart-watt.service /etc/systemd/system/kse-smart-watt.service
sudo systemctl daemon-reload
sudo systemctl enable kse-smart-watt.service
sudo systemctl start kse-smart-watt.service
sudo journalctl -u kse-smart-watt -f
```

Notes:
- Ensure `/etc/kse-smart-watt/kse-smart-watt.env` is readable by the service user and contains secrets.
- The unit file expects the binary at `/opt/kse-smart-watt/kse-smart-watt`.

## 4) Reverse proxy and TLS

- Use nginx or Caddy as a reverse proxy to provide TLS (Let’s Encrypt) and optional basic auth.

## 5) Troubleshooting

- If the service fails to start, check `journalctl -u kse-smart-watt` and service logs.
- To test DB connectivity locally:

```sh
psql "$DATABASE_URL"
```
