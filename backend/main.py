from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.donor_schemas import DonorCreate, ConsentUpdate

from backend.allocation_engine import allocate_funds

from backend.payment_service import process_payment

from sqlalchemy import func

from backend.verification_engine import run_verification

import requests

from datetime import datetime

from pydantic import BaseModel, Field
from uuid import uuid4

from fastapi import FastAPI, HTTPException

from backend.risk_engine import evaluate_case

from backend.auth_service import authenticate_user

from backend.jwt_service import create_access_token

from fastapi import Query

from backend.auth_dependencies import (
    get_current_user,
    require_roles
)

import hashlib
import os

from fastapi import (
    UploadFile,
    File,
    Form
)

from database.database import Base, engine, SessionLocal

from database import models

from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        return response

app = FastAPI(
    title="MedBridge API",
    description="Secure AI-assisted emergency medical funding platform",
    version="0.1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)


Base.metadata.create_all(bind=engine)





@app.get("/")
def root():
    return {
        "message": "Welcome to MedBridge",
        "status": "running",
        "version": "0.1.0"
    }
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
@app.get("/verify/{token}")
def verify_case(token: str):

    db = SessionLocal()

    try:
        # Find the verification form associated
        # with this secure QR token.
        verification_form = (
            db.query(models.VerificationForm)
            .filter(
                models.VerificationForm.qr_verification_code == token
            )
            .first()
        )

        if verification_form is None:
            raise HTTPException(
                status_code=404,
                detail="Verification token not found."
            )

        # Find the verification result for this case.
        verification_result = (
            db.query(models.VerificationResult)
            .filter(
                models.VerificationResult.verification_form_id
                == verification_form.id
            )
            .first()
        )

        # If verification has not been completed yet,
        # do not expose sensitive information.
        if verification_result is None:
            return {
                "verified": False,
                "status": "PENDING",
                "message": "Case verification is still in progress."
            }

        # Return ONLY safe verification information.
        return {
            "verified": (
                verification_result.verification_status
                == "VERIFIED"
            ),
            "status": verification_result.verification_status,
            "hospital": verification_result.hospital_check,
            "doctor": verification_result.doctor_check,
            "document_integrity": (
                verification_result.document_integrity_check
            ),
            "digital_signature": (
                verification_result.digital_signature_check
            ),
            "information_match": (
                verification_result.information_match_check
            ),
            "qr_verification": (
                verification_result.qr_verification_check
            ),
            "risk_level": verification_result.risk_level,
            "verification_reference": (
                verification_result.result_reference
            )
        }

    finally:
        db.close()
@app.post("/donors")
def create_donor(
    donor_data: DonorCreate,
    current_user=Depends(require_roles("ADMIN"))
):

    db = SessionLocal()

    try:
        existing_donor = (
            db.query(models.Donor)
            .filter(
                models.Donor.donor_reference
                == donor_data.donor_reference
            )
            .first()
        )

        if existing_donor:
            raise HTTPException(
                status_code=409,
                detail="Donor reference already exists."
            )

        donor = models.Donor(
            donor_reference=donor_data.donor_reference,
            display_name=donor_data.display_name,
            consent_status="NOT_CONSENTED",
            max_contribution_per_case=(
                donor_data.max_contribution_per_case
            ),
            active="NO"
        )

        db.add(donor)
        db.commit()
        db.refresh(donor)

        return {
            "message": "Donor created successfully.",
            "donor_id": donor.id,
            "donor_reference": donor.donor_reference,
            "consent_status": donor.consent_status,
            "active": donor.active,
            "max_contribution_per_case": (
                donor.max_contribution_per_case
            )
        }

    finally:
        db.close()
@app.post("/donors/{donor_id}/consent")
def update_donor_consent(
    donor_id: int,
    consent_data: ConsentUpdate,
    current_user=Depends(require_roles("ADMIN"))
):

    db = SessionLocal()

    try:
        donor = (
            db.query(models.Donor)
            .filter(models.Donor.id == donor_id)
            .first()
        )

        if donor is None:
            raise HTTPException(
                status_code=404,
                detail="Donor not found."
            )

        if consent_data.consent_status not in [
            "CONSENTED",
            "NOT_CONSENTED"
        ]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "consent_status must be "
                    "CONSENTED or NOT_CONSENTED."
                )
            )

        donor.consent_status = (
            consent_data.consent_status
        )

        donor.max_contribution_per_case = (
            consent_data.max_contribution_per_case
        )

        donor.active = (
            "YES"
            if consent_data.consent_status == "CONSENTED"
            else "NO"
        )

        db.commit()
        db.refresh(donor)

        return {
            "message": "Donor consent updated.",
            "donor_id": donor.id,
            "donor_reference": donor.donor_reference,
            "consent_status": donor.consent_status,
            "active": donor.active,
            "max_contribution_per_case": (
                donor.max_contribution_per_case
            )
        }

    finally:
        db.close()
@app.get("/donors/{donor_id}")
def get_donor(
    donor_id: int,
    current_user=Depends(
        require_roles("ADMIN", "AUDITOR")
    )
):

    db = SessionLocal()

    try:
        donor = (
            db.query(models.Donor)
            .filter(models.Donor.id == donor_id)
            .first()
        )

        if donor is None:
            raise HTTPException(
                status_code=404,
                detail="Donor not found."
            )

        return {
            "donor_id": donor.id,
            "donor_reference": donor.donor_reference,
            "display_name": donor.display_name,
            "consent_status": donor.consent_status,
            "active": donor.active,
            "max_contribution_per_case": (
                donor.max_contribution_per_case
            )
        }

    finally:
        db.close()
