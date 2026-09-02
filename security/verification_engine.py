from dataclasses import dataclass


@dataclass
class VerificationInput:
    hospital_verified: bool
    doctor_verified: bool
    document_integrity_valid: bool
    digital_signature_valid: bool
    information_matches: bool
    qr_valid: bool
    medical_urgency: str = "NORMAL"


@dataclass
class VerificationDecision:
    trust_score: int
    risk_level: str
    verification_status: str
    escalation_required: bool
    escalation_level: str
    notes: list[str]


def calculate_trust_score(data: VerificationInput) -> int:
    """
    Calculate a transparent prototype trust score.

    This is a demonstration policy, not a medically
    validated or real-world financial decision model.
    """

    score = 0

    if data.hospital_verified:
        score += 20

    if data.doctor_verified:
        score += 20

    if data.document_integrity_valid:
        score += 15

    if data.digital_signature_valid:
        score += 15

    if data.information_matches:
        score += 15

    if data.qr_valid:
        score += 15

    return score


def evaluate_case(data: VerificationInput) -> VerificationDecision:
    score = calculate_trust_score(data)

    notes = []

    if not data.hospital_verified:
        notes.append("Hospital verification failed.")

    if not data.doctor_verified:
        notes.append("Doctor verification failed.")

    if not data.document_integrity_valid:
        notes.append("Document integrity failure detected.")

    if not data.digital_signature_valid:
        notes.append("Digital signature verification failed.")

    if not data.information_matches:
        notes.append("Medical information mismatch detected.")

    if not data.qr_valid:
        notes.append("QR verification failed.")

    critical = data.medical_urgency.upper() == "CRITICAL"

    # Completely trusted case
    if score >= 90:
        return VerificationDecision(
            trust_score=score,
            risk_level="LOW",
            verification_status="VERIFIED",
            escalation_required=False,
            escalation_level="NONE",
            notes=["All primary verification checks passed."]
        )

    # Moderate confidence
    if score >= 70:
        return VerificationDecision(
            trust_score=score,
            risk_level="MEDIUM",
            verification_status="REVIEW_REQUIRED",
            escalation_required=critical,
            escalation_level="IMMEDIATE" if critical else "STANDARD",
            notes=notes
        )

    # Low confidence
    return VerificationDecision(
        trust_score=score,
        risk_level="HIGH",
        verification_status="ESCALATED",
        escalation_required=True,
        escalation_level="IMMEDIATE" if critical else "HIGH",
        notes=notes
    )