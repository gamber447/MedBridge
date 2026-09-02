import bcrypt

from datetime import datetime, timedelta

from database.database import SessionLocal
from database import models
from backend.audit_service import create_audit_log


MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def authenticate_user(email: str, password: str):

    db = SessionLocal()

    try:
        user = (
            db.query(models.User)
            .filter(
                models.User.email == email
            )
            .first()
        )

        # --------------------------------------------------
        # 1. User not found
        # --------------------------------------------------

        if user is None:

            create_audit_log(
                event_type="SECURITY",
                entity_type="AUTHENTICATION",
                entity_id=None,
                action="LOGIN_ATTEMPT",
                status="BLOCKED",
                details="Login failed: invalid credentials."
            )

            return {
                "success": False,
                "message": "Invalid email or password."
            }

        # --------------------------------------------------
        # 2. Check account lockout
        # --------------------------------------------------

        if user.locked_until is not None:

            if user.locked_until > datetime.utcnow():

                create_audit_log(
                    event_type="SECURITY",
                    entity_type="AUTHENTICATION",
                    entity_id=user.id,
                    action="LOGIN_ATTEMPT",
                    status="BLOCKED",
                    details=(
                        "Login blocked: account temporarily locked."
                    )
                )

                return {
                    "success": False,
                    "message": (
                        "Account temporarily locked. "
                        "Please try again later."
                    )
                }

            # Lockout period expired
            user.locked_until = None
            user.failed_login_attempts = 0

        # --------------------------------------------------
        # 3. Check account status
        # --------------------------------------------------

        if user.status != "ACTIVE":

            create_audit_log(
                event_type="SECURITY",
                entity_type="AUTHENTICATION",
                entity_id=user.id,
                action="LOGIN_ATTEMPT",
                status="BLOCKED",
                details=(
                    "Login blocked: user account is inactive."
                )
            )

            return {
                "success": False,
                "message": "User account is inactive."
            }

        # --------------------------------------------------
        # 4. Verify password
        # --------------------------------------------------

        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        )

        if not password_valid:

            user.failed_login_attempts += 1

            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:

                user.locked_until = (
                    datetime.utcnow()
                    + timedelta(minutes=LOCKOUT_MINUTES)
                )

                db.commit()

                create_audit_log(
                    event_type="SECURITY",
                    entity_type="AUTHENTICATION",
                    entity_id=user.id,
                    action="ACCOUNT_LOCKOUT",
                    status="BLOCKED",
                    details=(
                        "Account locked after "
                        f"{user.failed_login_attempts} "
                        "failed login attempts."
                    )
                )

                return {
                    "success": False,
                    "message": (
                        "Account temporarily locked. "
                        "Please try again later."
                    )
                }

            db.commit()

            create_audit_log(
                event_type="SECURITY",
                entity_type="AUTHENTICATION",
                entity_id=user.id,
                action="LOGIN_ATTEMPT",
                status="BLOCKED",
                details=(
                    "Login failed: invalid credentials. "
                    f"Failed attempts={user.failed_login_attempts}"
                )
            )

            return {
                "success": False,
                "message": "Invalid email or password."
            }

        # --------------------------------------------------
        # 5. Successful authentication
        # --------------------------------------------------

        user.failed_login_attempts = 0
        user.locked_until = None

        db.commit()

        create_audit_log(
            event_type="SECURITY",
            entity_type="AUTHENTICATION",
            entity_id=user.id,
            action="LOGIN",
            status="SUCCESS",
            details=(
                f"Successful authentication. "
                f"Role={user.role}"
            )
        )

        return {
            "success": True,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }

    finally:
        db.close()