@app.post("/funding/allocate/{case_id}")
def allocate_case_funding(
    case_id: int,
    donor_references: str | None = Query(
    default=None,
    max_length=500
),
current_user=Depends(
    require_roles("ADMIN")
    )
):

    donor_pool = None

    if donor_references:
        donor_pool = [
            reference.strip()
            for reference in donor_references.split(",")
            if reference.strip()
        ]

    result = allocate_funds(
        case_id,
        donor_pool
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result
@app.post("/payments/process/{allocation_id}")
def process_allocation_payment(
    allocation_id: int,
    idempotency_key: str = Query(
        min_length=8,
        max_length=100
    ),
    current_user=Depends(
        require_roles("ADMIN")
    )
):

    result = process_payment(
        allocation_id,
        idempotency_key
    )

    if not result["success"] and not result["duplicate"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    if result["duplicate"]:
        raise HTTPException(
            status_code=409,
            detail=result
        )

    return result
@app.get("/funding/status/{case_id}")
def funding_status(
    case_id: int,
    current_user=Depends(get_current_user)
):
    db = SessionLocal()

    try:
        case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Medical case not found."
            )

        allocations = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.case_id == case_id
            )
            .all()
        )

        total_allocated = sum(
            allocation.allocated_amount
            for allocation in allocations
        )

        total_settled = sum(
            allocation.allocated_amount
            for allocation in allocations
            if allocation.allocation_status == "SETTLED"
        )

        total_pending = sum(
            allocation.allocated_amount
            for allocation in allocations
            if allocation.allocation_status == "PENDING"
        )

        remaining_amount = max(
            case.approved_amount - total_allocated,
            0
        )

        if not case.approved_amount or case.approved_amount <= 0:
            funding_status_value = "NOT_APPROVED"

        elif remaining_amount == 0:
            funding_status_value = "FULLY_FUNDED"

        elif total_allocated > 0:
            funding_status_value = "PARTIALLY_FUNDED"

        else:
            funding_status_value = "NOT_FUNDED"

        return {
            "case_id": case.id,
            "case_reference": case.case_reference,
            "requested_amount": case.requested_amount,
            "approved_amount": case.approved_amount,
            "total_allocated": total_allocated,
            "total_settled": total_settled,
            "total_pending": total_pending,
            "remaining_amount": remaining_amount,
            "funding_status": funding_status_value,
            "allocation_count": len(allocations)
        }

    finally:
        db.close()


@app.post("/funding/request/{case_id}")
def create_case_funding_request(
    case_id: int,
    current_user=Depends(
        require_roles("DOCTOR")
    )
):
    db = SessionLocal()

    try:
        # ==================================================
        # 1. FIND MEDICAL CASE
        # ==================================================

        case = (
            db.query(models.MedicalCase)
            .filter(
                models.MedicalCase.id == case_id
            )
            .first()
        )

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Medical case not found."
            )

        # ==================================================
        # 2. VERIFY DOCTOR'S HOSPITAL
        # ==================================================

        doctor = (
            db.query(models.User)
            .filter(
                models.User.id == current_user.id
            )
            .first()
        )

        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor account not found."
            )

        if doctor.hospital_id is None:
            raise HTTPException(
                status_code=403,
                detail="Doctor is not assigned to a hospital."
            )

        if case.hospital_id != doctor.hospital_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You are not authorised to create "
                    "funding for this case."
                )
            )

        # ==================================================
        # 3. CASE MUST BE VERIFIED
        # ==================================================

        if case.status != "VERIFIED":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Funding request can only be created "
                    "for a verified medical case."
                )
            )

        # ==================================================
        # 4. APPROVED AMOUNT REQUIRED
        # ==================================================

        if not case.approved_amount or case.approved_amount <= 0:
            raise HTTPException(
                status_code=409,
                detail=(
                    "This case is verified but has no "
                    "approved funding amount."
                )
            )

        # ==================================================
        # 5. FIND PATIENT
        # ==================================================

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.id == case.patient_id
            )
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found."
            )

        # ==================================================
        # 6. FIND HOSPITAL
        # ==================================================

        hospital = (
            db.query(models.Hospital)
            .filter(
                models.Hospital.id == case.hospital_id
            )
            .first()
        )

        if hospital is None:
            raise HTTPException(
                status_code=404,
                detail="Hospital not found."
            )

        if not hospital.bank_account_reference:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Hospital does not have a configured "
                    "bank account reference."
                )
            )

        # ==================================================
        # 7. PREVENT DUPLICATE FUNDING REQUEST
        # ==================================================

        bank_payload_check = {
            "case_reference": case.case_reference,
            "patient_reference": patient.patient_reference
        }

        try:
            existing_bank_response = requests.get(
                "http://127.0.0.1:8001/bank/funding-requests",
                params={
                    "page": 1,
                    "page_size": 50,
                    "status": "ALL",
                    "search": case.case_reference
                },
                timeout=5
            )

            if existing_bank_response.ok:
                existing_bank_data = (
                    existing_bank_response.json()
                )

                existing_requests = (
                    existing_bank_data.get(
                        "funding_requests",
                        []
                    )
                )

                for existing_request in existing_requests:
                    if (
                        existing_request.get(
                            "case_reference"
                        )
                        == case.case_reference
                    ):
                        return {
                            "success": True,
                            "message": (
                                "Funding request already exists."
                            ),
                            "funding_request": existing_request
                        }

        except requests.RequestException:
            pass

        # ==================================================
        # 8. GENERATE MEDBRIDGE REFERENCES
        # ==================================================

        funding_reference = (
            f"FUND-IN-{uuid4().hex[:8].upper()}"
        )

        medbridge_transaction_reference = (
            f"MB-TXN-{uuid4().hex[:12].upper()}"
        )

        # ==================================================
        # 9. CREATE BANK FUNDING REQUEST
        # ==================================================

        bank_response = requests.post(
            "http://127.0.0.1:8001/bank/funding-requests",
            params={
                "funding_reference":
                    funding_reference,

                "medbridge_transaction_reference":
                    medbridge_transaction_reference,

                "case_reference":
                    case.case_reference,

                "patient_reference":
                    patient.patient_reference,

                "hospital_id":
                    case.hospital_id,

                "hospital_account_reference":
                    hospital.bank_account_reference,

                "requested_amount":
                    int(case.approved_amount)
            },
            timeout=10
        )

        if not bank_response.ok:
            try:
                bank_error = bank_response.json()
            except Exception:
                bank_error = {}

            raise HTTPException(
                status_code=502,
                detail=(
                    bank_error.get(
                        "detail",
                        "Bank funding request failed."
                    )
                )
            )

        bank_data = bank_response.json()

        return {
            "success": True,
            "message": (
                "Funding request created successfully."
            ),
            "case_id": case.id,
            "case_reference": case.case_reference,
            "patient_reference": patient.patient_reference,
            "funding_request":
                bank_data.get("funding_request")
        }

    except HTTPException:
        db.rollback()
        raise

    except requests.RequestException:
        db.rollback()

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to connect to the MedBridge "
                "Bank service."
            )
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
@app.get("/payments/status/{case_id}")
def payment_status(
    case_id: int,
    current_user=Depends(get_current_user)
):
    db = SessionLocal()

    try:
        case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if not case:
            raise HTTPException(
                status_code=404,
                detail="Medical case not found."
            )

        transactions = (
            db.query(models.PaymentTransaction)
            .filter(
                models.PaymentTransaction.case_id == case_id
            )
            .order_by(
                models.PaymentTransaction.created_at.desc()
            )
            .all()
        )

        return {
            "case_id": case.id,
            "case_reference": case.case_reference,
            "transaction_count": len(transactions),
            "transactions": [
                {
                    "transaction_reference":
                        transaction.transaction_reference,

                    "allocation_id":
                        transaction.allocation_id,

                    "donor_id":
                        transaction.donor_id,

                    "amount":
                        transaction.amount,

                    "payment_status":
                        transaction.payment_status,

                    "destination_reference":
                        transaction.destination_reference,

                    "created_at":
                        transaction.created_at,

                    "completed_at":
                        transaction.completed_at
                }
                for transaction in transactions
            ]
        }

    finally:
        db.close()
