use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub fn ok_json<T: Serialize>(data: T) -> Response {
    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }),
    )
        .into_response()
}

pub fn err_json(status: StatusCode, msg: impl Into<String>) -> Response {
    (
        status,
        Json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(msg.into()),
        }),
    )
        .into_response()
}
