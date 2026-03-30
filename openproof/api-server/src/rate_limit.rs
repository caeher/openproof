use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use axum::extract::{Request, State};
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::Response;
use tracing::warn;

use crate::error::err_json;
use crate::AppState;

#[derive(Default)]
pub struct RateLimiter {
    windows: Mutex<HashMap<String, RateWindow>>,
}

struct RateWindow {
    started_at: Instant,
    count: u32,
}

impl RateLimiter {
    pub fn check(&self, key: String, limit: u32, window: Duration) -> bool {
        let mut windows = self.windows.lock().expect("rate limiter mutex poisoned");
        let now = Instant::now();

        windows.retain(|_, value| now.duration_since(value.started_at) <= window);

        let entry = windows.entry(key).or_insert(RateWindow {
            started_at: now,
            count: 0,
        });

        if now.duration_since(entry.started_at) > window {
            entry.started_at = now;
            entry.count = 0;
        }

        if entry.count >= limit {
            return false;
        }

        entry.count += 1;
        true
    }
}

pub async fn auth_rate_limit(
    State(state): State<std::sync::Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    if let Some(response) = enforce_limit(
        &state,
        "auth",
        state.rate_limits.auth_requests,
        state.rate_limits.auth_window_seconds,
        &request,
    )
    {
        return response;
    }

    next.run(request).await
}

pub async fn verify_rate_limit(
    State(state): State<std::sync::Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    if let Some(response) = enforce_limit(
        &state,
        "verify",
        state.rate_limits.verify_requests,
        state.rate_limits.verify_window_seconds,
        &request,
    )
    {
        return response;
    }

    next.run(request).await
}

pub async fn webhook_rate_limit(
    State(state): State<std::sync::Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    if let Some(response) = enforce_limit(
        &state,
        "webhook",
        state.rate_limits.webhook_requests,
        state.rate_limits.webhook_window_seconds,
        &request,
    )
    {
        return response;
    }

    next.run(request).await
}

fn enforce_limit(
    state: &AppState,
    bucket: &str,
    limit: u32,
    window_seconds: u64,
    request: &Request,
) -> Option<Response> {
    let path = request.uri().path().to_string();
    let client_id = client_id(request.headers());
    let key = format!("{bucket}:{client_id}:{path}");

    if state
        .rate_limiter
        .check(key, limit, Duration::from_secs(window_seconds))
    {
        return None;
    }

    warn!(bucket, client_id, path, limit, window_seconds, "request rate limited");
    Some(err_json(
        axum::http::StatusCode::TOO_MANY_REQUESTS,
        format!("rate limit exceeded for {bucket}"),
    ))
}

fn client_id(headers: &HeaderMap) -> String {
    if let Some(forwarded) = header_value(headers, "x-forwarded-for") {
        if let Some(first) = forwarded.split(',').next() {
            let trimmed = first.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    if let Some(real_ip) = header_value(headers, "x-real-ip") {
        if !real_ip.trim().is_empty() {
            return real_ip.trim().to_string();
        }
    }

    "unknown".to_string()
}

fn header_value<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name).and_then(|value| value.to_str().ok())
}