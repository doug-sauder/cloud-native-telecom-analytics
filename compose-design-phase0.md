# Docker Compose Design

Your `docker-compose.yml` for Phase 0 should do one job: **stand up a complete, repeatable local environment** where data flows from your generator into Postgres and becomes visible in Grafana—with one command.

Conceptually, it should orchestrate four containers and their wiring.

---

## What `docker-compose.yml` should accomplish

### 1) Start the database (Postgres) with your schema already loaded

The Compose file should:

* Run the official `postgres:<pinned version>` image (e.g., `postgres:16`)
* Create a database/user via environment variables (e.g., `telecom`)
* Persist data in a named volume (so restarts don’t wipe it)
* Initialize schema on first startup by mounting your SQL into:

  * `/docker-entrypoint-initdb.d/`

Outcome: when the stack comes up the first time, `pm_events` (and any views) already exist.

---

### 2) Start the ingestion service and connect it to Postgres

Compose should:

* Build the ingestion service image from `services/ingest/`
* Provide connection settings via environment variables:

  * host = `postgres` (the service name)
  * port = `5432`
  * user/password/db
* Ensure it waits until Postgres is ready before starting (best practice):

  * implement a Postgres **healthcheck** on the DB service
  * have ingest depend on Postgres being healthy (`depends_on` with condition)

Outcome: your ingest service starts reliably without “connection refused” races.

---

### 3) Start the generator and point it at the ingest endpoint

Compose should:

* Build the generator image from `services/pmgen/` (if you’re doing generator in Phase 0)
* Provide environment variables telling it where to send events:

  * ingest URL = `http://ingest:3000/v1/events/pm` (example)
* Optionally make the interval configurable (e.g., `EMIT_INTERVAL_MS=5000`)

Outcome: events begin flowing automatically when the stack is up.

---

### 4) Start Grafana and make it easy to see KPIs

Compose should:

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

---

## Networking: what Compose should implicitly provide

Docker Compose automatically creates a private network. Your YAML should rely on that:

* `postgres` is reachable from `ingest` at hostname `postgres`
* `ingest` is reachable from `pmgen` at hostname `ingest`
* Grafana can reach Postgres at hostname `postgres`

You generally do *not* need to expose Postgres to your Mac (`ports: 5432:5432`) unless you want to connect with a local SQL client.

---

## Ports: what should be exposed to your Mac

Expose only what you need from the host perspective:

* Ingest API: `localhost:3000` (optional; useful for curl testing)
* Grafana: `localhost:3001` (required to view dashboard)
* Postgres: usually **not exposed** (optional)

---

## Persistence: what should survive restarts

Use named volumes for:

* Postgres data directory
* Grafana storage (optional but convenient)

This prevents losing state every time you stop the stack.

---

## A good Phase 0 `docker-compose.yml` behaves like this

1. You run: `docker compose up --build`
2. Postgres starts and becomes healthy.
3. Postgres initializes schema from your mounted SQL (first run only).
4. Ingest service starts and connects to Postgres.
5. Generator starts and begins posting PM events.
6. Grafana starts; you open `http://localhost:3001` and see data.

---

## Common mistakes to avoid (these are important)

* Using `localhost` from one container to reach another (wrong): use service names.
* Not pinning image versions (`latest` introduces drift).
* Forgetting DB init scripts only run on first initialization (when the data volume is empty).
* Expecting `depends_on` alone to guarantee readiness (it doesn’t unless you use healthchecks + conditions, or implement retries in the app).

---

If you build it and it doesn’t work on the first try, paste your `docker-compose.yml` (and the service port numbers you chose) and I’ll do a precise review and correction.