@app.get("/payments")
def get_all_payments(
    current_user=Depends(get_current_user)
):
    db = SessionLocal()

    try:
        transactions = (
            db.query(models.PaymentTransaction)
            .order_by(
                models.PaymentTransaction.created_at.desc()
            )
            .all()
        )

        return {
            "transaction_count": len(transactions),
            "transactions": [
                {
                    "transaction_reference":
                        transaction.transaction_reference,

                    "allocation_id":
                        transaction.allocation_id,

                    "case_id":
                        transaction.case_id,

                    "donor_id":
                        transaction.donor_id,

                    "amount":
                        transaction.amount,

                    "payment_status":
                        transaction.payment_status,

                    "destination_reference":
                        transaction.destination_reference,

                    "created_at":
                        transaction.created_at,

                    "completed_at":
                        transaction.completed_at
                }
                for transaction in transactions
            ]
        }

    finally:
        db.close()
@app.post("/risk/evaluate/{case_id}")
def evaluate_case_risk(
    case_id: int,
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR")
    )
):

    result = evaluate_case(case_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result
@app.get("/audit/case/{case_id}")
def get_case_audit_logs(
    case_id: int,
    current_user=Depends(
        require_roles("ADMIN", "AUDITOR")
    )
):

    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Check that the medical case exists
        # --------------------------------------------------

        case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Medical case not found."
            )

        # --------------------------------------------------
        # 2. Find all allocations belonging to this case
        # --------------------------------------------------

        allocations = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.case_id == case_id
            )
            .all()
        )

        allocation_ids = [
            allocation.id
            for allocation in allocations
        ]

        # --------------------------------------------------
        # 3. Get case-level audit logs
        # --------------------------------------------------

        case_logs = (
            db.query(models.AuditLog)
            .filter(
                models.AuditLog.entity_type == "CASE",
                models.AuditLog.entity_id == case_id
            )
            .all()
        )

        # --------------------------------------------------
        # 4. Get allocation-level audit logs
        # --------------------------------------------------

        allocation_logs = []

        if allocation_ids:

            allocation_logs = (
            db.query(models.AuditLog)
            .filter(
                models.AuditLog.entity_type.in_(
                    ["ALLOCATION", "PAYMENT"]
                ),
                models.AuditLog.entity_id.in_(allocation_ids)
            )
            .all()
        )

        # --------------------------------------------------
        # 5. Combine all audit events
        # --------------------------------------------------

        logs = case_logs + allocation_logs

        logs.sort(
            key=lambda log: log.created_at
        )

        # --------------------------------------------------
        # 6. Return complete case audit history
        # --------------------------------------------------

        return {
            "success": True,
            "case_id": case.id,
            "case_reference": case.case_reference,
            "audit_count": len(logs),
            "audit_logs": [
                {
                    "event_reference":
                        log.event_reference,

                    "event_type":
                        log.event_type,

                    "entity_type":
                        log.entity_type,

                    "entity_id":
                        log.entity_id,

                    "action":
                        log.action,

                    "status":
                        log.status,

                    "details":
                        log.details,

                    "created_at":
                        log.created_at
                }
                for log in logs
            ]
        }

    finally:
        db.close()
@app.get("/audit/summary/{case_id}")
def get_audit_summary(
    case_id: int,
    current_user=Depends(
        require_roles("ADMIN", "AUDITOR")
    )
):

    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Check that the case exists
        # --------------------------------------------------

        case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if case is None:
            raise HTTPException(
                status_code=404,
                detail="Medical case not found."
            )

        # --------------------------------------------------
        # 2. Find allocations belonging to this case
        # --------------------------------------------------

        allocations = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.case_id == case_id
            )
            .all()
        )

        allocation_ids = [
            allocation.id
            for allocation in allocations
        ]

        # --------------------------------------------------
        # 3. Get case-level audit logs
        # --------------------------------------------------

        case_logs = (
            db.query(models.AuditLog)
            .filter(
                models.AuditLog.entity_type == "CASE",
                models.AuditLog.entity_id == case_id
            )
            .all()
        )

        # --------------------------------------------------
        # 4. Get allocation/payment audit logs
        # --------------------------------------------------

        related_logs = []

        if allocation_ids:

            related_logs = (
                db.query(models.AuditLog)
                .filter(
                    models.AuditLog.entity_type.in_(
                        ["ALLOCATION", "PAYMENT"]
                    ),
                    models.AuditLog.entity_id.in_(
                        allocation_ids
                    )
                )
                .all()
            )

        logs = case_logs + related_logs

        # --------------------------------------------------
        # 5. Determine security events
        # --------------------------------------------------

        funding_success = any(
            log.action == "FUNDING_ALLOCATION"
            and log.status == "SUCCESS"
            for log in logs
        )

        payment_success = any(
            log.action == "PROCESS_PAYMENT"
            and log.status == "SUCCESS"
            for log in logs
        )

        blocked_attempts = sum(
            1
            for log in logs
            if log.status == "BLOCKED"
        )

        # --------------------------------------------------
        # 6. Determine overall security status
        # --------------------------------------------------

        if blocked_attempts > 0:
            security_status = "PROTECTED"
        elif funding_success and payment_success:
            security_status = "SECURE"
        elif funding_success:
            security_status = "FUNDING_ONLY"
        else:
            security_status = "NO_SECURITY_EVENTS"

        # --------------------------------------------------
        # 7. Return summary
        # --------------------------------------------------

        return {
            "success": True,
            "case_id": case.id,
            "case_reference": case.case_reference,
            "funding": (
                "SUCCESS"
                if funding_success
                else "NOT_COMPLETED"
            ),
            "payment": (
                "SETTLED"
                if payment_success
                else "NOT_SETTLED"
            ),
            "blocked_attempts": blocked_attempts,
            "security_status": security_status,
            "audit_event_count": len(logs)
        }

    finally:
        db.close()
