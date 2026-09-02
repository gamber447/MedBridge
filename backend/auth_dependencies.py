from fastapi import (
    Depends,
    HTTPException,
    Request,
    status
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from backend.jwt_service import SECRET_KEY, ALGORITHM
from database.database import SessionLocal
from database import models


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token."
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    db = SessionLocal()

    try:
        user = (
            db.query(models.User)
            .filter(models.User.id == int(user_id))
            .first()
        )

        if user is None or user.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not active."
            )

        return user

    finally:
        db.close()


def require_roles(*allowed_roles):

    def role_checker(
    request: Request,
    current_user=Depends(get_current_user)
):

        if current_user.role not in allowed_roles:
            from backend.audit_service import create_audit_log
            create_audit_log(
                event_type="SECURITY",
                entity_type="AUTHORIZATION",
                entity_id=current_user.id,
                action="ACCESS_DENIED",
                status="BLOCKED",
                details=(
                    f"Role={current_user.role}; "
                    f"Required roles={','.join(allowed_roles)}; "
                    f"Method={request.method}; "
                    f"Endpoint={request.url.path}"
                )
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions."
            )

        return current_user

    return role_checker