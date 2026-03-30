# Copilot Instructions — Architectural Standards & Coding Practices

> **Purpose**: This document abstracts the architectural patterns, coding standards, naming conventions, security measures, and design principles used in this repository. These are **domain-agnostic** guidelines that any LLM should follow when building robust, enterprise-grade applications. Apply these standards to any project regardless of industry.

---

## Table of Contents

1. [Folder Structure & Module Organization](#1-folder-structure--module-organization)
2. [Design Patterns](#2-design-patterns)
3. [Coding Standards & Conventions](#3-coding-standards--conventions)
4. [Naming Conventions](#4-naming-conventions)
5. [Security Measures](#5-security-measures)
6. [Error Handling](#6-error-handling)
7. [Testing Standards](#7-testing-standards)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Observability & Debugging](#9-observability--debugging)
10. [Dependency Management](#10-dependency-management)

---

## 1. Folder Structure & Module Organization

### 1.1 Monorepo Layout — Three-Layer Separation

Organize the codebase into clearly separated layers with strict dependency direction:

```
/core/          → Domain logic (business rules, entities, events)
/lib/           → Shared libraries & infrastructure adapters
/lana/          → Application layer (servers, CLI, orchestration)
/apps/          → Frontend applications (UI clients)
/dev/           → Development tooling, seed data, local configs
/bats/          → End-to-end integration tests
/dagster/       → Data pipelines (ETL/ELT)
/tf/            → Infrastructure as Code
/ci/            → CI/CD pipeline definitions
```

**Dependency rule**: `core/` can import `lib/`, `lana/` (application) can import `core/`. Never go backwards. This enforces a clean hexagonal architecture.

### 1.2 Domain Module Internal Structure

Each domain module (e.g., `core/credit/`, `core/customer/`) MUST follow this file convention:

| File | Purpose |
|------|---------|
| `mod.rs` | Public interface. Exposes the service struct and public types. Entry point for the module. |
| `entity.rs` | Event-sourced entity: defines the aggregate root, its events, and state transitions. **Private** — not exposed outside the module. |
| `repo.rs` | Repository implementation: persistence and retrieval of entities. Encapsulates all database access. |
| `error.rs` | Module-specific error types using `thiserror`. All errors for this module live here. |
| `primitives.rs` | Value objects, type-safe IDs, enums, and small domain types. Shared within the module and often publicly exported. |
| `publisher.rs` | Outbox event publisher. Responsible for emitting domain events for cross-module communication. |
| `job.rs` | Async background jobs (e.g., scheduled tasks, retries). |
| `public/` | **Subdirectory** containing public events that cross module boundaries. Only events in this folder are visible to other modules. |

**Example of a well-structured domain module:**

```
core/customer/src/
├── lib.rs              # Module exports, main service struct definition
├── error.rs            # CustomerError enum
├── primitives.rs       # CustomerId, CustomerType, CustomerStatus
├── kyc/
│   ├── mod.rs          # KYC sub-module interface
│   ├── entity.rs       # KYC entity with events
│   ├── repo.rs         # KYC repository
│   └── error.rs        # KYC-specific errors
├── party/
│   ├── mod.rs
│   ├── entity.rs
│   └── repo.rs
├── publisher.rs        # Publishes CoreCustomerEvent
└── public/
    ├── mod.rs
    └── events.rs       # CoreCustomerEvent (visible to other modules)
```

### 1.3 Nested Sub-Aggregates

Complex domain modules contain nested sub-aggregates, each with their own `entity.rs`, `repo.rs`, and `error.rs`. For example, a `credit_facility/` module may contain `interest_accrual_cycle/`, `disbursal/`, `collateral/` sub-modules — each following the same file convention.

### 1.4 Application Layer Structure

The application layer (`lana/`) acts as the **composition root** that wires together all core modules:

```
lana/
├── app/                # Main application — composes all modules
│   ├── src/lib.rs      # Type aliases, module re-exports, app initialization
│   └── migrations/     # Database migrations (single source of truth)
├── admin-server/       # Admin HTTP/GraphQL API server
│   └── src/graphql/    # Resolvers organized by domain
├── customer-server/    # Customer-facing API server
├── cli/                # Command-line interface
├── events/             # Cross-module event definitions
└── ids/                # Centralized ID type definitions
```

---

## 2. Design Patterns

### 2.1 Event Sourcing

**Core principle**: State is derived from an immutable sequence of events, not from mutable fields.

**Entity pattern:**
```rust
// entity.rs — Define events and the entity that replays them
#[derive(EsEvent, Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
#[es_event(id = "EntityId")]
pub enum MyEntityEvent {
    Initialized {
        id: EntityId,
        name: String,
        created_at: DateTime<Utc>,
    },
    StatusChanged {
        new_status: EntityStatus,
        changed_at: DateTime<Utc>,
    },
    Completed {},
}

#[derive(EsEntity, Builder)]
pub struct MyEntity {
    pub id: EntityId,
    pub name: String,
    pub status: EntityStatus,
    events: EntityEvents<MyEntityEvent>,
}
```

**Repository pattern:**
```rust
// repo.rs — Persistence via derive macros
#[derive(EsRepo)]
#[es_repo(
    entity = "MyEntity",
    columns(
        status(ty = "EntityStatus", list_for),
        name(ty = "String", list_by),
    ),
    tbl_prefix = "core",
    post_persist_hook = "publish_in_op"
)]
pub struct MyEntityRepo<E> where E: OutboxEventMarker<MyPublicEvent> {
    pool: PgPool,
    publisher: MyPublisher<E>,
    clock: ClockHandle,
}
```

**Key rules:**
- Events are immutable. Never modify past events.
- Entity state is rebuilt by replaying all events in order.
- The `events: EntityEvents<T>` field is always private.
- Use `#[serde(tag = "type", rename_all = "snake_case")]` on all event enums for consistent serialization.

### 2.2 CQRS (Command Query Responsibility Segregation)

Entity methods are split into two categories:

| Type | Signature | Returns | Purpose |
|------|-----------|---------|---------|
| **Command** | `&mut self` | `Idempotent<T>` or `Result<Idempotent<T>, E>` | Mutate state by appending events |
| **Query** | `&self` | Direct value, `Option<T>`, or `bool` | Read state. **NEVER returns `Result` or `Err`** |

```rust
impl MyEntity {
    // COMMAND — mutates state
    pub fn activate(&mut self) -> Result<Idempotent<()>, MyEntityError> {
        idempotency_guard!(self.status, EntityStatus::Active);
        // ... append event
        Ok(Idempotent::Executed(()))
    }

    // QUERY — reads state, never fails
    pub fn is_active(&self) -> bool {
        self.status == EntityStatus::Active
    }

    pub fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
}
```

### 2.3 Hexagonal Architecture (Ports & Adapters)

**Principle**: Domain logic depends on abstractions (traits), not concrete implementations.

**Service structs** are generic over their dependencies:

```rust
pub struct MyService<Perms, E>
where
    Perms: PermissionCheck,       // Authorization port
    E: OutboxEventMarker<MyEvent>, // Event publishing port
{
    repo: Arc<MyEntityRepo<E>>,
    authz: Arc<Perms>,
    ledger: Arc<dyn LedgerPort>,
    clock: ClockHandle,
}
```

**Dependency injection is done via constructor:**
```rust
impl<Perms, E> MyService<Perms, E>
where
    Perms: PermissionCheck,
    E: OutboxEventMarker<MyEvent>,
{
    pub async fn init(
        pool: &PgPool,
        authz: &Arc<Perms>,
        outbox: &Outbox<E>,
    ) -> Result<Self, MyError> {
        let repo = Arc::new(MyEntityRepo::new(pool, outbox).await?);
        Ok(Self { repo, authz: Arc::clone(authz), .. })
    }
}
```

**Application layer wires everything together** as the composition root:
```rust
// lana/app/src/lib.rs — Type aliases that bind generics to concrete types
pub mod customer {
    pub type Customers = core_customer::Customers<Authorization, LanaEvent>;
}
```

### 2.4 Domain-Driven Design (DDD)

- **Aggregates**: Each entity.rs defines an aggregate root with its invariants.
- **Value Objects**: Defined in `primitives.rs` — type-safe IDs (`CustomerId`), enums (`CustomerStatus`), strongly-typed wrappers.
- **Bounded Contexts**: Each `core/` module is a bounded context with its own events, errors, and persistence.
- **Domain Events**: Cross-context communication via public events in `public/` subdirectories.
- **Ubiquitous Language**: Rust types mirror domain language (e.g., `CreditFacility`, `Disbursal`, `CollateralizationState`).

### 2.5 Outbox Pattern for Cross-Module Events

Events are persisted transactionally alongside entity state changes using the outbox pattern:

```
                    ┌─────────────────────┐
  Command ──────▶   │  Entity + Events    │
                    │  (same DB tx)       │
                    └────────┬────────────┘
                             │ post_persist_hook
                             ▼
                    ┌─────────────────────┐
                    │  Outbox Table        │  ← Events published here atomically
                    └────────┬────────────┘
                             │ async consumer
                             ▼
                    ┌─────────────────────┐
                    │  Other Modules       │  ← React to events
                    └─────────────────────┘
```

---

## 3. Coding Standards & Conventions

### 3.1 Function Naming Convention (Strict)

| Name | Async? | Returns | When to use |
|------|--------|---------|-------------|
| `new` | No | Never `Result` | Always succeeds, synchronous construction |
| `try_new` | No | Must return `Result` | Might fail, synchronous |
| `init` | Yes | Must return `Result` | Async initialization (DB connections, network, etc.) |

**Suffix conventions:**
- `*_without_audit` suffix — Must return `Result<X, XError>`, not `Option`. Used for internal operations that skip audit logging.

### 3.2 Error Handling Rules

1. **Use `thiserror::Error`** for all error enums.
2. **Use `#[from]` attribute** for automatic conversions.
3. **NEVER use `.map_err()` when a `From` impl exists** — just use `?`. The `?` operator automatically converts via `From`. Writing `.map_err(MyError::Variant)` when `#[from]` is derived is redundant.
4. **Only use `.map_err()` when no `From` impl exists** and you don't want to add one.
5. **Each module has its own error type** in `error.rs`.
6. **Error messages follow the pattern**: `"ModuleName - ErrorVariant: {details}"`.

```rust
#[derive(Error, Debug)]
pub enum CustomerError {
    #[error("CustomerError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("CustomerError - AuthorizationError: {0}")]
    AuthorizationError(#[from] authz::error::AuthorizationError),

    #[error("CustomerError - CustomerIsClosed")]
    CustomerIsClosed,
}
```

### 3.3 Error Severity

Errors implement an `ErrorSeverity` trait for structured logging:

```rust
impl ErrorSeverity for MyError {
    fn severity(&self) -> Level {
        match self {
            Self::Sqlx(_) => Level::ERROR,           // Infrastructure failure
            Self::AuthorizationError(_) => Level::WARN, // Expected auth failures
            Self::NotFound => Level::WARN,            // Client errors
        }
    }
}
```

### 3.4 Serde Conventions

- **Always use** `#[serde(rename_all = "camelCase")]` instead of manual per-field `#[serde(rename)]`.
- **Event enums use**: `#[serde(tag = "type", rename_all = "snake_case")]` for tagged union serialization.
- **Enum string conversion**: Use the `Strum` library for enum ↔ string mapping instead of manual `impl Display`.

### 3.5 Idempotency

Commands MUST be idempotent. Use the `idempotency_guard!` macro:

```rust
pub fn activate(&mut self) -> Result<Idempotent<()>, MyError> {
    idempotency_guard!(self.status, EntityStatus::Active);
    // If already active, returns Idempotent::AlreadyApplied
    // Otherwise, proceeds with the operation
    self.events.push(MyEvent::Activated { .. });
    Ok(Idempotent::Executed(()))
}
```

Callers handle `Idempotent<T>`:
```rust
match entity.activate()? {
    Idempotent::Executed(result) => { /* first time */ },
    Idempotent::AlreadyApplied => { /* no-op, safe to ignore */ },
}
```

### 3.6 General Rules

- Use `rustls` (not OpenSSL) — always specify `rustls-tls` feature flag.
- Use OpenTelemetry (OTEL) for debugging/tracing, **never `println!`** (except in tests).
- Don't add `#[allow(dead_code)]` — fix or remove unused code.
- GraphQL schemas are auto-generated — **never edit `schema.graphql` manually**, run `make sdl`.
- Database queries use SQLx with compile-time verification — update offline cache with `cargo sqlx prepare` after changes.

---

## 4. Naming Conventions

### 4.1 Rust Naming

| Element | Convention | Examples |
|---------|-----------|----------|
| Structs | `PascalCase` | `Customer`, `CreditFacility`, `InterestAccrualCycle` |
| Enums | `PascalCase` | `CustomerStatus`, `CollateralizationState` |
| Enum Variants | `PascalCase` | `Active`, `Frozen`, `PendingApproval` |
| Event Variants | `PascalCase` (verb-based) | `Initialized`, `StatusChanged`, `CollateralUpdated` |
| Functions/Methods | `snake_case` | `find_by_id`, `create_prospect`, `handle_kyc_approved` |
| Variables/Fields | `snake_case` | `customer_id`, `created_at`, `credit_facility` |
| Modules | `snake_case` | `credit_facility`, `interest_accrual_cycle` |
| Constants | `SCREAMING_SNAKE_CASE` | `INTEREST_ACCRUAL`, `CUSTOMER_SYNC` |
| Type aliases | `PascalCase` | `Customers`, `CreditFacilities` |
| Trait names | `PascalCase` | `PermissionCheck`, `AuditSvc`, `OutboxEventMarker` |
| Crate names | `kebab-case` | `core-credit`, `lib-authz`, `lana-app` |

### 4.2 Type-Safe IDs

**Always use domain-specific ID types**, never raw `Uuid` or `String`:

```rust
// Defined via macro
es_entity::entity_id! { CustomerId }
es_entity::entity_id! { CreditFacilityId }

// Usage — compiler prevents mixing IDs
fn find_customer(id: CustomerId) -> Result<Customer, Error> { .. }
fn find_facility(id: CreditFacilityId) -> Result<CreditFacility, Error> { .. }
```

### 4.3 Frontend Naming

| Element | Convention | Examples |
|---------|-----------|----------|
| Files | `kebab-case` | `customer-list.tsx`, `credit-facility-form.tsx` |
| Components | `PascalCase` | `CustomerList`, `CreditFacilityForm` |
| Pages | `page.tsx` (Next.js) | `app/customers/page.tsx` |
| Dynamic routes | `[param-name]` | `app/customers/[customer-id]/page.tsx` |
| Hooks | `camelCase` with `use` prefix | `useCustomers`, `useTranslations` |
| GraphQL operations | `PascalCase` | `GetCustomers`, `CreateCreditFacility` |

### 4.4 Serialization Naming

| Context | Convention | Example |
|---------|-----------|---------|
| JSON API responses | `camelCase` | `{ "customerId": "...", "createdAt": "..." }` |
| Event serialization | `snake_case` | `{ "type": "status_changed", "new_status": "active" }` |
| Database columns | `snake_case` | `customer_id`, `created_at` |
| GraphQL fields | `camelCase` | `creditFacility { maturesAt }` |

---

## 5. Security Measures

### 5.1 Authentication — OIDC with JWT

- Use an **identity provider** (Keycloak/Auth0/etc.) for OIDC-based authentication.
- Maintain **separate realms** for different user types (admin vs customer). Never mix them.
- **JWT validation** happens at a gateway layer (e.g., Oathkeeper) before requests reach the application.
- Application servers use **Remote JWKS decoding** to validate tokens:

```rust
let jwks_decoder = Arc::new(RemoteJwksDecoder::new(jwks_url, audience));
```

- **Never expose internal APIs without the auth gateway.** Direct port access bypasses authentication.

### 5.2 Authorization — RBAC via Policy Engine

Use a policy engine (Casbin, OPA, etc.) for role-based access control:

```rust
#[async_trait]
pub trait PermissionCheck: Clone + Sync + Send + 'static {
    type Audit: AuditSvc;

    async fn enforce_permission(
        &self,
        subject: &Subject,
        object: impl Into<Object>,
        action: impl Into<Action>,
    ) -> Result<AuditInfo, AuthorizationError>;
}
```

**Integration rules:**
- **Every service method that performs an action MUST check permissions** before executing.
- Authorization is a generic trait — services are parametric over `Perms: PermissionCheck`.
- Policies are stored in the database (not hardcoded).
- The enforcer is wrapped in `Arc<RwLock<>>` for thread-safe runtime policy updates.

```rust
// In every service method:
pub async fn approve(&self, subject: &Subject, id: EntityId) -> Result<(), Error> {
    let audit_info = self.authz.enforce_permission(
        subject,
        CoreObject::CreditFacility,
        CoreAction::Approve,
    ).await?;
    // proceed only if authorized
}
```

### 5.3 Audit Logging — Every Authorization Decision

**EVERY authorization check (both granted and denied) is audit-logged:**

```rust
#[async_trait]
pub trait AuditSvc: Clone + Sync + Send + 'static {
    type Subject: SystemSubject;
    type Object: fmt::Display;
    type Action: fmt::Display;

    async fn record_entry(
        &self,
        subject: &Self::Subject,
        object: impl Into<Self::Object>,
        action: impl Into<Self::Action>,
        authorized: bool,  // ← logs both success AND failure
    ) -> Result<AuditInfo, AuditError>;
}
```

**Audit info is attached to domain events** via `AuditInfo`, creating a full chain of accountability from user action to system effect.

### 5.4 Type-Safe Security Boundaries

- **Wrap raw IDs** in domain-specific types (`CustomerId`, not `Uuid`) to prevent ID confusion attacks.
- **Encrypt sensitive fields** using dedicated encryption adapters.
- **Separate public events from internal events** — only `public/` subdirectory events cross module boundaries. Internal entity events are never exposed.
- **Use `rustls`** (pure Rust TLS), never OpenSSL, to minimize native dependency vulnerabilities.

### 5.5 Input Validation & API Security

- GraphQL schemas are **auto-generated** from Rust types — the type system enforces valid inputs.
- Use **compile-time query verification** (SQLx) to prevent SQL injection.
- Environment-specific configs are separated (`dev/`, `tf/`) — no secrets in code.
- Use the **Outbox pattern** for cross-module communication to ensure transactional consistency and prevent data leaks from partial failures.

---

## 6. Error Handling

### 6.1 Error Architecture

```
                ┌─────────────────────────────┐
                │   Application Error          │  ← Top-level, composes module errors
                │   (lana/app/src/error.rs)    │
                └─────────┬───────────────────┘
                          │ #[from]
            ┌─────────────┼─────────────────┐
            ▼             ▼                 ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ CustomerError │ │ CreditError  │ │ AccountError │  ← Module errors
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │ #[from]        │ #[from]        │ #[from]
           ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ AuthzError   │ │ SqlxError    │ │ AuditError   │  ← Infrastructure errors
    └──────────────┘ └──────────────┘ └──────────────┘
```

### 6.2 Rules for Error Propagation

1. Use `?` operator for automatic conversion via `From` impls. **NEVER use `.map_err()` when `#[from]` exists.**
2. Each module defines ONE error enum in `error.rs`.
3. Error variants embed the module name: `"CustomerError - Sqlx: {0}"`.
4. Infrastructure errors (`Sqlx`, `Redis`) get `Level::ERROR`. Business logic denials get `Level::WARN`.
5. `Option` is used for "not found" scenarios. `Result` is used for "operation failed" scenarios.

---

## 7. Testing Standards

### 7.1 Test Organization

```
core/customer/
├── src/           # Production code
└── tests/         # Integration tests
    ├── customer.rs    # Test scenarios for the module
    └── helpers.rs     # Test fixtures, mock setup, utilities
```

### 7.2 Test Setup Pattern

Use a shared `helpers::setup()` function that creates the full dependency graph with **dummy/mock implementations**:

```rust
// tests/helpers.rs
pub async fn setup() -> anyhow::Result<(MyService<DummyPerms, DummyEvent>, Outbox<DummyEvent>)> {
    let pool = init_pool().await?;  // Test database
    let outbox = Outbox::<DummyEvent>::init(&pool).await?;
    let authz = DummyPerms::new();  // No-op authorization for testing
    let service = MyService::init(&pool, &authz, &outbox).await?;
    Ok((service, outbox))
}
```

**Key patterns:**
- Replace authorization with `DummyPerms` (always allows) for unit/integration tests.
- Replace events with `DummyEvent` for isolated testing.
- Use real database (`PgPool`) for integration tests — not mocked.
- Each test gets a clean database state.

### 7.3 Event Assertion Pattern

Test that operations produce the expected domain events:

```rust
#[tokio::test]
async fn operation_emits_expected_event() -> anyhow::Result<()> {
    let (service, outbox) = helpers::setup().await?;

    let (result, event) = event::expect_event(
        &outbox,
        || service.perform_action(input),
        |result, event| match event {
            MyPublicEvent::ActionCompleted { id } if id == result.id => Some(()),
            _ => None,
        },
    ).await?;

    assert_eq!(result.status, ExpectedStatus);
    Ok(())
}
```

### 7.4 End-to-End Tests

E2E tests use **BATS (Bash Automated Testing System)** with GraphQL queries:

```bash
# bats/customer.bats
@test "can create a customer" {
    run graphql_admin "mutation { createCustomer(input: {...}) { id } }"
    [ "$status" -eq 0 ]
    customer_id=$(echo "$output" | jq -r '.data.createCustomer.id')
    [ -n "$customer_id" ]
}
```

- E2E tests run against the full stack (database + auth + API).
- Organized by domain in separate `.bats` files.
- GraphQL queries stored in dedicated directories (`admin-gql/`, `customer-gql/`).

---

## 8. Frontend Architecture

### 8.1 Structure (Next.js App Router)

```
apps/admin-panel/app/
├── layout.tsx              # Root layout (theme, i18n, auth wrapper)
├── page.tsx                # Home page
├── customers/
│   ├── page.tsx            # Customer list page
│   ├── list.tsx            # List component
│   ├── create.tsx          # Create form
│   └── [customer-id]/
│       ├── page.tsx        # Customer detail page
│       ├── details.tsx     # Detail view component
│       └── event-history.tsx
├── credit-facilities/
│   └── ...                 # Same pattern
└── ...
```

### 8.2 Key Patterns

- **Server Components by default**, `"use client"` only for interactive components.
- **Apollo Client** for GraphQL state management with type-safe codegen.
- **Internationalization** via `next-intl`:
  ```tsx
  const t = useTranslations("Customers");
  return <h1>{t("title")}</h1>;
  ```
- **Shared UI** in `apps/shared-web/` — reusable components using shadcn/ui.
- **Auth wrapper** at layout level: `<Authenticated>{children}</Authenticated>`.
- **Route structure mirrors domain modules** — customers, credit-facilities, deposits, etc.

---

## 9. Observability & Debugging

### 9.1 Tracing

- Use **OpenTelemetry (OTEL)** for all tracing and debugging — never `println!` (except tests).
- Custom tracing macros in `lib/tracing-macros/` for standardized span attributes.
- Structured logging with error severity levels.

### 9.2 Span Design

- Instrument all public service methods with `#[instrument]`.
- Include relevant IDs and parameters in span attributes.
- Error severity determines log level (ERROR for infra, WARN for auth/business).

---

## 10. Dependency Management

### 10.1 Workspace Dependencies

All dependencies are declared at the **workspace root** `Cargo.toml` and referenced in members:

```toml
# Root Cargo.toml
[workspace.dependencies]
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "rustls-tls"] }
thiserror = "2"
serde = { version = "1", features = ["derive"] }

# Module Cargo.toml
[dependencies]
sqlx = { workspace = true }
thiserror = { workspace = true }
```

### 10.2 Feature Flag Discipline

- **Always use `rustls-tls`** — never `native-tls` or `openssl`.
- Enable only the features you need.
- Use `default-features = false` when the defaults include unwanted features.

### 10.3 Build & CI

- **Compile-time query verification** with SQLx offline cache (`.sqlx/` directory).
- Run `cargo sqlx prepare` after any query changes.
- Prefix direct cargo commands with `SQLX_OFFLINE=true` when not connected to DB.
- Auto-generated GraphQL schemas — run `make sdl` after any Rust API changes.
- Security scanning: `cargo audit`, `cargo deny`, `pnpm audit`, CodeQL.

---

## Summary of Key Principles

| Principle | Implementation |
|-----------|---------------|
| **Immutable Events** | Event sourcing — state derived from event stream |
| **Idempotent Commands** | `Idempotent<T>` return type + `idempotency_guard!` |
| **Infallible Queries** | Query methods never return `Result` |
| **Type Safety** | Domain-specific IDs, not raw `Uuid`/`String` |
| **Trait-based DI** | Services generic over `Perms`, `E` traits |
| **Audit Everything** | Every auth decision (allow + deny) is logged |
| **Error Hierarchy** | Module errors compose via `#[from]`, never `.map_err()` |
| **Separated Concerns** | `core/` → `lib/` → `lana/` dependency direction |
| **Cross-Module Events** | Only `public/` events cross boundaries |
| **Compile-Time Safety** | SQLx verified queries, type-safe GraphQL codegen |
