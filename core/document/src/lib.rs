//! Document registration and chain state (bounded context).

mod error;
mod model;
mod public;

pub use error::DocumentError;
pub use model::{Document, DocumentId, NewDocument};
pub use public::CoreDocumentEvent;
pub use public::ready_for_notarization;
