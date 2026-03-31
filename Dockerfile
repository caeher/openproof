# syntax=docker/dockerfile:1.7

# OpenProof API server (Rust / Axum)
# Build: docker build -t openproof-api .

FROM rust:1-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Workspace layout
COPY Cargo.toml Cargo.lock ./
COPY core ./core
COPY lib ./lib
COPY openproof ./openproof

# Reduce peak memory usage on smaller builders such as Coolify hosts.
ENV CARGO_BUILD_JOBS=2

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    cargo build --release --locked -p openproof-api-server \
    && cp /app/target/release/openproof-api-server /tmp/openproof-api-server

FROM debian:bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /tmp/openproof-api-server /usr/local/bin/openproof-api-server

EXPOSE 3001
ENV LISTEN_ADDR=0.0.0.0:3001

ENTRYPOINT ["/usr/local/bin/openproof-api-server"]
