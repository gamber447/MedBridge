from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import func, or_
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from models import BankAccount, BankTransaction, BankAuditLog

import models
from uuid import uuid4
from datetime import datetime

from bank_service import process_bank_payment

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedBridge Bank API",
    description="Simulated banking service connected to MedBridge",
    version="1.0.0"
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


@app.get("/")
def root():
    return {
        "success": True,
        "service": "MedBridge Bank",
        "status": "ONLINE"
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "bank-api",
        "status": "HEALTHY"
    }
@app.post("/bank/payments")
def receive_payment(
    medbridge_transaction_reference: str,
    idempotency_key: str = Query(
        min_length=8,
        max_length=150
    ),
    hospital_account_reference: str = Query(
        min_length=1,
        max_length=255
    ),
    hospital_id: int = Query(),
    case_id: int = Query(),
    amount: int = Query(gt=0)
):
    result = process_bank_payment(
        medbridge_transaction_reference=
            medbridge_transaction_reference,
        idempotency_key=idempotency_key,
        hospital_account_reference=
            hospital_account_reference,
        hospital_id=hospital_id,
        case_id=case_id,
        amount=amount
    )

    if not result["success"]:
        if result.get("duplicate"):
            raise HTTPException(
                status_code=409,
                detail=result
            )

        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result
