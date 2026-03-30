pub trait EmailSender: Send + Sync + 'static {
    fn send_verification_email(&self, email: &str, token: &str) -> Result<(), String>;

    fn send_password_reset_email(&self, email: &str, token: &str) -> Result<(), String>;
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

impl EmailSender for TracingEmailSender {
    fn send_verification_email(&self, email: &str, token: &str) -> Result<(), String> {
        tracing::info!(email = %email, verification_url = %self.verification_url(token), "verification email generated");
        Ok(())
    }

    fn send_password_reset_email(&self, email: &str, token: &str) -> Result<(), String> {
        tracing::info!(email = %email, reset_url = %self.reset_url(token), "password reset email generated");
        Ok(())
    }
}