@app.post("/auth/login")
def login(
    email: str = Query(
        min_length=5,
        max_length=255
    ),
    password: str = Query(
        min_length=1,
        max_length=255
    )
):
    result = authenticate_user(
        email,
        password
    )

    if not result["success"]:
        raise HTTPException(
            status_code=401,
            detail=result["message"]
        )

    access_token = create_access_token(
    result["user_id"],
    result["role"]

    )

    return {
        "success": True,
        "message": "Authentication successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": result["user_id"],
            "full_name": result["full_name"],
            "email": result["email"],
            "role": result["role"],
            "status": result["status"]
        }
}
@app.get("/auth/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):
    return {
        "success": True,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status
    }
@app.get("/auth/admin-test")
def admin_test(
    current_user=Depends(
        require_roles("ADMIN")
    )
):
    return {
        "success": True,
        "message": "Admin authorization successful.",
        "user_id": current_user.id,
        "role": current_user.role
    }
@app.get("/dashboard/summary")
def get_dashboard_summary(
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR", "AUDITOR")
    )
):

    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Count medical cases
        # --------------------------------------------------

        active_cases = (
            db.query(func.count(models.MedicalCase.id))
            .scalar()
            or 0
        )

        # --------------------------------------------------
        # 2. Get all allocations
        # --------------------------------------------------

        allocations = (
            db.query(models.DonationAllocation)
            .all()
        )

        funded_case_ids = {
            allocation.case_id
            for allocation in allocations
            if allocation.allocation_status == "SETTLED"
        }

        funded_cases = len(funded_case_ids)

        # --------------------------------------------------
        # 3. Get settled funding from Bank System
        # --------------------------------------------------
        total_funding = 0

        try:
            bank_response = requests.get(
                "http://127.0.0.1:8001/bank/funding-requests",
                params={
                    "status": "SETTLED",
                    "page": 1,
                    "page_size": 50
                },
                timeout=5
            )

            if bank_response.ok:
                bank_data = bank_response.json()

                funding_requests = bank_data.get(
                    "funding_requests",
                    []
                )

                total_funding = sum(
                    request.get("settled_amount") or 0
                    for request in funding_requests
                )

        except requests.RequestException:
            total_funding = 0

        # --------------------------------------------------
        # 4. Count security events
        # --------------------------------------------------

        security_events = (
            db.query(func.count(models.AuditLog.id))
            .filter(
                models.AuditLog.entity_type == "AUTHORIZATION"
            )
            .scalar()
            or 0
        )

        # --------------------------------------------------
        # 5. Return dashboard information
        # --------------------------------------------------

        return {
            "success": True,
            "role": current_user.role,
            "active_cases": active_cases,
            "funded_cases": funded_cases,
            "total_funding": float(total_funding),
            "security_events": security_events
        }

    finally:
        db.close()
@app.get("/cases")
def get_medical_cases(
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR", "AUDITOR")
    )
):

    db = SessionLocal()

    try:
        cases = (
            db.query(models.MedicalCase)
            .order_by(
                models.MedicalCase.created_at.desc()
            )
            .all()
        )

        return {
            "success": True,
            "count": len(cases),
            "cases": [
                {
                    "case_id": case.id,
                    "case_reference": case.case_reference,
                    "hospital_id": case.hospital_id,
                    "patient_id": case.patient_id,
                    "emergency_type": case.emergency_type,
                    "diagnosis_category": (
                        case.diagnosis_category
                    ),
                    "requested_amount": (
                        case.requested_amount
                    ),
                    "approved_amount": (
                        case.approved_amount
                    ),
                    "urgency_score": (
                        case.urgency_score
                    ),
                    "fraud_probability": (
                        case.fraud_probability
                    ),
                    "risk_level": case.risk_level,
                    "status": case.status,
                    "created_at": case.created_at
                }
                for case in cases
            ]
        }

    finally:
        db.close()
class MedicalCaseCreate(BaseModel):
    patient_id: int
    emergency_type: str
    diagnosis_category: str | None = None
    requested_amount: int = Field(..., gt=0)
@app.post("/cases")
def create_medical_case(
    case_data: MedicalCaseCreate,
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR")
    )
):
    db = SessionLocal()

    try:

        user = (
            db.query(models.User)
            .filter(
                models.User.id == current_user.id
            )
            .first()
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="Authenticated user not found."
            )

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.id == case_data.patient_id
            )
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found."
            )

        if user.role == "DOCTOR" and user.hospital_id is None:
            raise HTTPException(
                status_code=403,
                detail="Doctor is not assigned to a hospital."
            )

        case = models.MedicalCase(
            case_reference=(
                f"MB-CASE-{uuid4().hex[:12].upper()}"
            ),

            hospital_id=user.hospital_id,

            patient_id=case_data.patient_id,

            emergency_type=case_data.emergency_type,

            diagnosis_category=(
                case_data.diagnosis_category
            ),

            requested_amount=(
                case_data.requested_amount
            ),

            approved_amount=0,

            urgency_score=0,

            fraud_probability=0,

            risk_level="PENDING",

            status="PENDING",

            created_at=datetime.utcnow()
        )

        db.add(case)
        db.commit()
        db.refresh(case)

        return {
            "success": True,
            "message": "Medical case created successfully.",
            "case_id": case.id,
            "case_reference": case.case_reference,
            "patient_id": case.patient_id,
            "hospital_id": case.hospital_id,
            "requested_amount": case.requested_amount,
            "status": case.status
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: str
    government_id_reference: str = Field(
        ...,
        min_length=3,
        max_length=255
    )
    age: int = Field(..., ge=0, le=150)
    gender: str | None = None
@app.get("/patients")
def get_patients(
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR")
    )
):
    db = SessionLocal()

    try:
        patients = (
            db.query(models.Patient)
            .order_by(
                models.Patient.created_at.desc()
            )
            .all()
        )

        return {
            "success": True,
            "count": len(patients),
            "patients": [
    {
        "patient_id": patient.id,
        "patient_reference": patient.patient_reference,

        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "government_id_reference":
            patient.government_id_reference,

        "age": patient.age,
        "gender": patient.gender,
        "identity_status": patient.identity_status,
        "created_at": patient.created_at
    }
    for patient in patients
]
        }

    finally:
        db.close()
class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: str
    government_id_reference: str = Field(
        ...,
        min_length=3,
        max_length=255
    )
    age: int = Field(..., ge=0, le=150)
    gender: str | None = None