@app.get("/bank/audit")
def get_bank_audit_logs():
    from database import SessionLocal

    db = SessionLocal()

    try:
        logs = (
            db.query(BankAuditLog)
            .order_by(
                BankAuditLog.created_at.desc()
            )
            .all()
        )

        return {
            "success": True,
            "count": len(logs),
            "audit_logs": [
                {
                    "event_reference":
                        log.event_reference,
                    "event_type":
                        log.event_type,
                    "action":
                        log.action,
                    "transaction_reference":
                        log.transaction_reference,
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
@app.get("/bank/transactions")
def get_bank_transactions():
    db = SessionLocal()

    try:
        transactions = (
            db.query(models.BankTransaction)
            .order_by(
                models.BankTransaction.created_at.desc()
            )
            .all()
        )

        return {
            "success": True,
            "count": len(transactions),
            "transactions": [
                {
                    "transaction_reference":
                        transaction.transaction_reference,

                    "medbridge_transaction_reference":
                        transaction.medbridge_transaction_reference,

                    "hospital_account_reference":
                        transaction.hospital_account_reference,

                    "hospital_id":
                        transaction.hospital_id,

                    "case_id":
                        transaction.case_id,

                    "amount":
                        transaction.amount,

                    "transaction_type":
                        transaction.transaction_type,

                    "transaction_status":
                        transaction.transaction_status,

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

@app.get("/bank/donors/statistics")
def donor_statistics():

    db = SessionLocal()

    try:

        # ==========================================================
        # TOTAL DONORS
        # ==========================================================

        total_donors = (
            db.query(models.Donor)
            .count()
        )

        # ==========================================================
        # LATEST CONSENT FOR EACH DONOR
        # ==========================================================

        latest_consent_subquery = (
            db.query(
                models.DonorConsent.donor_id,
                func.max(
                    models.DonorConsent.id
                ).label("latest_consent_id")
            )
            .group_by(
                models.DonorConsent.donor_id
            )
            .subquery()
        )

        # ==========================================================
        # ACTIVE
        # ==========================================================

        active_count = (
            db.query(models.Donor)
            .join(
                latest_consent_subquery,
                latest_consent_subquery.c.donor_id
                == models.Donor.id
            )
            .join(
                models.DonorConsent,
                models.DonorConsent.id
                == latest_consent_subquery.c.latest_consent_id
            )
            .filter(
                models.DonorConsent.consent_status
                == "ACTIVE"
            )
            .count()
        )

        # ==========================================================
        # PENDING
        # ==========================================================

        pending_count = (
            db.query(models.Donor)
            .join(
                latest_consent_subquery,
                latest_consent_subquery.c.donor_id
                == models.Donor.id
            )
            .join(
                models.DonorConsent,
                models.DonorConsent.id
                == latest_consent_subquery.c.latest_consent_id
            )
            .filter(
                models.DonorConsent.consent_status
                == "PENDING"
            )
            .count()
        )

        # ==========================================================
        # DECLINED
        # ==========================================================

        declined_count = (
            db.query(models.Donor)
            .join(
                latest_consent_subquery,
                latest_consent_subquery.c.donor_id
                == models.Donor.id
            )
            .join(
                models.DonorConsent,
                models.DonorConsent.id
                == latest_consent_subquery.c.latest_consent_id
            )
            .filter(
                models.DonorConsent.consent_status
                == "DECLINED"
            )
            .count()
        )

        return {

            "success": True,

            "bank_reference":
                "BANK-IN-001",

            "total_donors":
                total_donors,

            "active_consent":
                active_count,

            "pending_consent":
                pending_count,

            "declined_consent":
                declined_count,

            "eligible_for_funding":
                active_count
        }

    finally:
        db.close()
@app.get("/bank/donors")
def get_bank_donors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=100),
    consent_status: str = Query("ALL"),
    donation_status: str = Query("ALL")
):
    db = SessionLocal()

    try:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)

        consent_status = (
            consent_status
            .strip()
            .upper()
        )

        donation_status = (
            donation_status
            .strip()
            .upper()
        )

        search = search.strip()

        allowed_consent = {
            "ALL",
            "ACTIVE",
            "PENDING",
            "DECLINED"
        }

        allowed_donation = {
            "ALL",
            "DONATED",
            "NOT_DONATED"
        }

        if consent_status not in allowed_consent:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid consent_status. "
                    "Use ALL, ACTIVE, PENDING "
                    "or DECLINED."
                )
            )

        if donation_status not in allowed_donation:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid donation_status. "
                    "Use ALL, DONATED "
                    "or NOT_DONATED."
                )
            )

        # --------------------------------------------------
        # Latest consent per donor
        # --------------------------------------------------

        latest_consent_subquery = (
            db.query(
                models.DonorConsent.donor_id,
                func.max(
                    models.DonorConsent.id
                ).label(
                    "latest_consent_id"
                )
            )
            .group_by(
                models.DonorConsent.donor_id
            )
            .subquery()
        )

        # --------------------------------------------------
        # Latest contribution per donor
        # --------------------------------------------------

        latest_contribution_subquery = (
            db.query(
                models.DonorContribution.donor_id,
                func.max(
                    models.DonorContribution.id
                ).label(
                    "latest_contribution_id"
                )
            )
            .group_by(
                models.DonorContribution.donor_id
            )
            .subquery()
        )

        query = (
            db.query(
                models.Donor,
                models.DonorConsent,
                models.DonorContribution
            )
            .outerjoin(
                latest_consent_subquery,
                latest_consent_subquery.c.donor_id
                == models.Donor.id
            )
            .outerjoin(
                models.DonorConsent,
                models.DonorConsent.id
                == latest_consent_subquery.c.latest_consent_id
            )
            .outerjoin(
                latest_contribution_subquery,
                latest_contribution_subquery.c.donor_id
                == models.Donor.id
            )
            .outerjoin(
                models.DonorContribution,
                models.DonorContribution.id
                == latest_contribution_subquery.c.latest_contribution_id
            )
        )

        # --------------------------------------------------
        # Search
        # --------------------------------------------------

        if search:
            search_value = (
                f"%{search}%"
            )

            if search.isdigit():
                query = query.filter(
                    or_(
                        models.Donor.id
                        == int(search),

                        models.Donor.full_name.ilike(
                            search_value
                        ),

                        models.Donor.donor_reference.ilike(
                            search_value
                        ),

                        models.Donor.account_reference.ilike(
                            search_value
                        )
                    )
                )
            else:
                query = query.filter(
                    or_(
                        models.Donor.full_name.ilike(
                            search_value
                        ),

                        models.Donor.donor_reference.ilike(
                            search_value
                        ),

                        models.Donor.account_reference.ilike(
                            search_value
                        )
                    )
                )

        # --------------------------------------------------
        # Consent filter
        # --------------------------------------------------

        if consent_status != "ALL":
            query = query.filter(
                models.DonorConsent.consent_status
                == consent_status
            )

        # --------------------------------------------------
        # Donation status filter
        # --------------------------------------------------

        if donation_status == "DONATED":
            query = query.filter(
                models.DonorContribution.id
                != None
            )

        elif donation_status == "NOT_DONATED":
            query = query.filter(
                models.DonorContribution.id
                == None
            )

        # --------------------------------------------------
        # Total
        # --------------------------------------------------

        total_count = (
            query
            .with_entities(
                func.count(
                    func.distinct(
                        models.Donor.id
                    )
                )
            )
            .scalar()
        )

        total_count = (
            total_count or 0
        )

        total_pages = (
            (
                total_count
                + page_size
                - 1
            )
            // page_size
            if total_count > 0
            else 0
        )

        # --------------------------------------------------
        # Pagination
        # --------------------------------------------------

        offset = (
            page - 1
        ) * page_size

        rows = (
            query
            .order_by(
                models.Donor.created_at.desc(),
                models.Donor.id.desc()
            )
            .offset(offset)
            .limit(page_size)
            .all()
        )

        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        donor_list = []

        for (
            donor,
            consent,
            contribution
        ) in rows:

            actual_contribution = (
                contribution.amount
                if contribution
                else 0
            )

            donor_list.append({
                "donor_id":
                    donor.id,

                "bank_id":
                    donor.bank_id,

                "donor_reference":
                    donor.donor_reference,

                "full_name":
                    donor.full_name,

                "account_reference":
                    donor.account_reference,

                "account_status":
                    donor.account_status,

                "consent_status":
                    (
                        consent.consent_status
                        if consent
                        else "NO_CONSENT"
                    ),

                "consent_reference":
                    (
                        consent.consent_reference
                        if consent
                        else None
                    ),

                "consent_scope":
                    (
                        consent.consent_scope
                        if consent
                        else None
                    ),

                "maximum_contribution":
                    (
                        consent.maximum_contribution
                        if consent
                        else 0
                    ),

                "consented_at":
                    (
                        consent.consented_at
                        if consent
                        else None
                    ),

                "actual_contribution":
                    actual_contribution,

                "donation_status":
                    (
                        "DONATED"
                        if contribution
                        else "NOT_DONATED"
                    ),

                "contribution_reference":
                    (
                        contribution.contribution_reference
                        if contribution
                        else None
                    ),

                "contribution_status":
                    (
                        contribution.status
                        if contribution
                        else None
                    ),

                "transaction_reference":
                    (
                        contribution.transaction_reference
                        if contribution
                        else None
                    ),

                "contributed_at":
                    (
                        contribution.created_at
                        if contribution
                        else None
                    ),

                "created_at":
                    donor.created_at
            })

        return {
            "success": True,

            "count":
                len(donor_list),

            "total_count":
                total_count,

            "page":
                page,

            "page_size":
                page_size,

            "total_pages":
                total_pages,

            "has_next":
                page < total_pages,

            "has_previous":
                page > 1,

            "consent_status":
                consent_status,

            "donation_status":
                donation_status,

            "search":
                search,

            "donors":
                donor_list
        }

    finally:
        db.close()
