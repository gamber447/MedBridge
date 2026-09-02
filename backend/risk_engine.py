from database.database import SessionLocal
from database import models
from backend.audit_service import create_audit_log


CHECK_WEIGHTS = {
    "hospital": 20,
    "doctor": 20,
    "document_integrity": 20,
    "digital_signature": 15,
    "information_match": 15,
    "qr_verification": 10,
}


def calculate_trust_score(result):

    checks = {
        "hospital": result.hospital_check,
        "doctor": result.doctor_check,
        "document_integrity":
            result.document_integrity_check,
        "digital_signature":
            result.digital_signature_check,
        "information_match":
            result.information_match_check,
        "qr_verification":
            result.qr_verification_check,
    }

    score = 0

    for check_name, weight in CHECK_WEIGHTS.items():

        if checks[check_name] == "PASS":
            score += weight

    return score


def classify_risk(score, result):

    # Critical verification failures require review
    # regardless of the numerical score.
    critical_failures = [
        result.hospital_check,
        result.doctor_check,
        result.document_integrity_check,
    ]

    if "FAIL" in critical_failures:
        return "HIGH"

    if score >= 90:
        return "LOW"

    if score >= 70:
        return "MEDIUM"

    return "HIGH"


def evaluate_case(case_id: int):

    db = SessionLocal()

    try:

        result = (
            db.query(models.VerificationResult)
            .filter(
                models.VerificationResult.case_id
                == case_id
            )
            .first()
        )

        if result is None:
            return {
                "success": False,
                "message": (
                    "Verification result not found."
                )
            }

        score = calculate_trust_score(result)

        risk_level = classify_risk(
            score,
            result
        )

        if risk_level == "LOW":
            verification_status = "VERIFIED"

        elif risk_level == "MEDIUM":
            verification_status = "REVIEW_REQUIRED"

        else:
            verification_status = "HIGH_RISK"

        result.trust_score = score
        result.risk_level = risk_level
        result.verification_status = (
            verification_status
        )

        # ==================================================
        # UPDATE MEDICAL CASE STATUS
        # ==================================================

        case = (
            db.query(models.MedicalCase)
            .filter(
                models.MedicalCase.id == case_id
            )
            .first()
        )

        if case is None:
            return {
                "success": False,
                "message": "Medical case not found."
            }

        if verification_status == "VERIFIED":
            case.status = "VERIFIED"
            case.approved_amount = case.requested_amount

        elif verification_status == "REVIEW_REQUIRED":
            case.status = "UNDER_VERIFICATION"
            case.approved_amount = 0

        else:
            case.status = "HIGH_RISK"
            case.approved_amount = 0

        db.commit()
        db.refresh(result)
        db.refresh(case)

        create_audit_log(
            event_type="SECURITY",
            entity_type="CASE",
            entity_id=case_id,
            action="RISK_EVALUATION",
            status="SUCCESS",
            details=(
                f"Trust score={score}; "
                f"Risk level={risk_level}; "
                f"Verification status={verification_status}"
            ),
        )

        return {
            "success": True,
            "case_id": case_id,
            "trust_score": score,
            "risk_level": risk_level,
            "verification_status":
                verification_status,
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()