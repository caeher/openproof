# OpenProof

OpenProof is a full-stack document notarization platform built around a Rust API, PostgreSQL, and two Next.js applications:

- `apps/client`: public product UI for accounts, billing, document registration, verification, and developer access.
- `apps/admin`: admin console for operational and billing workflows.
- `openproof/api-server`: Axum-based API that coordinates persistence, Bitcoin anchoring, email delivery, billing, and background workers.

## Repository Layout

```text
apps/
  admin/          Next.js admin console
  client/         Next.js customer-facing app
core/
  document/       Document domain types and events
  notarization/   Bitcoin notarization primitives
lib/
  authz/          Authorization contracts
  bitcoin-rpc/    Bitcoin Core JSON-RPC adapter
openproof/
  api-server/     Rust HTTP API
  app/            Application services and SQLx migrations
dev/              Local and staging helper scripts
```

## Prerequisites

- Docker Desktop with Compose support
- Rust toolchain for local backend development
- Node.js 22+ and `pnpm` for local frontend development
- Access to a Bitcoin Core RPC endpoint

## Environment Configuration

Copy the example environment file and adjust the values for your environment.

```bash
cp .env.example .env
```

Important variables:

- `BITCOIN_RPC_URL`, `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`, `BITCOIN_RPC_WALLET`: external Bitcoin Core RPC connection used by the API on startup.
- `BLINK_API_URL`, `BLINK_API_KEY`, `BLINK_WEBHOOK_SECRET`: optional Blink billing integration. The webhook route exposed by the API is `/api/v1/billing/blink/webhook` on the same public origin that fronts `/api/v1/*`.
- `APP_BASE_URL`: public browser URL used by links and email flows. In Docker Compose, the API receives this value explicitly; if you do not set it, Compose derives it from `CLIENT_PORT` for local development.
- `POSTGRES_PORT`, `API_PORT`, `CLIENT_PORT`, `ADMIN_PORT`: optional host port overrides for Docker Compose.
- `SMTP_*`: SMTP delivery settings. In development, leaving `SMTP_HOST` empty falls back to the tracing mailer.

## Run With Docker Compose

From the repository root:

```bash
docker compose up --build
```

Default host endpoints:

- Client: `http://localhost:3000`
- API: `http://localhost:3001`
- Admin: `http://localhost:3002`
- Postgres: `localhost:5432`

If one of those host ports is already in use, override it at startup:

```bash
CLIENT_PORT=3010 API_PORT=3011 ADMIN_PORT=3012 docker compose up --build
```

Notes:

- The client container listens on port `3000`.
- The admin container listens on port `3002`.
- The API container listens on port `3001`.
- Bitcoin Core is not part of this compose stack. The API connects to an external RPC endpoint.

## Run Locally Without Docker For Frontends

Start the API and database first, then run each app in its own shell.

Client:

```bash
cd apps/client
pnpm install
pnpm build
pnpm start
```

Admin:

```bash
cd apps/admin
pnpm install
pnpm build
pnpm start -- --port 3002
```

For local admin development, set `BACKEND_URL` in `apps/admin/.env` to the API origin, for example `http://127.0.0.1:3001`. If you pass a raw listen address like `0.0.0.0:3001`, the admin normalizes it to a usable local URL before creating rewrite targets.

Backend:

```bash
cargo check -p openproof-api-server
cargo run -p openproof-api-server
```

## Deployment Notes

### Containers

- Build the API from the repository root with `Dockerfile`.
- Build the Next.js apps from `apps/client/Dockerfile` and `apps/admin/Dockerfile`.
- Keep the API behind a reverse proxy or load balancer that exposes the public URLs used in `APP_BASE_URL`.
- The API image is optimized for BuildKit caches and constrained builders. On Coolify or similar hosts, keep layer cache enabled and expect the first cold Rust build to be slower than subsequent deployments.

### Required External Services

- PostgreSQL
- Bitcoin Core RPC endpoint
- Optional SMTP server
- Optional Blink credentials for billing flows

### Runtime Checklist

- Provide valid Bitcoin RPC credentials before starting the API.
- Ensure the published frontend URLs match the `APP_BASE_URL` used by the API.
- Set `SECURE_COOKIES=true` when running behind HTTPS in non-development environments.
- Review CORS and proxy behavior if you publish the API and frontend under different origins.
- For Coolify deployments, give the API builder enough memory for a Rust release build; the Dockerfile now limits cargo parallelism to reduce peak usage on small hosts.

## Collaboration Guide

### Branching And Changes

- Keep changes scoped to a single concern whenever possible.
- Do not mix unrelated frontend redesigns, backend logic changes, and infrastructure changes in the same pull request.
- Update documentation when changing environment variables, ports, startup behavior, or deployment assumptions.

### Validation Before Opening A Pull Request

- Run `cargo check -p openproof-api-server` for backend changes.
- Run `docker compose config` for compose changes.
- Run `pnpm build` in `apps/client` for client changes.
- Run `pnpm build` in `apps/admin` for admin changes.

### Review Expectations

- Call out any required environment variables in the pull request description.
- Mention database migrations explicitly when they are part of the change.
- Include reproduction steps for Docker, port, or deployment fixes.

## Troubleshooting

### Bitcoin RPC HTTPS Error

If the API exits with a message similar to `request url contains https:// but the https feature is not enabled`, rebuild the API image after updating dependencies:

```bash
docker compose build api
docker compose up
```

### Port Already In Use

If Docker reports that a port is unavailable, either stop the conflicting process or override the published port:

```bash
ADMIN_PORT=3012 docker compose up --build
```

### Admin Not Reachable Through Docker

The admin container listens internally on port `3002`. The compose file must publish `ADMIN_PORT:3002`.