@app.get("/bank/donors/{donor_reference}")
def get_bank_donor(
    donor_reference: str
):
    db = SessionLocal()

    try:
        donor_reference = (
            donor_reference.strip()
        )

        donor = (
            db.query(models.Donor)
            .filter(
                models.Donor.donor_reference
                == donor_reference
            )
            .first()
        )

        if donor is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Donor "
                    f"{donor_reference} "
                    f"not found."
                )
            )

        # --------------------------------------------------
        # Latest consent
        # --------------------------------------------------

        consent = (
            db.query(
                models.DonorConsent
            )
            .filter(
                models.DonorConsent.donor_id
                == donor.id
            )
            .order_by(
                models.DonorConsent.id.desc()
            )
            .first()
        )

        # --------------------------------------------------
        # Latest contribution
        # --------------------------------------------------

        contribution = (
            db.query(
                models.DonorContribution
            )
            .filter(
                models.DonorContribution.donor_id
                == donor.id
            )
            .order_by(
                models.DonorContribution.id.desc()
            )
            .first()
        )

        donor_data = {
            "donor_id":
                donor.id,

            "bank_id":
                donor.bank_id,

            "donor_reference":
                donor.donor_reference,

            "full_name":
                donor.full_name,

            "account_reference":
                donor.account_reference,

            "account_status":
                donor.account_status,

            "consent_status":
                (
                    consent.consent_status
                    if consent
                    else "NO_CONSENT"
                ),

            "consent_reference":
                (
                    consent.consent_reference
                    if consent
                    else None
                ),

            "consent_scope":
                (
                    consent.consent_scope
                    if consent
                    else None
                ),

            "maximum_contribution":
                (
                    consent.maximum_contribution
                    if consent
                    else 0
                ),

            "consented_at":
                (
                    consent.consented_at
                    if consent
                    else None
                ),

            "actual_contribution":
                (
                    contribution.amount
                    if contribution
                    else 0
                ),

            "donation_status":
                (
                    "DONATED"
                    if contribution
                    else "NOT_DONATED"
                ),

            "contribution_reference":
                (
                    contribution.contribution_reference
                    if contribution
                    else None
                ),

            "contribution_status":
                (
                    contribution.status
                    if contribution
                    else None
                ),

            "transaction_reference":
                (
                    contribution.transaction_reference
                    if contribution
                    else None
                ),

            "contributed_at":
                (
                    contribution.created_at
                    if contribution
                    else None
                ),

            "created_at":
                donor.created_at
        }

        return {
            "success": True,
            "donor": donor_data
        }

    finally:
        db.close()
@app.get("/bank/donors/recent-contributions")
def get_recent_donor_contributions():
    db = SessionLocal()

    try:
        contributions = (
            db.query(
                models.DonorContribution,
                models.Donor
            )
            .join(
                models.Donor,
                models.Donor.id
                == models.DonorContribution.donor_id
            )
            .order_by(
                models.DonorContribution.created_at.desc()
            )
            .limit(10)
            .all()
        )

        return {
            "success": True,
            "count": len(contributions),
            "contributions": [
                {
                    "contribution_id":
                        contribution.id,

                    "contribution_reference":
                        contribution.contribution_reference,

                    "donor_id":
                        donor.id,

                    "donor_reference":
                        donor.donor_reference,

                    "full_name":
                        donor.full_name,

                    "amount":
                        contribution.amount,

                    "status":
                        contribution.status,

                    "transaction_reference":
                        contribution.transaction_reference,

                    "created_at":
                        contribution.created_at,

                    "completed_at":
                        contribution.completed_at,
                }
                for contribution, donor
                in contributions
            ],
        }

    finally:
        db.close()