@app.post("/patients")
def create_patient(
    patient_data: PatientCreate,
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR")
    )
):
    db = SessionLocal()

    try:
        last_patient = (
            db.query(models.Patient)
            .order_by(models.Patient.id.desc())
            .first()
        )

        next_number = (
            last_patient.id + 1
            if last_patient
            else 1
        )

        patient_reference = (
            f"PAT-MB-{next_number:06d}"
        )

        try:
            date_of_birth = datetime.strptime(
                patient_data.date_of_birth,
                "%Y-%m-%d"
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date of birth. Use YYYY-MM-DD."
            )

        patient = models.Patient(
            patient_reference=patient_reference,
            full_name=patient_data.full_name.strip(),
            date_of_birth=date_of_birth,
            government_id_reference=(
                patient_data.government_id_reference.strip()
            ),
            age=patient_data.age,
            gender=patient_data.gender,
            identity_status="PENDING",
            created_at=datetime.utcnow()
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

        return {
            "success": True,
            "patient": {
                "patient_id": patient.id,
                "patient_reference": patient.patient_reference,
                "age": patient.age,
                "gender": patient.gender,
                "identity_status": patient.identity_status,
                "created_at": patient.created_at
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
@app.post("/patients/{patient_reference}/verification")
async def submit_patient_verification(
    patient_reference: str,

    full_name: str = Form(...),
    date_of_birth: str = Form(...),
    government_id_reference: str = Form(...),

    medical_condition: str = Form(...),
    treatment_required: str = Form(...),
    estimated_cost: int = Form(..., gt=0),

    medical_document: UploadFile = File(...),

    current_user=Depends(
        require_roles("DOCTOR")
    )
):
    db = SessionLocal()

    try:

        # ==================================================
        # 1. FIND PATIENT
        # ==================================================

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.patient_reference
                == patient_reference
            )
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found."
            )

        # ==================================================
        # SAVE PATIENT IDENTITY INFORMATION
        # ==================================================

        patient.full_name = full_name.strip()

        patient.government_id_reference = (
            government_id_reference.strip()
        )

        try:
            patient.date_of_birth = datetime.strptime(
                date_of_birth,
                "%Y-%m-%d"
            )

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date of birth. Use YYYY-MM-DD."
            )

        # ==================================================
        # 2. FIND DOCTOR
        # ==================================================

        doctor = (
            db.query(models.User)
            .filter(
                models.User.id
                == current_user.id
            )
            .first()
        )

        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor account not found."
            )

        # ==================================================
        # DOCTOR DEBUG
        # ==================================================

        print("==============================================")
        print("PATIENT VERIFICATION DEBUG")
        print("patient_id:", patient.id)
        print(
            "patient_reference:",
            patient.patient_reference
        )
        print(
            "doctor_id:",
            current_user.id
        )
        print(
            "doctor_hospital_id:",
            doctor.hospital_id
        )
        print("==============================================")

        # ==================================================
        # 3. DEBUG ALL PATIENT MEDICAL CASES
        # ==================================================

        print("==============================================")
        print("PATIENT CASE DEBUG")
        print("patient_id:", patient.id)
        print(
            "patient_reference:",
            patient.patient_reference
        )

        all_cases = (
            db.query(models.MedicalCase)
            .filter(
                models.MedicalCase.patient_id
                == patient.id
            )
            .order_by(
                models.MedicalCase.created_at.desc()
            )
            .all()
        )

        print(
            "TOTAL CASES:",
            len(all_cases)
        )

        if not all_cases:
            print(
                "NO MEDICAL CASES FOUND FOR THIS PATIENT"
            )

        for c in all_cases:

            print("----------------------------------------------")

            print(
                "CASE ID:",
                c.id
            )

            print(
                "CASE REFERENCE:",
                c.case_reference
            )

            print(
                "PATIENT ID:",
                c.patient_id
            )

            print(
                "HOSPITAL ID:",
                c.hospital_id
            )

            print(
                "DOCTOR HOSPITAL ID:",
                doctor.hospital_id
            )

            print(
                "STATUS:",
                c.status
            )

            print(
                "REQUESTED AMOUNT:",
                c.requested_amount
            )

            print(
                "APPROVED AMOUNT:",
                c.approved_amount
            )

            print(
                "RISK LEVEL:",
                c.risk_level
            )

            print(
                "CREATED AT:",
                c.created_at
            )

            # ------------------------------------------
            # CHECK VERIFICATION FORM
            # ------------------------------------------

            existing_verification_form = (
                db.query(models.VerificationForm)
                .filter(
                    models.VerificationForm.case_id
                    == c.id
                )
                .first()
            )

            if existing_verification_form:

                print(
                    "VERIFICATION FORM:",
                    existing_verification_form.form_reference
                )

                print(
                    "VERIFICATION STATUS:",
                    existing_verification_form
                    .verification_status
                )

            else:

                print(
                    "VERIFICATION FORM: NONE"
                )

            # ------------------------------------------
            # CHECK VERIFICATION RESULT
            # ------------------------------------------

            existing_verification_result = (
                db.query(models.VerificationResult)
                .filter(
                    models.VerificationResult.case_id
                    == c.id
                )
                .first()
            )

            if existing_verification_result:

                print(
                    "VERIFICATION RESULT:",
                    existing_verification_result
                    .result_reference
                )

                print(
                    "RESULT STATUS:",
                    existing_verification_result
                    .verification_status
                )

            else:

                print(
                    "VERIFICATION RESULT: NONE"
                )

        print("==============================================")

        # ==================================================
        # 4. FIND PENDING MEDICAL CASE
        # ==================================================

        case = (
            db.query(models.MedicalCase)
            .filter(
                models.MedicalCase.patient_id
                == patient.id,

                models.MedicalCase.hospital_id
                == doctor.hospital_id,

                models.MedicalCase.status
                == "PENDING"
            )
            .order_by(
                models.MedicalCase.created_at.desc()
            )
            .first()
        )

        # ==================================================
        # CASE NOT FOUND
        # ==================================================

        if case is None:

            print("==============================================")
            print("NO PENDING CASE FOUND")
            print(
                "patient_id:",
                patient.id
            )
            print(
                "patient_reference:",
                patient.patient_reference
            )
            print(
                "doctor_hospital_id:",
                doctor.hospital_id
            )
            print("==============================================")

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No pending medical case found. "
                    f"patient_id={patient.id}, "
                    f"doctor_hospital_id={doctor.hospital_id}"
                )
            )

        # ==================================================
        # CASE FOUND
        # ==================================================

        print("==============================================")
        print("PENDING CASE FOUND")
        print(
            "case_id:",
            case.id
        )
        print(
            "case_reference:",
            case.case_reference
        )
        print(
            "hospital_id:",
            case.hospital_id
        )
        print(
            "status:",
            case.status
        )
        print("==============================================")

        # ==================================================
        # 5. PREVENT DUPLICATE ACTIVE VERIFICATION
        # ==================================================

        existing_form = (
            db.query(models.VerificationForm)
            .filter(
                models.VerificationForm.case_id
                == case.id,

                models.VerificationForm.verification_status
                == "PENDING"
            )
            .first()
        )

        if existing_form:

            raise HTTPException(
                status_code=409,
                detail=(
                    "A verification application is "
                    "already pending for this case."
                )
            )

        # ==================================================
        # 6. VALIDATE FILE
        # ==================================================

        allowed_types = {
            "application/pdf",
            "image/jpeg",
            "image/png"
        }

        if medical_document.content_type not in allowed_types:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid document type. "
                    "Only PDF, JPG, JPEG and PNG "
                    "files are accepted."
                )
            )

        # ==================================================
        # 7. READ FILE
        # ==================================================

        file_contents = (
            await medical_document.read()
        )

        if not file_contents:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Uploaded medical document "
                    "is empty."
                )
            )

        # ==================================================
        # 8. CALCULATE SHA-256 HASH
        # ==================================================

        file_hash = hashlib.sha256(
            file_contents
        ).hexdigest()

        # ==================================================
        # 9. CREATE STORAGE DIRECTORY
        # ==================================================

        storage_directory = os.path.join(
            "uploads",
            "medical"
        )

        os.makedirs(
            storage_directory,
            exist_ok=True
        )

        # ==================================================
        # 10. CREATE SAFE STORAGE NAME
        # ==================================================

        stored_filename = (
            f"{uuid4().hex}_"
            f"{medical_document.filename}"
        )

        storage_path = os.path.join(
            storage_directory,
            stored_filename
        )

        # ==================================================
        # 11. SAVE DOCUMENT
        # ==================================================

        with open(
            storage_path,
            "wb"
        ) as buffer:

            buffer.write(
                file_contents
            )

        # ==================================================
        # 12. CREATE VERIFICATION REFERENCES
        # ==================================================

        form_reference = (
            f"VF-MB-{uuid4().hex[:12].upper()}"
        )

        qr_code = (
            f"MBVERIFY-{uuid4().hex}"
        )

        # ==================================================
        # 13. CREATE VERIFICATION FORM
        # ==================================================

        verification_form = (
            models.VerificationForm(

                form_reference=
                    form_reference,

                case_id=
                    case.id,

                hospital_id=
                    case.hospital_id,

                doctor_id=
                    current_user.id,

                patient_id=
                    patient.id,

                emergency_type=
                    case.emergency_type,

                diagnosis_category=
                    case.diagnosis_category
                    or "UNSPECIFIED",

                treatment_required=
                    treatment_required,

                admission_date=
                    datetime.utcnow(),

                estimated_cost=
                    estimated_cost,

                amount_already_available=
                    0,

                amount_required=
                    estimated_cost,

                doctor_declaration=(
                    "Authenticated doctor submitted "
                    "patient verification application."
                ),

                doctor_signature_reference=(
                    f"AUTH-DOCTOR-{current_user.id}"
                ),

                qr_verification_code=
                    qr_code,

                verification_status=
                    "PENDING",

                submitted_at=
                    datetime.utcnow()
            )
        )

        db.add(
            verification_form
        )

        db.flush()

        # ==================================================
        # 14. CREATE MEDICAL DOCUMENT RECORD
        # ==================================================

        medical_document_record = (
            models.MedicalDocument(

                document_reference=(
                    f"DOC-MB-"
                    f"{uuid4().hex[:12].upper()}"
                ),

                case_id=
                    case.id,

                verification_form_id=
                    verification_form.id,

                document_type=
                    "MEDICAL_SUPPORTING_DOCUMENT",

                original_filename=
                    medical_document.filename,

                content_type=
                    medical_document.content_type,

                file_hash=
                    file_hash,

                storage_reference=
                    storage_path,

                uploaded_by=
                    current_user.id,

                integrity_status=
                    "UNVERIFIED",

                uploaded_at=
                    datetime.utcnow()
            )
        )

        db.add(
            medical_document_record
        )

        # ==================================================
        # 15. CREATE VERIFICATION RESULT
        # ==================================================

        verification_result = (
            models.VerificationResult(

                result_reference=(
                    f"VR-MB-"
                    f"{uuid4().hex[:12].upper()}"
                ),

                case_id=
                    case.id,

                verification_form_id=
                    verification_form.id,

                # -----------------------------------------
                # AUTOMATED CHECKS
                # -----------------------------------------

                hospital_check=
                    "PENDING",

                doctor_check=
                    "PENDING",

                document_integrity_check=
                    "PENDING",

                digital_signature_check=
                    "PENDING",

                information_match_check=
                    "PENDING",

                qr_verification_check=
                    "PENDING",

                # -----------------------------------------
                # RISK
                # -----------------------------------------

                trust_score=
                    0,

                risk_level=
                    "PENDING",

                verification_status=
                    "PENDING",

                medical_urgency=
                    "NORMAL",

                escalation_required=
                    "NO",

                escalation_level=
                    "NONE",

                verification_notes=(
                    "Supporting medical document received. "
                    "Automated verification checks are "
                    "pending."
                ),

                created_at=
                    datetime.utcnow()
            )
        )

        db.add(
            verification_result
        )

        # ==================================================
        # 16. UPDATE PATIENT
        # ==================================================

        patient.identity_status = (
            "UNDER_REVIEW"
        )

        # ==================================================
        # 17. UPDATE CASE
        # ==================================================

        case.status = (
            "UNDER_VERIFICATION"
        )

        # ==================================================
        # 18. SAVE EVERYTHING
        # ==================================================

        db.commit()
                # ==================================================
        # 18A. RUN AUTOMATED VERIFICATION
        # ==================================================

        verification_check_result = run_verification(
            case.id
        )

        if not verification_check_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=(
                    verification_check_result.get(
                        "message",
                        "Automated verification failed."
                    )
                )
            )

        # ==================================================
        # 18B. RUN RISK EVALUATION
        # ==================================================

        risk_result = evaluate_case(
            case.id
        )

        if not risk_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=(
                    risk_result.get(
                        "message",
                        "Risk evaluation failed."
                    )
                )
            )
        # ==================================================
        # 19. REFRESH OBJECTS
        # ==================================================

        db.refresh(
            verification_form
        )

        db.refresh(
            medical_document_record
        )

        db.refresh(
            verification_result
        )
                # ==================================================
        # 19A. RUN AUTOMATED VERIFICATION
        # ==================================================

        verification_check = run_verification(
            case.id
        )

        if not verification_check["success"]:
            raise HTTPException(
                status_code=500,
                detail=verification_check["message"]
            )
        # ==================================================
        # 20. SUCCESS DEBUG
        # ==================================================

        print("==============================================")
        print("PATIENT VERIFICATION SUCCESS")
        print(
            "patient_id:",
            patient.id
        )
        print(
            "case_id:",
            case.id
        )
        print(
            "case_reference:",
            case.case_reference
        )
        print(
            "verification_form:",
            verification_form.form_reference
        )
        print(
            "verification_result:",
            verification_result.result_reference
        )
        print(
            "case_status:",
            case.status
        )
        print(
            "patient_identity_status:",
            patient.identity_status
        )
        print("==============================================")

        # ==================================================
        # 21. RESPONSE
        # ==================================================

        return {

            "success": True,

            "message": (
                "Patient application submitted "
                "successfully for verification."
            ),

            "patient": {

                "patient_id":
                    patient.id,

                "patient_reference":
                    patient.patient_reference,

                "full_name":
                    patient.full_name,

                "date_of_birth":
                    patient.date_of_birth,

                "government_id_reference":
                    patient.government_id_reference,

                "age":
                    patient.age,

                "gender":
                    patient.gender,

                "identity_status":
                    patient.identity_status,

                "created_at":
                    patient.created_at
            },

            "case": {

                "case_id":
                    case.id,

                "case_reference":
                    case.case_reference,

                "status":
                    case.status
            },

            "verification": {

                "form_reference":
                    verification_form.form_reference,

                "result_reference":
                    verification_result.result_reference,

                "verification_status":
                    verification_result
                    .verification_status,

                "document_reference":
                    medical_document_record
                    .document_reference,

                "document_hash":
                    file_hash,

                "qr_verification_code":
                    verification_form
                    .qr_verification_code
            }
        }

    # ======================================================
    # HTTP EXCEPTION
    # ======================================================

    except HTTPException:

        db.rollback()

        raise

    # ======================================================
    # UNEXPECTED ERROR
    # ======================================================

    except Exception as e:

        db.rollback()

        print("==============================================")
        print("PATIENT VERIFICATION ERROR")
        print(
            "ERROR:",
            str(e)
        )
        print("==============================================")

        raise

    # ======================================================
    # CLOSE DATABASE
    # ======================================================

    finally:

        db.close()
