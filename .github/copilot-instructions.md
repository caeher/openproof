# Copilot Instructions - OpenProof

These instructions are specific to the OpenProof monorepo. Prefer them over generic architecture advice.

## Repository Overview

OpenProof is a document notarization platform with three main runtime surfaces:

- `openproof/api-server/`: Rust HTTP API built with Axum and backed by PostgreSQL.
- `apps/client/`: public-facing Next.js client application.
- `apps/admin/`: internal Next.js admin console.

Supporting crates and modules:

- `core/document/`: document domain models and public events.
- `core/notarization/`: Bitcoin notarization primitives and contracts.
- `lib/bitcoin-rpc/`: Bitcoin Core JSON-RPC adapter.
- `lib/authz/`: authorization traits and role helpers used by the API.
- `openproof/app/`: application services, SQLx migrations, and background workers.

## Architecture Rules

- Keep domain logic in `core/` and infrastructure adapters in `lib/`.
- Keep HTTP transport, route wiring, and request/response concerns in `openproof/api-server/`.
- New SQL migrations belong in `openproof/app/migrations/`.
- Prefer extending existing service or handler modules before creating new top-level abstractions.
- Avoid introducing framework-heavy patterns that do not match the current codebase.

## Backend Conventions

- Use `thiserror` for module errors and prefer `?` over manual `map_err` when a `From` conversion already exists.
- Keep JSON field naming consistent with the existing API contracts, which use `camelCase` responses.
- Prefer `sqlx::query!` or the existing SQLx patterns already used in the repository.
- The API boots background workers and Bitcoin wallet checks in `openproof/api-server/src/main.rs`; startup changes must preserve that sequence.
- Bitcoin RPC is external to Docker Compose. Changes that touch wallet bootstrap or RPC configuration must remain compatible with remote HTTPS endpoints.

## Frontend Conventions

- Both Next.js apps use the App Router and `output: 'standalone'`.
- `apps/client` proxies `/api/v1/*` to the Rust API through rewrites in `next.config.mjs`.
- `apps/admin` also proxies `/api/v1/*` to the Rust API and runs on container port `3000`, even when the host publishes it on a different port.
- Keep imports in Next.js apps using the `@/` alias.
- Follow the existing visual language inside each app instead of introducing a new design system.

## Docker And Local Development

- The root `docker-compose.yml` is the source of truth for local full-stack startup.
- Container ports are fixed: Postgres `5432`, API `3001`, Client `3000`, Admin `3000`.
- Host ports must stay configurable through environment variables because local machines may already have those ports in use.
- For the admin app, the correct mapping is host `ADMIN_PORT` to container `3000`.
- If you change Docker networking or port behavior, update `README.md`, `.env.example`, and compose comments in the same change.

## Validation Expectations

- For backend dependency or Rust code changes, prefer `cargo check -p openproof-api-server`.
- For compose changes, validate with `docker compose config` before considering the task complete.
- For client app changes, `pnpm build` from `apps/client` is the preferred validation command.
- For admin app changes, use `pnpm build` from `apps/admin` when the change affects the app itself.

## Documentation Expectations

- Keep user-facing docs in English unless the user explicitly requests another language.
- When deployment or onboarding behavior changes, update `README.md` in the same task.
- Prefer practical project-specific instructions over broad best-practice essays.