@app.post("/bank/funding-requests")
def create_funding_request(
    funding_reference: str,
    medbridge_transaction_reference: str,
    case_reference: str,
    patient_reference: str,
    hospital_id: int,
    hospital_account_reference: str,
    requested_amount: int
):
    db = SessionLocal()

    try:
        if requested_amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Requested amount must be greater than zero."
            )

        existing = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.funding_reference
                == funding_reference
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Funding request already exists."
            )

        request = models.FundingRequest(
            funding_reference=funding_reference,
            medbridge_transaction_reference=(
                medbridge_transaction_reference
            ),
            case_reference=case_reference,
            patient_reference=patient_reference,
            hospital_id=hospital_id,
            hospital_account_reference=(
                hospital_account_reference
            ),
            requested_amount=requested_amount,
            allocated_amount=0,
            settled_amount=0,
            status="PENDING",
            created_at=datetime.utcnow()
        )

        db.add(request)
        db.commit()
        db.refresh(request)

        return {
            "success": True,
            "message": "Funding request created successfully.",
            "funding_request": {
                "id": request.id,
                "funding_reference":
                    request.funding_reference,
                "medbridge_transaction_reference":
                    request.medbridge_transaction_reference,
                "case_reference":
                    request.case_reference,
                "patient_reference":
                    request.patient_reference,
                "hospital_id":
                    request.hospital_id,
                "hospital_account_reference":
                    request.hospital_account_reference,
                "requested_amount":
                    request.requested_amount,
                "allocated_amount":
                    request.allocated_amount,
                "settled_amount":
                    request.settled_amount,
                "status":
                    request.status,
                "created_at":
                    request.created_at
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
@app.post("/bank/funding-requests/{funding_id}/allocate")
def allocate_funding(funding_id: int):
    db = SessionLocal()

    try:
        funding_request = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.id == funding_id
            )
            .first()
        )

        if funding_request is None:
            raise HTTPException(
                status_code=404,
                detail="Funding request not found."
            )

        # --------------------------------------------------
        # 2. Prevent duplicate allocation
        # --------------------------------------------------

        if funding_request.status != "PENDING":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Funding request cannot be allocated "
                    f"because its status is "
                    f"{funding_request.status}."
                )
            )

        remaining_amount = (
            funding_request.requested_amount
        )

        allocations = []

        # --------------------------------------------------
        # 3. Find eligible donors
        # --------------------------------------------------

        eligible_donors = (
            db.query(
                models.Donor,
                models.DonorConsent,
                models.BankAccount
            )
            .join(
                models.DonorConsent,
                models.DonorConsent.donor_id
                == models.Donor.id
            )
            .join(
                models.BankAccount,
                models.BankAccount.donor_id
                == models.Donor.id
            )
            .filter(
                models.Donor.bank_id == 1,
                models.Donor.account_status == "ACTIVE",
                models.DonorConsent.consent_status == "ACTIVE",
                models.DonorConsent.consent_scope
                == "MEDICAL_FUNDING",
                models.BankAccount.account_type == "DONOR",
                models.BankAccount.account_status == "ACTIVE"
            )
            .order_by(
                models.Donor.id.asc()
            )
            .all()
        )

        if not eligible_donors:
            raise HTTPException(
                status_code=409,
                detail="No eligible donors found."
            )

        # --------------------------------------------------
        # 4. Allocate and reserve funds
        # --------------------------------------------------

        for donor, consent, account in eligible_donors:

            if remaining_amount <= 0:
                break

            # Available money
            available_balance = (
                account.balance
                - account.reserved_balance
            )

            if available_balance <= 0:
                continue

            # Consent limit
            consent_limit = (
                consent.maximum_contribution
            )

            if consent_limit <= 0:
                continue

            # Maximum this donor can contribute
            contribution_amount = min(
                available_balance,
                consent_limit,
                remaining_amount
            )

            if contribution_amount <= 0:
                continue

            # ----------------------------------------------
            # Reserve donor funds
            # ----------------------------------------------

            account.reserved_balance += (
                contribution_amount
            )

            # ----------------------------------------------
            # Create allocation
            # ----------------------------------------------

            allocation = models.FundingAllocation(
                allocation_reference=(
                    f"ALLOC-IN-{funding_request.id}-"
                    f"{donor.id}"
                ),

                funding_request_id=(
                    funding_request.id
                ),

                donor_id=donor.id,

                consent_reference=(
                    consent.consent_reference
                ),

                allocated_amount=(
                    contribution_amount
                ),

                status="RESERVED",

                created_at=datetime.utcnow(),

                settled_at=None
            )

            db.add(allocation)

            allocations.append({
                "allocation_reference":
                    allocation.allocation_reference,

                "donor_reference":
                    donor.donor_reference,

                "account_reference":
                    account.account_reference,

                "consent_reference":
                    consent.consent_reference,

                "allocated_amount":
                    contribution_amount,

                "reserved_balance":
                    account.reserved_balance,

                "available_balance":
                    (
                        account.balance
                        - account.reserved_balance
                    )
            })

            remaining_amount -= (
                contribution_amount
            )

        # --------------------------------------------------
        # 5. Not enough funds
        # --------------------------------------------------

        if remaining_amount > 0:
            db.rollback()

            raise HTTPException(
                status_code=409,
                detail={
                    "message":
                        "Insufficient eligible donor funds.",

                    "requested_amount":
                        funding_request.requested_amount,

                    "allocated_amount":
                        (
                            funding_request.requested_amount
                            - remaining_amount
                        ),

                    "remaining_amount":
                        remaining_amount
                }
            )

        # --------------------------------------------------
        # 6. Update funding request
        # --------------------------------------------------

        funding_request.allocated_amount = (
            funding_request.requested_amount
        )

        funding_request.status = "ALLOCATED"

        db.commit()

        return {
            "success": True,

            "message":
                "Funding allocated and donor funds "
                "reserved successfully.",

            "funding_request": {
                "funding_reference":
                    funding_request.funding_reference,

                "requested_amount":
                    funding_request.requested_amount,

                "allocated_amount":
                    funding_request.allocated_amount,

                "settled_amount":
                    funding_request.settled_amount,

                "status":
                    funding_request.status
            },

            "donor_count":
                len(allocations),

            "allocations":
                allocations
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
@app.post("/bank/funding-requests/{funding_id}/settle")
def settle_funding(funding_id: int):
    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Find funding request
        # --------------------------------------------------

        funding_request = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.id == funding_id
            )
            .first()
        )

        if funding_request is None:
            raise HTTPException(
                status_code=404,
                detail="Funding request not found."
            )

        # --------------------------------------------------
        # 2. Settlement state checks
        # --------------------------------------------------

        if funding_request.status == "SETTLED":
            raise HTTPException(
                status_code=409,
                detail="Funding request is already settled."
            )

        if funding_request.status != "ALLOCATED":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Funding request must be ALLOCATED "
                    "before settlement."
                )
            )

        # --------------------------------------------------
        # 3. Get allocations
        # --------------------------------------------------

        allocations = (
            db.query(models.FundingAllocation)
            .filter(
                models.FundingAllocation.funding_request_id
                == funding_request.id
            )
            .all()
        )

        if not allocations:
            raise HTTPException(
                status_code=409,
                detail="No donor allocations found."
            )

        total_allocated = sum(
            allocation.allocated_amount
            for allocation in allocations
        )

        if total_allocated != funding_request.requested_amount:
            raise HTTPException(
                status_code=409,
                detail={
                    "message":
                        "Allocation total does not match "
                        "funding request.",

                    "requested_amount":
                        funding_request.requested_amount,

                    "allocated_amount":
                        total_allocated
                }
            )

        # --------------------------------------------------
        # 4. Find hospital account
        # --------------------------------------------------

        hospital_account = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_reference
                == funding_request.hospital_account_reference,

                models.BankAccount.hospital_id
                == funding_request.hospital_id,

                models.BankAccount.account_type
                == "HOSPITAL",

                models.BankAccount.account_status
                == "ACTIVE"
            )
            .first()
        )

        if hospital_account is None:
            raise HTTPException(
                status_code=404,
                detail="Active hospital account not found."
            )

        # --------------------------------------------------
        # Find MedBridge central account
        # --------------------------------------------------

        medbridge_account = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_reference
                == "MEDBRIDGE-001",

                models.BankAccount.account_type
                == "MEDBRIDGE",

                models.BankAccount.account_status
                == "ACTIVE"
            )
            .first()
        )

        if medbridge_account is None:
            raise HTTPException(
                status_code=404,
                detail="Active MedBridge account not found."
            )

        # --------------------------------------------------
        # 5. Idempotency protection
        # --------------------------------------------------

        idempotency_key = (
            "MEDBRIDGE-FUNDING-SETTLEMENT-"
            f"{funding_request.funding_reference}"
        )

        existing_transaction = (
            db.query(models.BankTransaction)
            .filter(
                models.BankTransaction
                .medbridge_transaction_reference
                ==
                funding_request.medbridge_transaction_reference,

                models.BankTransaction.transaction_type
                ==
                "MEDBRIDGE_TO_HOSPITAL",

                models.BankTransaction.transaction_status
                ==
                "SETTLED"
            )
            .first()
        )

        if existing_transaction:
            raise HTTPException(
                status_code=409,
                detail="Settlement already processed."
            )

        now = datetime.utcnow()

        # --------------------------------------------------
        # 6. Validate and debit every donor account
        # --------------------------------------------------

        contribution_records = []
        donor_transaction_records = []

        for allocation in allocations:

            donor_account = (
                db.query(models.BankAccount)
                .filter(
                    models.BankAccount.donor_id
                    == allocation.donor_id,

                    models.BankAccount.account_type
                    == "DONOR",

                    models.BankAccount.account_status
                    == "ACTIVE"
                )
                .first()
            )

            if donor_account is None:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Donor bank account not found "
                        f"for donor {allocation.donor_id}."
                    )
                )

            # Make sure the allocated money is still reserved.
            if (
                donor_account.reserved_balance
                < allocation.allocated_amount
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Insufficient reserved funds "
                        f"for donor {allocation.donor_id}."
                    )
                )

            # Make sure actual balance can cover it.
            if (
                donor_account.balance
                < allocation.allocated_amount
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Insufficient donor account "
                        f"balance for donor "
                        f"{allocation.donor_id}."
                    )
                )

        # --------------------------------------------------
        # 8. Debit donors + create contribution records
        # --------------------------------------------------

        for allocation in allocations:

            donor_account = (
    db.query(models.BankAccount)
    .filter(
        models.BankAccount.donor_id
        == allocation.donor_id,

        models.BankAccount.account_type
        == "DONOR",

        models.BankAccount.account_status
        == "ACTIVE"
    )
    .first()
)

            amount = allocation.allocated_amount

            # Actual debit
            donor_account.balance -= amount

            # Release reservation
            donor_account.reserved_balance -= amount

            medbridge_account.balance += amount

            donor_to_medbridge_transaction = models.BankTransaction(
                transaction_reference=(
                    "BANK-DONOR-"
                    f"{uuid4().hex[:12].upper()}"
                ),

                medbridge_transaction_reference=(
                    funding_request.medbridge_transaction_reference
                ),

                idempotency_key=(
                    f"{idempotency_key}-DONOR-{allocation.donor_id}"
                ),

                source_account_reference=(
                    donor_account.account_reference
                ),

                hospital_account_reference=(
                    medbridge_account.account_reference
                ),

                hospital_id=(
                    funding_request.hospital_id
                ),

                case_id=None,

                amount=amount,

                transaction_type="DONOR_TO_MEDBRIDGE",

                transaction_status="SETTLED",

                created_at=now,

                completed_at=now
            )

            db.add(donor_to_medbridge_transaction)
            donor_transaction_records.append({
    "transaction_reference":
        donor_to_medbridge_transaction.transaction_reference,

    "source_account_reference":
        donor_to_medbridge_transaction.source_account_reference,

    "destination_account_reference":
        donor_to_medbridge_transaction.hospital_account_reference,

    "amount":
        donor_to_medbridge_transaction.amount,

    "transaction_type":
        donor_to_medbridge_transaction.transaction_type,

    "transaction_status":
        donor_to_medbridge_transaction.transaction_status,

    "completed_at":
        donor_to_medbridge_transaction.completed_at
})

            

            contribution = models.DonorContribution(
                contribution_reference=(
                    "CONTRIB-"
                    f"{funding_request.id}-"
                    f"{allocation.donor_id}"
                ),

                funding_request_id=(
                    funding_request.id
                ),

                donor_id=(
                    allocation.donor_id
                ),

                donor_account_reference=(
                    donor_account.account_reference
                ),

                consent_reference=(
                    allocation.consent_reference
                ),

                allocation_id=(
                    allocation.id
                ),

                amount=amount,

               transaction_reference=(
                 donor_to_medbridge_transaction
                    .transaction_reference
                ),

                status="SETTLED",

                created_at=now,

                completed_at=now
            )

            db.add(contribution)

            contribution_records.append({
                "contribution_reference":
                    contribution.contribution_reference,

                "donor_id":
                    contribution.donor_id,

                "donor_account_reference":
                    contribution.donor_account_reference,

                "amount":
                    contribution.amount,

                "status":
                    contribution.status
            })

            allocation.status = "SETTLED"
            allocation.settled_at = now

        # --------------------------------------------------
        # 9. Transfer ONE consolidated amount
        #    from MedBridge to Hospital
        # --------------------------------------------------

        total_funding_amount = (
            funding_request.requested_amount
        )

        if medbridge_account.balance < total_funding_amount:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Insufficient MedBridge account balance "
                    "for hospital settlement."
                )
            )

        # ONE consolidated transfer
        medbridge_account.balance -= (
            total_funding_amount
        )

        hospital_account.balance += (
            total_funding_amount
        )
        medbridge_to_hospital_transaction = models.BankTransaction(
            transaction_reference=(
                "BANK-MED-"
                f"{uuid4().hex[:12].upper()}"
            ),

            medbridge_transaction_reference=(
                funding_request.medbridge_transaction_reference
            ),

            idempotency_key=(
                f"{idempotency_key}-HOSPITAL"
            ),

            source_account_reference=(
                medbridge_account.account_reference
            ),

            hospital_account_reference=(
                hospital_account.account_reference
            ),

            hospital_id=(
                funding_request.hospital_id
            ),

            case_id=None,

            amount=total_funding_amount,

            transaction_type="MEDBRIDGE_TO_HOSPITAL",

            transaction_status="SETTLED",

            created_at=now,

            completed_at=now
        )

        db.add(medbridge_to_hospital_transaction)


        # --------------------------------------------------
        # 11. Update funding request
        # --------------------------------------------------

        funding_request.allocated_amount = (
            total_allocated
        )

        funding_request.settled_amount = (
            total_allocated
        )

        funding_request.status = "SETTLED"

        funding_request.completed_at = now

        # --------------------------------------------------
        # 12. Audit log
        # --------------------------------------------------

        audit = models.BankAuditLog(
            event_reference=(
                "BANK-AUDIT-"
                f"{uuid4().hex[:12].upper()}"
            ),

            event_type="FUNDING_SETTLEMENT",

            action="MEDIBRIDGE_TO_HOSPITAL_SETTLEMENT",

            transaction_reference=(
        medbridge_to_hospital_transaction
        .transaction_reference
    ),

            status="SUCCESS",

            details=(
    f"Funding="
    f"{funding_request.funding_reference}; "
    f"Source account="
    f"{medbridge_account.account_reference}; "
    f"Hospital account="
    f"{hospital_account.account_reference}; "
    f"Hospital ID="
    f"{funding_request.hospital_id}; "
    f"Donors involved="
    f"{len(allocations)}; "
    f"Amount="
    f"{funding_request.requested_amount}; "
    f"Transfer=ONE_CONSOLIDATED_PAYMENT; "
    f"Status=SETTLED"
),

            created_at=now
        )

        db.add(audit)

        # --------------------------------------------------
        # 13. Commit everything atomically
        # --------------------------------------------------

        db.commit()

        return {
            "success": True,

            "message":
                "Funding settled successfully.",

            "funding_request": {
                "funding_reference":
                    funding_request.funding_reference,

                "requested_amount":
                    funding_request.requested_amount,

                "allocated_amount":
                    funding_request.allocated_amount,

                "settled_amount":
                    funding_request.settled_amount,

                "status":
                    funding_request.status
            },

            "bank_transactions": {
    "donor_to_medbridge": donor_transaction_records,

    "medbridge_to_hospital": {
        "transaction_reference":
            medbridge_to_hospital_transaction.transaction_reference,

        "source_account_reference":
            medbridge_to_hospital_transaction.source_account_reference,

        "destination_account_reference":
            medbridge_to_hospital_transaction.hospital_account_reference,

        "amount":
            medbridge_to_hospital_transaction.amount,

        "transaction_type":
            medbridge_to_hospital_transaction.transaction_type,

        "transaction_status":
            medbridge_to_hospital_transaction.transaction_status,

        "completed_at":
            medbridge_to_hospital_transaction.completed_at
    }
},

            "contribution_summary": {
                "donor_count":
                    len(contribution_records),

                "total_contributed":
                    sum(
                        item["amount"]
                        for item
                        in contribution_records
                    ),

                "contributions":
                    contribution_records
            },

            "hospital_account": {
                "account_reference":
                    hospital_account
                    .account_reference,

                "new_balance":
                    hospital_account.balance
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
@app.get("/bank/funding-requests/{funding_id}/contributions")
def get_funding_contributions(funding_id: int):
    db = SessionLocal()

    try:
        # Check that the funding request exists
        funding = (
            db.query(models.FundingRequest)
            .filter(models.FundingRequest.id == funding_id)
            .first()
        )

        if not funding:
            raise HTTPException(
                status_code=404,
                detail="Funding request not found"
            )

        # Get donor contributions for this funding request
        contributions = (
            db.query(
                models.DonorContribution,
                models.Donor
            )
            .join(
                models.Donor,
                models.Donor.id == models.DonorContribution.donor_id
            )
            .filter(
                models.DonorContribution.funding_request_id == funding_id
            )
            .order_by(
                models.DonorContribution.created_at.asc()
            )
            .all()
        )

        return {
            "success": True,
            "funding_id": funding.id,
            "funding_reference": funding.funding_reference,
            "requested_amount": funding.requested_amount,
            "allocated_amount": funding.allocated_amount,
            "settled_amount": funding.settled_amount,
            "status": funding.status,

            "contribution_count": len(contributions),

            "total_contributed": sum(
                contribution.amount
                for contribution, donor in contributions
            ),

            "contributions": [
                {
                    "contribution_id": contribution.id,
                    "contribution_reference":
                        contribution.contribution_reference,

                    "donor_id": donor.id,
                    "donor_reference":
                        donor.donor_reference,
                    "donor_name":
                        donor.full_name,
                    "donor_account_reference":
                        donor.account_reference,

                    "consent_reference":
                        contribution.consent_reference,

                    "amount":
                        contribution.amount,

                    "transaction_reference":
                        contribution.transaction_reference,

                    "status":
                        contribution.status,

                    "created_at":
                        contribution.created_at,

                    "completed_at":
                        contribution.completed_at,
                }

                for contribution, donor in contributions
            ]
        }

    finally:
        db.close()
@app.get("/bank/admin/funding-requests/{funding_id}")
def get_admin_funding_details(funding_id: int):
    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Find funding request
        # --------------------------------------------------

        funding_request = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.id == funding_id
            )
            .first()
        )

        if funding_request is None:
            raise HTTPException(
                status_code=404,
                detail="Funding request not found."
            )

        # --------------------------------------------------
        # 2. Get allocations
        # --------------------------------------------------

        allocations = (
            db.query(models.FundingAllocation)
            .filter(
                models.FundingAllocation.funding_request_id
                == funding_request.id
            )
            .order_by(
                models.FundingAllocation.id.asc()
            )
            .all()
        )

        donor_details = []

        for allocation in allocations:

            donor = (
                db.query(models.Donor)
                .filter(
                    models.Donor.id
                    == allocation.donor_id
                )
                .first()
            )

            account = (
                db.query(models.BankAccount)
                .filter(
                    models.BankAccount.donor_id
                    == allocation.donor_id,

                    models.BankAccount.account_type
                    == "DONOR",

                    models.BankAccount.account_status
                    == "ACTIVE"
                )
                .first()
            )

            contribution = (
                db.query(models.DonorContribution)
                .filter(
                    models.DonorContribution.allocation_id
                    == allocation.id
                )
                .first()
            )

            donor_details.append({
                "donor_id":
                    donor.id if donor else None,

                "donor_reference":
                    donor.donor_reference
                    if donor else None,

                "donor_name":
                    donor.full_name
                    if donor else None,

                "donor_account_reference":
                    account.account_reference
                    if account else None,

                "consent_reference":
                    allocation.consent_reference,

                "allocation_reference":
                    allocation.allocation_reference,

                "allocated_amount":
                    allocation.allocated_amount,

                "allocation_status":
                    allocation.status,

                "contribution_reference":
                    (
                        contribution.contribution_reference
                        if contribution else None
                    ),

                "contributed_amount":
                    (
                        contribution.amount
                        if contribution else 0
                    ),

                "contribution_status":
                    (
                        contribution.status
                        if contribution else None
                    ),

                "settled_at":
                    allocation.settled_at
            })

        # --------------------------------------------------
        # 3. Find bank transactions
        # --------------------------------------------------

        transactions = (
            db.query(models.BankTransaction)
            .filter(
                models.BankTransaction
                .medbridge_transaction_reference
                ==
                funding_request
                .medbridge_transaction_reference
            )
            .order_by(
                models.BankTransaction.id.asc()
            )
            .all()
        )

        # --------------------------------------------------
        # 4. Find audit records
        # --------------------------------------------------

        audit_logs = []

        for transaction_item in transactions:

            logs = (
                db.query(models.BankAuditLog)
                .filter(
                    models.BankAuditLog
                    .transaction_reference
                    ==
                    transaction_item.transaction_reference
                )
                .order_by(
                    models.BankAuditLog.id.asc()
                )
                .all()
            )

            audit_logs.extend(logs)

        # --------------------------------------------------
        # 5. Return admin view
        # --------------------------------------------------

        return {
            "success": True,

            "funding_request": {
                "id":
                    funding_request.id,

                "funding_reference":
                    funding_request.funding_reference,

                "medbridge_transaction_reference":
                    funding_request
                    .medbridge_transaction_reference,

                "case_reference":
                    funding_request.case_reference,

                "patient_reference":
                    funding_request.patient_reference,

                "hospital_id":
                    funding_request.hospital_id,

                "hospital_account_reference":
                    funding_request
                    .hospital_account_reference,

                "requested_amount":
                    funding_request.requested_amount,

                "allocated_amount":
                    funding_request.allocated_amount,

                "settled_amount":
                    funding_request.settled_amount,

                "status":
                    funding_request.status,

                "created_at":
                    funding_request.created_at,

                "completed_at":
                    funding_request.completed_at
            },

            "donor_summary": {
                "donor_count":
                    len(donor_details),

                "total_allocated":
                    sum(
                        item["allocated_amount"]
                        for item in donor_details
                    ),

                "total_contributed":
                    sum(
                        item["contributed_amount"]
                        for item in donor_details
                    )
            },

            "donors":
                donor_details,

            "bank_transactions": [
                {
                    "transaction_reference":
                        item.transaction_reference,

                    "source_account_reference":
                        item.source_account_reference,

                    "destination_account_reference":
                        item.hospital_account_reference,

                    "amount":
                        item.amount,

                    "transaction_type":
                        item.transaction_type,

                    "transaction_status":
                        item.transaction_status,

                    "created_at":
                        item.created_at,

                    "completed_at":
                        item.completed_at
                }
                for item in transactions
            ],

            "audit_logs": [
                {
                    "event_reference":
                        log.event_reference,

                    "event_type":
                        log.event_type,

                    "action":
                        log.action,

                    "status":
                        log.status,

                    "details":
                        log.details,

                    "created_at":
                        log.created_at
                }
                for log in audit_logs
            ]
        }

    finally:
        db.close()

