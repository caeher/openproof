# Staging Runbook

This runbook prepares a local staging-shaped environment using:

- `APP_ENV=staging`
- Blink staging GraphQL at `https://api.staging.blink.sv/graphql`
- local Postgres from `dev/docker-compose.yml`

## Prerequisites

- Docker Desktop running
- Rust toolchain available locally
- Node.js available locally for the client
- A Blink staging API key from `https://dashboard.staging.blink.sv`

## 1. Start Postgres

```powershell
docker compose -f dev/docker-compose.yml up -d postgres
```

## 2. Start the API in staging mode

Provide env vars through the current shell or an env file.

Recommended env values are in `dev/staging.env.example`.

```powershell
powershell -ExecutionPolicy Bypass -File dev/start-staging-api.ps1 -EnvFile .env.staging
```

Important staging values:

- `APP_ENV=staging`
- `BLINK_API_URL=https://api.staging.blink.sv/graphql`
- `BLINK_API_KEY=<your staging key>`
- `DATABASE_URL=postgres://openproof:openproof@localhost:5432/openproof`

## 3. Start the client against the local API

From `apps/client`:

```powershell
$env:BACKEND_URL="http://127.0.0.1:3001"
npm run dev
```

## 4. Run the smoke flow

The smoke script exercises:

1. health check
2. public billing packages
3. signup
4. verify email using the dev token
5. login
6. create Blink USD invoice
7. reconcile until paid
8. register one document using the credited balance

```powershell
powershell -ExecutionPolicy Bypass -File dev/invoke-staging-smoke.ps1
```

The script will print the Blink invoice and poll until the invoice becomes `paid`.

## 5. Expected result

On success the smoke script ends with:

- a paid payment intent
- a successful document registration
- a new document ID and current status

## Notes

- Keep `EXPOSE_DEV_AUTH_TOKENS=true` during this staging smoke flow so the script can verify the test user without a mailbox.
- If `BLINK_API_KEY` is empty, the API still starts but billing invoice creation returns `503` because Blink billing is not configured.
- Blink staging uses signet, so this flow is safe for non-production payment testing.