@app.get("/patients/{patient_reference}/details")
def get_patient_details(
    patient_reference: str,
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR", "AUDITOR")
    )
):
    db = SessionLocal()

    try:
        # ==================================================
        # 1. FIND PATIENT
        # ==================================================

        patient = (
            db.query(models.Patient)
            .filter(
                models.Patient.patient_reference
                == patient_reference
            )
            .first()
        )

        if patient is None:
            raise HTTPException(
                status_code=404,
                detail="Patient not found."
            )

        # ==================================================
        # 2. FIND ALL MEDICAL CASES
        # ==================================================

        cases = (
            db.query(models.MedicalCase)
            .filter(
                models.MedicalCase.patient_id
                == patient.id
            )
            .order_by(
                models.MedicalCase.created_at.desc()
            )
            .all()
        )

        case_details = []

        # ==================================================
        # 3. BUILD CASE INFORMATION
        # ==================================================

        for case in cases:

            # ----------------------------------------------
            # VERIFICATION RESULT
            # ----------------------------------------------

            verification_result = (
                db.query(models.VerificationResult)
                .filter(
                    models.VerificationResult.case_id
                    == case.id
                )
                .first()
            )

            # ----------------------------------------------
            # VERIFICATION FORM
            # ----------------------------------------------

            verification_form = (
                db.query(models.VerificationForm)
                .filter(
                    models.VerificationForm.case_id
                    == case.id
                )
                .first()
            )

            # ----------------------------------------------
            # DONATION ALLOCATIONS
            # ----------------------------------------------

            allocations = (
                db.query(models.DonationAllocation)
                .filter(
                    models.DonationAllocation.case_id
                    == case.id
                )
                .all()
            )

            total_allocated = sum(
                allocation.allocated_amount
                for allocation in allocations
            )

            total_settled = sum(
                allocation.allocated_amount
                for allocation in allocations
                if allocation.allocation_status
                == "SETTLED"
            )

            total_pending = sum(
                allocation.allocated_amount
                for allocation in allocations
                if allocation.allocation_status
                == "PENDING"
            )

            remaining_amount = max(
                case.approved_amount - total_allocated,
                0
            )

            # ----------------------------------------------
            # FUNDING STATUS
            # ----------------------------------------------

            if case.approved_amount <= 0:

                funding_status_value = "NOT_APPROVED"

            elif remaining_amount == 0:

                funding_status_value = "FULLY_FUNDED"

            elif total_allocated > 0:

                funding_status_value = "PARTIALLY_FUNDED"

            else:

                funding_status_value = "NOT_FUNDED"

            # ----------------------------------------------
            # PAYMENT TRANSACTIONS
            # ----------------------------------------------

            transactions = (
                db.query(models.PaymentTransaction)
                .filter(
                    models.PaymentTransaction.case_id
                    == case.id
                )
                .order_by(
                    models.PaymentTransaction.created_at.desc()
                )
                .all()
            )

            total_paid = sum(
                transaction.amount
                for transaction in transactions
            )

            total_payment_settled = sum(
                transaction.amount
                for transaction in transactions
                if transaction.payment_status
                == "SETTLED"
            )

            # ----------------------------------------------
            # PAYMENT STATUS
            # ----------------------------------------------

            if case.approved_amount <= 0:

                payment_status_value = "NOT_APPROVED"

            elif total_payment_settled >= case.approved_amount:

                payment_status_value = "FULLY_SETTLED"

            elif total_paid > 0:

                payment_status_value = "PARTIALLY_SETTLED"

            else:

                payment_status_value = "NOT_STARTED"

            # ==================================================
            # 4. BUILD FUNDING JOURNEY
            # ==================================================

            registration_status = "COMPLETED"

            # Identity
            if patient.identity_status == "VERIFIED":

                identity_status = "COMPLETED"

            elif patient.identity_status == "UNDER_REVIEW":

                identity_status = "IN_PROGRESS"

            else:

                identity_status = "PENDING"

            # Medical case
            if case:

                medical_case_status = "COMPLETED"

            else:

                medical_case_status = "PENDING"

            # Verification
            if verification_result:

                if (
                    verification_result.verification_status
                    == "VERIFIED"
                ):

                    verification_status_value = "COMPLETED"

                elif (
                    verification_result.verification_status
                    == "REVIEW_REQUIRED"
                ):

                    verification_status_value = "IN_PROGRESS"

                else:

                    verification_status_value = "PENDING"

            elif verification_form:

                verification_status_value = "IN_PROGRESS"

            else:

                verification_status_value = "PENDING"

            # Risk
            if case.risk_level == "LOW":

                risk_status = "COMPLETED"

            elif case.risk_level in [
                "MEDIUM",
                "HIGH"
            ]:

                risk_status = "COMPLETED"

            else:

                risk_status = "PENDING"

            # Funding
            if funding_status_value == "FULLY_FUNDED":

                funding_stage_status = "COMPLETED"

            elif funding_status_value == "PARTIALLY_FUNDED":

                funding_stage_status = "IN_PROGRESS"

            else:

                funding_stage_status = "PENDING"

            # Bank settlement
            if payment_status_value == "FULLY_SETTLED":

                settlement_status = "COMPLETED"

            elif payment_status_value == "PARTIALLY_SETTLED":

                settlement_status = "IN_PROGRESS"

            else:

                settlement_status = "PENDING"

            # ==================================================
            # 5. ADD CASE
            # ==================================================

            case_details.append({

                "case_id":
                    case.id,

                "case_reference":
                    case.case_reference,

                "emergency_type":
                    case.emergency_type,

                "diagnosis_category":
                    case.diagnosis_category,

                "requested_amount":
                    case.requested_amount,

                "approved_amount":
                    case.approved_amount,

                "urgency_score":
                    case.urgency_score,

                "fraud_probability":
                    case.fraud_probability,

                "risk_level":
                    case.risk_level,

                "status":
                    case.status,

                "created_at":
                    case.created_at,

                # ------------------------------
                # VERIFICATION
                # ------------------------------

                "verification": {

                    "form_reference":
                        (
                            verification_form.form_reference
                            if verification_form
                            else None
                        ),

                    "verification_status":
                        (
                            verification_result.verification_status
                            if verification_result
                            else (
                                verification_form.verification_status
                                if verification_form
                                else None
                            )
                        ),

                    "trust_score":
                        (
                            verification_result.trust_score
                            if verification_result
                            else None
                        ),

                    "risk_level":
                        (
                            verification_result.risk_level
                            if verification_result
                            else None
                        ),

                    "verified_at":
                        (
                            verification_form.verified_at
                            if verification_form
                            else None
                        )
                },

                # ------------------------------
                # FUNDING
                # ------------------------------

                "funding": {

                    "requested_amount":
                        case.requested_amount,

                    "approved_amount":
                        case.approved_amount,

                    "total_allocated":
                        total_allocated,

                    "total_settled":
                        total_settled,

                    "total_pending":
                        total_pending,

                    "remaining_amount":
                        remaining_amount,

                    "funding_status":
                        funding_status_value,

                    "allocation_count":
                        len(allocations)
                },

                # ------------------------------
                # PAYMENTS
                # ------------------------------

                "payments": {

                    "transaction_count":
                        len(transactions),

                    "total_paid":
                        total_paid,

                    "total_settled":
                        total_payment_settled,

                    "payment_status":
                        payment_status_value,

                    "transactions": [

                        {
                            "transaction_reference":
                                transaction.transaction_reference,

                            "allocation_id":
                                transaction.allocation_id,

                            "donor_id":
                                transaction.donor_id,

                            "amount":
                                transaction.amount,

                            "payment_status":
                                transaction.payment_status,

                            "destination_reference":
                                transaction.destination_reference,

                            "created_at":
                                transaction.created_at,

                            "completed_at":
                                transaction.completed_at
                        }

                        for transaction in transactions
                    ]
                },

                # ------------------------------
                # VISUAL JOURNEY
                # ------------------------------

                "journey": [

                    {
                        "stage":
                            "REGISTRATION",

                        "label":
                            "Patient Registration",

                        "status":
                            registration_status,

                        "date":
                            patient.created_at
                    },

                    {
                        "stage":
                            "IDENTITY_VERIFICATION",

                        "label":
                            "Identity Verification",

                        "status":
                            identity_status,

                        "date":
                            (
                                verification_form.verified_at
                                if (
                                    verification_form
                                    and verification_form.verified_at
                                )
                                else None
                            )
                    },

                    {
                        "stage":
                            "MEDICAL_CASE",

                        "label":
                            "Medical Case",

                        "status":
                            medical_case_status,

                        "date":
                            case.created_at
                    },

                    {
                        "stage":
                            "RISK_EVALUATION",

                        "label":
                            "Risk Evaluation",

                        "status":
                            risk_status,

                        "risk_level":
                            case.risk_level
                    },

                    {
                        "stage":
                            "FUNDING",

                        "label":
                            "Funding",

                        "status":
                            funding_stage_status,

                        "amount":
                            total_allocated,

                        "target":
                            case.approved_amount
                    },

                    {
                        "stage":
                            "BANK_SETTLEMENT",

                        "label":
                            "Bank Settlement",

                        "status":
                            settlement_status,

                        "amount":
                            total_payment_settled,

                        "target":
                            case.approved_amount
                    }
                ]
            })

        # ==================================================
        # 6. RESPONSE
        # ==================================================

        return {

            "success": True,

            "patient": {

                "patient_id":
                    patient.id,

                "patient_reference":
                    patient.patient_reference,

                "full_name":
                    patient.full_name,

                "date_of_birth":
                    patient.date_of_birth,

                "government_id_reference":
                    patient.government_id_reference,

                "age":
                    patient.age,

                "gender":
                    patient.gender,

                "identity_status":
                    patient.identity_status,

                "created_at":
                    patient.created_at
            },

            "case_count":
                len(case_details),

            "medical_cases":
                case_details
        }

    finally:
        db.close()
@app.post("/verification/run/{case_id}")
def run_case_verification(
    case_id: int,
    current_user=Depends(
        require_roles("ADMIN", "DOCTOR")
    )
):

    result = run_verification(case_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result