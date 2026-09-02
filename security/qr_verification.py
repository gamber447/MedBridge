import secrets


def generate_verification_token() -> str:
    """
    Generate a cryptographically secure, non-guessable
    verification token for a MedBridge case.
    """

    token = secrets.token_urlsafe(32)

    return f"MBV-{token}"


def verify_token_format(token: str) -> bool:
    """
    Basic validation of a MedBridge verification token.
    """

    return (
        isinstance(token, str)
        and token.startswith("MBV-")
        and len(token) >= 40
    )