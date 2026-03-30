use std::time::Duration;

use async_trait::async_trait;
use lettre::message::{Mailbox, Message};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

use crate::config::SmtpConfig;

#[async_trait]
pub trait EmailSender: Send + Sync + 'static {
    async fn send_verification_email(&self, email: &str, name: &str, token: &str) -> Result<(), String>;

    async fn send_password_reset_email(&self, email: &str, name: &str, token: &str) -> Result<(), String>;
}

#[derive(Clone, Debug)]
pub struct TracingEmailSender {
    pub app_base_url: String,
}

impl TracingEmailSender {
    fn verification_url(&self, token: &str) -> String {
        format!(
            "{}/verify-email?token={token}",
            self.app_base_url.trim_end_matches('/'),
        )
    }

    fn reset_url(&self, token: &str) -> String {
        format!(
            "{}/reset-password?token={token}",
            self.app_base_url.trim_end_matches('/'),
        )
    }
}

#[async_trait]
impl EmailSender for TracingEmailSender {
    async fn send_verification_email(&self, email: &str, _name: &str, token: &str) -> Result<(), String> {
        tracing::info!(email = %email, verification_url = %self.verification_url(token), "verification email generated");
        Ok(())
    }

    async fn send_password_reset_email(&self, email: &str, _name: &str, token: &str) -> Result<(), String> {
        tracing::info!(email = %email, reset_url = %self.reset_url(token), "password reset email generated");
        Ok(())
    }
}

#[derive(Clone)]
pub struct SmtpEmailSender {
    pub app_base_url: String,
    pub from: Mailbox,
    pub reply_to: Option<Mailbox>,
    pub transport: AsyncSmtpTransport<Tokio1Executor>,
}

impl SmtpEmailSender {
    pub fn from_config(app_base_url: String, config: &SmtpConfig) -> Result<Self, String> {
        let host = config
            .host
            .clone()
            .ok_or_else(|| "SMTP_HOST is required".to_string())?;
        let from = config
            .from
            .clone()
            .ok_or_else(|| "SMTP_FROM is required".to_string())?;

        let builder = match config.tls_mode.as_str() {
            "wrapper" | "tls" | "smtps" => AsyncSmtpTransport::<Tokio1Executor>::relay(&host)
                .map_err(|error| format!("smtp relay: {error}"))?,
            "starttls" => AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&host)
                .map_err(|error| format!("smtp starttls relay: {error}"))?,
            "none" => AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&host),
            other => return Err(format!("unsupported SMTP_TLS_MODE: {other}")),
        };

        let mut builder = builder
            .port(config.port)
            .timeout(Some(Duration::from_secs(config.timeout_seconds)));

        if let (Some(username), Some(password)) = (&config.username, &config.password) {
            builder = builder.credentials(Credentials::new(username.clone(), password.clone()));
        }

        let reply_to = match &config.reply_to {
            Some(value) => Some(
                value
                    .parse()
                    .map_err(|error| format!("invalid SMTP_REPLY_TO: {error}"))?,
            ),
            None => None,
        };

        Ok(Self {
            app_base_url,
            from: from
                .parse()
                .map_err(|error| format!("invalid SMTP_FROM: {error}"))?,
            reply_to,
            transport: builder.build(),
        })
    }

    fn verification_url(&self, token: &str) -> String {
        format!(
            "{}/verify-email?token={token}",
            self.app_base_url.trim_end_matches('/'),
        )
    }

    fn reset_url(&self, token: &str) -> String {
        format!(
            "{}/reset-password?token={token}",
            self.app_base_url.trim_end_matches('/'),
        )
    }

    async fn send_message(&self, to_email: &str, subject: &str, body: String) -> Result<(), String> {
        let to: Mailbox = to_email
            .parse()
            .map_err(|error| format!("invalid recipient email: {error}"))?;

        let mut builder = Message::builder().from(self.from.clone()).to(to);
        if let Some(reply_to) = &self.reply_to {
            builder = builder.reply_to(reply_to.clone());
        }

        let message = builder
            .subject(subject)
            .body(body)
            .map_err(|error| format!("smtp message: {error}"))?;

        self.transport
            .send(message)
            .await
            .map_err(|error| format!("smtp send: {error}"))?;

        Ok(())
    }
}

#[async_trait]
impl EmailSender for SmtpEmailSender {
    async fn send_verification_email(&self, email: &str, name: &str, token: &str) -> Result<(), String> {
        self.send_message(
            email,
            "Verifica tu correo en OpenProof",
            format!(
                "Hola {name},\n\nConfirma tu correo para activar las funciones verificadas de OpenProof.\n\nVerificar correo: {}\n\nSi no creaste esta cuenta, puedes ignorar este mensaje.",
                self.verification_url(token),
            ),
        )
        .await
    }

    async fn send_password_reset_email(&self, email: &str, name: &str, token: &str) -> Result<(), String> {
        self.send_message(
            email,
            "Restablece tu contraseña de OpenProof",
            format!(
                "Hola {name},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nRestablecer contraseña: {}\n\nSi no realizaste esta solicitud, puedes ignorar este mensaje.",
                self.reset_url(token),
            ),
        )
        .await
    }
}