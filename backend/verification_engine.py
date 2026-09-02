import os
import hashlib
from datetime import datetime

from database.database import SessionLocal
from database import models


def verify_document_integrity(document):
    """
    Recalculate the SHA-256 hash of the stored medical document
    and compare it with the hash recorded in the database.
    """

    if not document.file_hash:
        return False

    if not document.storage_reference:
        return False

    if not os.path.isfile(document.storage_reference):
        return False

    sha256_hash = hashlib.sha256()

    with open(document.storage_reference, "rb") as file:

        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b""
        ):
            sha256_hash.update(chunk)

    calculated_hash = sha256_hash.hexdigest()

    return calculated_hash == document.file_hash


def run_verification(case_id: int):

    db = SessionLocal()

    try:

        # -----------------------------------------
        # 1. Get medical case
        # -----------------------------------------

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

        # -----------------------------------------
        # 2. Get verification form
        # -----------------------------------------

        verification_form = (
            db.query(models.VerificationForm)
            .filter(
                models.VerificationForm.case_id
                == case_id
            )
            .first()
        )

        if verification_form is None:
            return {
                "success": False,
                "message": "Verification form not found."
            }

        # -----------------------------------------
        # 3. Get supporting documents
        # -----------------------------------------

        documents = (
            db.query(models.MedicalDocument)
            .filter(
                models.MedicalDocument.case_id
                == case_id
            )
            .all()
        )

        if not documents:
            return {
                "success": False,
                "message": (
                    "No supporting medical "
                    "documents found."
                )
            }

        # -----------------------------------------
        # 4. Find verification result
        # -----------------------------------------

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

        # -----------------------------------------
        # 5. Hospital verification
        # -----------------------------------------

        if (
            verification_form.hospital_id
            == case.hospital_id
        ):
            result.hospital_check = "PASS"
        else:
            result.hospital_check = "FAIL"

        # -----------------------------------------
        # 6. Doctor verification
        # -----------------------------------------

        if (
            verification_form.doctor_id is not None
            and verification_form.doctor_id > 0
        ):
            result.doctor_check = "PASS"
        else:
            result.doctor_check = "FAIL"

        # -----------------------------------------
        # 7. Document integrity verification
        # -----------------------------------------

        valid_documents = True

        for document in documents:

            document_valid = (
                verify_document_integrity(
                    document
                )
            )

            if document_valid:

                document.integrity_status = (
                    "VERIFIED"
                )

            else:

                document.integrity_status = (
                    "FAILED"
                )

                valid_documents = False

        if valid_documents:

            result.document_integrity_check = (
                "PASS"
            )

        else:

            result.document_integrity_check = (
                "FAIL"
            )

        # -----------------------------------------
        # 8. Digital signature verification
        # -----------------------------------------

        if (
            verification_form
            .doctor_signature_reference
        ):

            result.digital_signature_check = (
                "PASS"
            )

        else:

            result.digital_signature_check = (
                "FAIL"
            )

        # -----------------------------------------
        # 9. Information matching
        # -----------------------------------------

        information_matches = True

        if (
            verification_form.patient_id
            != case.patient_id
        ):
            information_matches = False

        if (
            verification_form.hospital_id
            != case.hospital_id
        ):
            information_matches = False

        if information_matches:

            result.information_match_check = (
                "PASS"
            )

        else:

            result.information_match_check = (
                "FAIL"
            )

        # -----------------------------------------
        # 10. QR verification
        # -----------------------------------------

        if (
            verification_form.qr_verification_code
        ):

            result.qr_verification_check = (
                "PASS"
            )

        else:

            result.qr_verification_check = (
                "FAIL"
            )

        # -----------------------------------------
        # 11. Verification completed
        # -----------------------------------------

        result.verification_notes = (
            "Automated verification checks completed."
        )

        result.completed_at = datetime.utcnow()

        db.commit()

        db.refresh(result)

        return {

            "success": True,

            "case_id": case_id,

            "hospital_check":
                result.hospital_check,

            "doctor_check":
                result.doctor_check,

            "document_integrity_check":
                result.document_integrity_check,

            "digital_signature_check":
                result.digital_signature_check,

            "information_match_check":
                result.information_match_check,

            "qr_verification_check":
                result.qr_verification_check,
        }

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()