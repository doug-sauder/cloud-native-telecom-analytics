# Docker Compose Design

In phase 0, Docker Compose creates a complete, repeatable local environment where data flows from your generator into Postgres and becomes visible in Grafana.
It orchestrates four services and their wiring, with one replica of each service.

## Services

### 1 Postgres service

* The service name is `postgres`
* Compose starts a single container instance, generated from the official `postgres` image
  - the image is hosted in GitHub at this location: https://github.com/docker-library/postgres
  - the image is pinned at version 18 (`postgres:18`)
* Compose creates database environment variables
  - database
  - user
  - password
* Compose initializes the database schema on first startup by mounting SQL into:
  - `/docker-entrypoint-initdb.d/`
* Compose implements a volume for persistent data
  - The name of the volume is `pgdata`

Outcome: when the stack comes up the first time, `pm_events` (and any views) already exist.

### 2 Ingestion service

Compose shall:

* Build the ingestion service image from `services/ingest/`
* Provide connection settings via environment variables:
  - host = `postgres` (the service name)
  - port = `5432`
  - user/password/db
* Ensure it waits until Postgres is ready before starting (best practice):
  - implement a Postgres **healthcheck** on the DB service
  - have ingest depend on Postgres being healthy (`depends_on` with condition)

Outcome: your ingest service starts reliably without “connection refused” races.

### 3 Event generator service

Compose shall:

* Build the generator image from `services/pmgen/`
* Provide environment variables telling it where to send events:
  - ingest URL = `http://ingest:3000/v1/events/pm` (example)
* Optionally make the interval configurable (e.g., `EMIT_INTERVAL_MS=5000`)

Outcome: events begin flowing automatically when the stack is up.


### 4 Grafana service

Compose shall:

* Run `grafana/grafana:<pinned version>`
* Expose Grafana to your host browser (e.g., `localhost:3001`)
* Connect Grafana to Postgres as a datasource

You have two choices:

**A. Manual setup (simpler initially)**

* Start Grafana and log in
* Add Postgres datasource via UI
* Import dashboard JSON via UI

**B. Provisioned setup (recommended for reproducibility)**

* Mount provisioning files into Grafana so datasource and dashboards appear automatically:

  * datasource YAML
  * dashboards YAML + JSON

Outcome: “one command to a working dashboard” becomes true.


## Networking

Docker Compose automatically creates a private network. Your YAML should rely on that:

* `postgres` is reachable from `ingest` at hostname `postgres`
* `ingest` is reachable from `pmgen` at hostname `ingest`
* Grafana can reach Postgres at hostname `postgres`

You generally do *not* need to expose Postgres to your Mac (`ports: 5432:5432`) unless you want to connect with a local SQL client.


## Ports

Expose only what you need from the host perspective:

* Ingest API: `localhost:3000` (optional; useful for curl testing)
* Grafana: `localhost:3001` (required to view dashboard)
* Postgres: usually **not exposed** (optional)


## Persistence

Use named volumes for:

* Postgres data directory
* Grafana storage (optional but convenient)

This prevents losing state every time you stop the stack.


## A good Phase 0 `docker-compose.yml` behaves like this

1. You run: `docker compose up --build`
2. Postgres starts and becomes healthy.
3. Postgres initializes schema from your mounted SQL (first run only).
4. Ingest service starts and connects to Postgres.
5. Generator starts and begins posting PM events.
6. Grafana starts; you open `http://localhost:3001` and see data.


## Common mistakes to avoid (these are important)

* Using `localhost` from one container to reach another (wrong): use service names.
* Not pinning image versions (`latest` introduces drift).
* Forgetting DB init scripts only run on first initialization (when the data volume is empty).
* Expecting `depends_on` alone to guarantee readiness (it doesn’t unless you use healthchecks + conditions, or implement retries in the app).

---

If you build it and it doesn’t work on the first try, paste your `docker-compose.yml` (and the service port numbers you chose) and I’ll do a precise review and correction.
