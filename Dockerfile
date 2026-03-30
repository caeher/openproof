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

RUN cargo build --release -p openproof-api-server

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/openproof-api-server /usr/local/bin/openproof-api-server

EXPOSE 3001
ENV LISTEN_ADDR=0.0.0.0:3001

ENTRYPOINT ["/usr/local/bin/openproof-api-server"]
