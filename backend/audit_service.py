from uuid import uuid4

from database.database import SessionLocal
from database import models


def generate_event_reference():
    return f"AUDIT-{uuid4().hex[:12].upper()}"


def create_audit_log(
    event_type: str,
    entity_type: str,
    entity_id: int | None,
    action: str,
    status: str,
    details: str | None = None,
):
    db = SessionLocal()

    try:
        audit_log = models.AuditLog(
            event_reference=generate_event_reference(),
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            status=status,
            details=details,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)

        return audit_log

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
        