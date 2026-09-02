from datetime import datetime

from database.database import SessionLocal
from database import models

from security.qr_verification import generate_verification_token
from security.qr_generator import generate_qr_code


db = SessionLocal()

try:
    print("\n===================================")
    print("MEDBRIDGE DEMO CASE CREATION")
    print("===================================")

    # --------------------------------------------------
    # 1. Create synthetic hospital
    # --------------------------------------------------

    hospital = (
        db.query(models.Hospital)
        .filter(
            models.Hospital.registration_number
            == "DEMO-HOSP-001"
        )
        .first()
    )

    if hospital is None:
        hospital = models.Hospital(
            hospital_name="MedBridge Demo Hospital",
            registration_number="DEMO-HOSP-001",
            verification_status="VERIFIED",
            risk_score=5,
            bank_account_reference="DEMO-BANK-001"
        )

        db.add(hospital)
        db.flush()

        print("✅ Demo hospital created.")
    else:
        print("ℹ️ Demo hospital already exists.")

    # --------------------------------------------------
    # 2. Create synthetic doctor
    # --------------------------------------------------

    doctor = (
        db.query(models.Doctor)
        .filter(
            models.Doctor.registration_number
            == "DEMO-DOC-001"
        )
        .first()
    )

    if doctor is None:
        doctor = models.Doctor(
            doctor_reference="DOC-MB-000001",
            full_name="Dr. Demo Physician",
            registration_number="DEMO-DOC-001",
            specialisation="Neurology",
            hospital_id=hospital.id,
            verification_status="VERIFIED"
        )

        db.add(doctor)
        db.flush()

        print("✅ Demo doctor created.")
    else:
        print("ℹ️ Demo doctor already exists.")

    # --------------------------------------------------
    # 3. Create synthetic patient
    # --------------------------------------------------

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.patient_reference
            == "PAT-MB-000001"
        )
        .first()
    )

    if patient is None:
        patient = models.Patient(
            patient_reference="PAT-MB-000001",
            age=45,
            gender="NOT_SPECIFIED",
            identity_status="VERIFIED"
        )

        db.add(patient)
        db.flush()

        print("✅ Demo patient created.")
    else:
        print("ℹ️ Demo patient already exists.")

    # --------------------------------------------------
    # 4. Create synthetic medical case
    # --------------------------------------------------

    medical_case = (
        db.query(models.MedicalCase)
        .filter(
            models.MedicalCase.case_reference
            == "MB-TEST-000001"
        )
        .first()
    )

    if medical_case is None:
        medical_case = models.MedicalCase(
            case_reference="MB-TEST-000001",
            hospital_id=hospital.id,
            patient_id=patient.id,
            emergency_type="NEUROLOGICAL_EMERGENCY",
            diagnosis_category="EMERGENCY_NEUROLOGY",
            requested_amount=20000,
            approved_amount=20000,
            urgency_score=95,
            fraud_probability=5,
            risk_level="LOW",
            status="VERIFIED"
        )

        db.add(medical_case)
        db.flush()

        print("✅ Demo medical case created.")
    else:
        print("ℹ️ Demo medical case already exists.")

    # --------------------------------------------------
    # 5. Create secure QR verification token
    # --------------------------------------------------

    verification_form = (
        db.query(models.VerificationForm)
        .filter(
            models.VerificationForm.form_reference
            == "FORM-MB-000001"
        )
        .first()
    )

    if verification_form is None:

        token = generate_verification_token()

        verification_form = models.VerificationForm(
            form_reference="FORM-MB-000001",
            case_id=medical_case.id,
            hospital_id=hospital.id,
            doctor_id=doctor.id,
            patient_id=patient.id,
            emergency_type="NEUROLOGICAL_EMERGENCY",
            diagnosis_category="EMERGENCY_NEUROLOGY",
            treatment_required=(
                "Emergency neurological assessment "
                "and hospital treatment."
            ),
            admission_date=datetime.utcnow(),
            estimated_cost=20000,
            amount_already_available=5000,
            amount_required=15000,
            doctor_declaration=(
                "I confirm that this synthetic demo case "
                "requires emergency medical treatment."
            ),
            doctor_signature_reference=(
                "DEMO-SIGNATURE-001"
            ),
            hospital_stamp_reference=(
                "DEMO-HOSPITAL-STAMP-001"
            ),
            hospital_logo_reference=(
                "DEMO-HOSPITAL-LOGO-001"
            ),
            document_hash=(
                "DEMO-DOCUMENT-HASH-000001"
            ),
            qr_verification_code=token,
            verification_status="VERIFIED",
            submitted_at=datetime.utcnow(),
            verified_at=datetime.utcnow()
        )

        db.add(verification_form)
        db.flush()

        print("✅ Verification form created.")

    else:
        print("ℹ️ Verification form already exists.")

    # --------------------------------------------------
    # 6. Create verification result
    # --------------------------------------------------

    verification_result = (
        db.query(models.VerificationResult)
        .filter(
            models.VerificationResult.result_reference
            == "RESULT-MB-000001"
        )
        .first()
    )

    if verification_result is None:

        verification_result = models.VerificationResult(
            result_reference="RESULT-MB-000001",
            case_id=medical_case.id,
            verification_form_id=verification_form.id,

            hospital_check="PASS",
            doctor_check="PASS",
            document_integrity_check="PASS",
            digital_signature_check="PASS",
            information_match_check="PASS",
            qr_verification_check="PASS",

            trust_score=100,
            risk_level="LOW",
            verification_status="VERIFIED",

            medical_urgency="CRITICAL",
            escalation_required="NO",
            escalation_level="NONE",

            verification_notes=(
                "Synthetic demonstration case. "
                "All prototype verification checks passed."
            ),

            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )

        db.add(verification_result)
        db.flush()

        print("✅ Verification result created.")

    else:
        print("ℹ️ Verification result already exists.")

    # --------------------------------------------------
    # 7. Commit database changes
    # --------------------------------------------------

    db.commit()

    # --------------------------------------------------
    # 8. Generate QR image
    # --------------------------------------------------

    token = verification_form.qr_verification_code

    qr_path = (
        "tests/generated_qr/"
        "demo_case_verification.png"
    )

    generate_qr_code(
        token,
        qr_path
    )

    print("\n===================================")
    print("DEMO CASE READY")
    print("===================================")

    print(f"\nCase reference:")
    print(medical_case.case_reference)

    print(f"\nVerification token:")
    print(token)

    print(f"\nQR image:")
    print(qr_path)

    print("\nVerification status:")
    print(verification_result.verification_status)

    print("\nTrust score:")
    print(verification_result.trust_score)

    print("\n===================================")
    print("✅ MEDBRIDGE DEMO CASE CREATED")
    print("===================================")

except Exception as error:

    db.rollback()

    print("\n❌ Demo case creation failed.")
    print(f"Error: {error}")

finally:

    db.close()