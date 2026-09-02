from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150), nullable=False)

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(String(255), nullable=False)

    role = Column(
        String(50),
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=True
    )

    status = Column(
        String(30),
        default="ACTIVE",
        nullable=False
    )
    failed_login_attempts = Column(
        Integer,
        default=0,
        nullable=False
    )

    locked_until = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)

    hospital_name = Column(
        String(200),
        nullable=False
    )

    registration_number = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    risk_score = Column(
        Integer,
        default=0,
        nullable=False
    )

    bank_account_reference = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)

    doctor_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    full_name = Column(
        String(150),
        nullable=False
    )

    registration_number = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    specialisation = Column(
        String(150),
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=False
    )

    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class Patient(Base):
    __tablename__ = "patients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    # =========================
    # IDENTITY INFORMATION
    # =========================

    full_name = Column(
        String(200),
        nullable=True
    )

    date_of_birth = Column(
        DateTime,
        nullable=True
    )

    government_id_reference = Column(
        String(200),
        nullable=True
    )

    age = Column(
        Integer,
        nullable=False
    )

    gender = Column(
        String(30),
        nullable=True
    )

    # =========================
    # VERIFICATION STATUS
    # =========================

    identity_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id = Column(Integer, primary_key=True, index=True)

    case_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=False
    )

    patient_id = Column(
        Integer,
        nullable=False
    )

    emergency_type = Column(
        String(100),
        nullable=False
    )

    diagnosis_category = Column(
        String(150),
        nullable=True
    )

    requested_amount = Column(
        Integer,
        nullable=False
    )

    approved_amount = Column(
        Integer,
        default=0,
        nullable=False
    )

    urgency_score = Column(
        Integer,
        default=0,
        nullable=False
    )

    fraud_probability = Column(
        Integer,
        default=0,
        nullable=False
    )

    risk_level = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class VerificationForm(Base):
    __tablename__ = "verification_forms"

    id = Column(Integer, primary_key=True, index=True)

    form_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    case_id = Column(
        Integer,
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=False
    )

    doctor_id = Column(
        Integer,
        nullable=False
    )

    patient_id = Column(
        Integer,
        nullable=False
    )

    # Emergency information
    emergency_type = Column(
        String(100),
        nullable=False
    )

    diagnosis_category = Column(
        String(150),
        nullable=False
    )

    treatment_required = Column(
        String(500),
        nullable=False
    )

    admission_date = Column(
        DateTime,
        nullable=False
    )

    # Financial information
    estimated_cost = Column(
        Integer,
        nullable=False
    )

    amount_already_available = Column(
        Integer,
        default=0,
        nullable=False
    )

    amount_required = Column(
        Integer,
        nullable=False
    )

    # Doctor verification
    doctor_declaration = Column(
        String(1000),
        nullable=False
    )

    doctor_signature_reference = Column(
        String(255),
        nullable=True
    )

    # Hospital verification
    hospital_stamp_reference = Column(
        String(255),
        nullable=True
    )

    hospital_logo_reference = Column(
        String(255),
        nullable=True
    )

    # Digital verification
    document_hash = Column(
        String(128),
        nullable=True
    )

    qr_verification_code = Column(
        String(255),
        unique=True,
        nullable=True
    )

    # Verification status
    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    submitted_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    verified_at = Column(
        DateTime,
        nullable=True
    )
class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(Integer, primary_key=True, index=True)

    document_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    case_id = Column(
        Integer,
        nullable=False
    )

    verification_form_id = Column(
        Integer,
        nullable=False
    )

    document_type = Column(
        String(100),
        nullable=False
    )

    original_filename = Column(
        String(255),
        nullable=False
    )

    content_type = Column(
        String(100),
        nullable=False
    )

    file_hash = Column(
        String(64),
        nullable=False
    )

    storage_reference = Column(
        String(500),
        nullable=False
    )

    uploaded_by = Column(
        Integer,
        nullable=False
    )

    integrity_status = Column(
        String(30),
        default="UNVERIFIED",
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    verified_at = Column(
        DateTime,
        nullable=True
    )
class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(Integer, primary_key=True, index=True)

    result_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    case_id = Column(
        Integer,
        nullable=False
    )

    verification_form_id = Column(
        Integer,
        nullable=False
    )

    # Individual verification checks
    hospital_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    doctor_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    document_integrity_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    digital_signature_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    information_match_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    qr_verification_check = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    # Overall assessment
    trust_score = Column(
        Integer,
        default=0,
        nullable=False
    )

    risk_level = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    # Emergency handling
    medical_urgency = Column(
        String(30),
        default="NORMAL",
        nullable=False
    )

    escalation_required = Column(
        String(10),
        default="NO",
        nullable=False
    )

    escalation_level = Column(
        String(30),
        default="NONE",
        nullable=False
    )

    verification_notes = Column(
        String(2000),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )
class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)

    donor_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    display_name = Column(
        String(150),
        nullable=False
    )

    consent_status = Column(
        String(30),
        default="NOT_CONSENTED",
        nullable=False
    )

    max_contribution_per_case = Column(
        Integer,
        default=0,
        nullable=False
    )

    active = Column(
        String(10),
        default="NO",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class DonationAllocation(Base):
    __tablename__ = "donation_allocations"

    id = Column(Integer, primary_key=True, index=True)

    allocation_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    donor_id = Column(
        Integer,
        nullable=False
    )

    case_id = Column(
        Integer,
        nullable=False
    )

    requested_amount = Column(
        Integer,
        nullable=False
    )

    allocated_amount = Column(
        Integer,
        nullable=False
    )

    allocation_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    payment_reference = Column(
        String(150),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)

    transaction_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    idempotency_key = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    allocation_id = Column(
        Integer,
        nullable=False
    )

    case_id = Column(
        Integer,
        nullable=False
    )

    donor_id = Column(
        Integer,
        nullable=False
    )

    amount = Column(
        Integer,
        nullable=False
    )

    payment_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    destination_reference = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    event_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    event_type = Column(
        String(100),
        nullable=False
    )

    entity_type = Column(
        String(100),
        nullable=False
    )

    entity_id = Column(
        Integer,
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False
    )

    details = Column(
        String(2000),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class PatientApplication(Base):
    __tablename__ = "patient_applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    application_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    patient_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    full_name = Column(
        String(200),
        nullable=False
    )

    date_of_birth = Column(
        DateTime,
        nullable=True
    )

    government_id_reference = Column(
        String(200),
        nullable=False
    )

    medical_condition = Column(
        String(1000),
        nullable=False
    )

    treatment_required = Column(
        String(2000),
        nullable=False
    )

    estimated_treatment_cost = Column(
        Integer,
        nullable=False
    )

    medical_document = Column(
        String(500),
        nullable=True
    )

    verification_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    risk_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    eligibility_status = Column(
        String(30),
        default="PENDING",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    verified_at = Column(
        DateTime,
        nullable=True
    )