@app.get("/bank/funding-requests")
def get_bank_funding_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: str = Query("ALL"),
    search: str = Query("", max_length=100)
):
    db = SessionLocal()

    try:
        # --------------------------------------------------
        # NORMALISE INPUT
        # --------------------------------------------------

        status = status.strip().upper()
        search = search.strip()

        allowed_statuses = {
            "ALL",
            "PENDING",
            "ALLOCATED",
            "SETTLED"
        }

        if status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. "
                    "Use ALL, PENDING, ALLOCATED or SETTLED."
                )
            )

        # --------------------------------------------------
        # BASE QUERY
        # --------------------------------------------------

        query = db.query(models.FundingRequest)

        # --------------------------------------------------
        # STATUS FILTER
        # --------------------------------------------------

        if status != "ALL":
            query = query.filter(
                models.FundingRequest.status == status
            )

        # --------------------------------------------------
        # SEARCH
        #
        # Search is performed by the DATABASE before pagination.
        # This keeps the API fast and ensures page counts are correct.
        # --------------------------------------------------

        if search:
            search_value = f"%{search}%"

            query = query.filter(
                or_(
                    models.FundingRequest.funding_reference.ilike(
                        search_value
                    ),

                    models.FundingRequest
                    .medbridge_transaction_reference
                    .ilike(search_value),

                    models.FundingRequest.case_reference.ilike(
                        search_value
                    ),

                    models.FundingRequest.patient_reference.ilike(
                        search_value
                    ),

                    models.FundingRequest
                    .hospital_account_reference
                    .ilike(search_value)
                )
            )

        # --------------------------------------------------
        # TOTAL MATCHING RECORDS
        # --------------------------------------------------

        total_count = query.count()

        # --------------------------------------------------
        # TOTAL PAGES
        # --------------------------------------------------

        total_pages = (
            (total_count + page_size - 1) // page_size
            if total_count > 0
            else 0
        )

        # --------------------------------------------------
        # PAGINATION
        # --------------------------------------------------

        offset = (page - 1) * page_size

        funding_requests = (
            query
            .order_by(
                models.FundingRequest.created_at.desc(),
                models.FundingRequest.id.desc()
            )
            .offset(offset)
            .limit(page_size)
            .all()
        )

        # --------------------------------------------------
        # RESPONSE
        # --------------------------------------------------

        return {
            "success": True,

            "count":
                len(funding_requests),

            "total_count":
                total_count,

            "page":
                page,

            "page_size":
                page_size,

            "total_pages":
                total_pages,

            "has_next":
                page < total_pages,

            "has_previous":
                page > 1,

            "status":
                status,

            "search":
                search,

            "funding_requests": [
                {
                    "funding_id":
                        funding.id,

                    "funding_reference":
                        funding.funding_reference,

                    "medbridge_transaction_reference":
                        funding.medbridge_transaction_reference,

                    "case_reference":
                        funding.case_reference,

                    "patient_reference":
                        funding.patient_reference,

                    "hospital_id":
                        funding.hospital_id,

                    "hospital_account_reference":
                        funding.hospital_account_reference,

                    "requested_amount":
                        funding.requested_amount,

                    "allocated_amount":
                        funding.allocated_amount,

                    "settled_amount":
                        funding.settled_amount,

                    "status":
                        funding.status,

                    "created_at":
                        funding.created_at,

                    "completed_at":
                        funding.completed_at
                }
                for funding in funding_requests
            ]
        }

    finally:
        db.close()
@app.get("/bank/funding-requests/statistics")
def funding_request_statistics():
    db = SessionLocal()

    try:
        total = db.query(models.FundingRequest).count()

        pending = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.status == "PENDING"
            )
            .count()
        )

        allocated = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.status == "ALLOCATED"
            )
            .count()
        )

        settled = (
            db.query(models.FundingRequest)
            .filter(
                models.FundingRequest.status == "SETTLED"
            )
            .count()
        )

        return {
            "success": True,
            "total": total,
            "pending": pending,
            "allocated": allocated,
            "settled": settled
        }

    finally:
        db.close()