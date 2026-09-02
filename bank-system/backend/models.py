from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime

from database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    account_reference = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    account_name = Column(
        String(200),
        nullable=False
    )

    account_type = Column(
        String(50),
        default="HOSPITAL",
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=True
    )

    donor_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    account_status = Column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    balance = Column(
        Integer,
        default=0,
        nullable=False
    )
    reserved_balance = Column(
    Integer,
    default=0,
    nullable=False
)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    medbridge_transaction_reference = Column(
        String(100),
        nullable=False
    )

    idempotency_key = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )
    source_account_reference = Column(
    String(255),
    nullable=False
)

    hospital_account_reference = Column(
        String(255),
        nullable=False
    )

    hospital_id = Column(
        Integer,
        nullable=True
    )

    case_id = Column(
        Integer,
        nullable=True
    )

    amount = Column(
        Integer,
        nullable=False
    )

    transaction_type = Column(
        String(50),
        default="MEDICAL_FUNDING",
        nullable=False
    )

    transaction_status = Column(
        String(30),
        default="RECEIVED",
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


class BankAuditLog(Base):
    __tablename__ = "bank_audit_logs"

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

    action = Column(
        String(100),
        nullable=False
    )

    transaction_reference = Column(
        String(100),
        nullable=True
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

class Bank(Base):
    __tablename__ = "banks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    bank_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    bank_name = Column(
        String(200),
        nullable=False
    )

    bank_code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    country = Column(
        String(100),
        default="INDIA",
        nullable=False
    )

    verification_status = Column(
        String(30),
        default="VERIFIED",
        nullable=False
    )

    status = Column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

class Donor(Base):
    __tablename__ = "donors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    bank_id = Column(
    Integer,
    nullable=False,
    index=True
)
    donor_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    full_name = Column(
        String(150),
        nullable=False
    )

    account_reference = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    account_status = Column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class DonorConsent(Base):
    __tablename__ = "donor_consents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    consent_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    donor_id = Column(
        Integer,
        nullable=False
    )

    consent_status = Column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    consent_scope = Column(
        String(100),
        nullable=False
    )

    maximum_contribution = Column(
        Integer,
        nullable=False
    )

    consented_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    revoked_at = Column(
        DateTime,
        nullable=True
    )
class FundingRequest(Base):
    __tablename__ = "funding_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    funding_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    medbridge_transaction_reference = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    case_reference = Column(
        String(100),
        index=True,
        nullable=False
    )

    patient_reference = Column(
        String(100),
        index=True,
        nullable=False
    )

    hospital_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    hospital_account_reference = Column(
        String(255),
        nullable=False
    )

    requested_amount = Column(
        Integer,
        nullable=False
    )

    allocated_amount = Column(
        Integer,
        default=0,
        nullable=False
    )

    settled_amount = Column(
        Integer,
        default=0,
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

    completed_at = Column(
        DateTime,
        nullable=True
    )
class FundingAllocation(Base):
    __tablename__ = "funding_allocations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    allocation_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    funding_request_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    donor_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    consent_reference = Column(
        String(100),
        nullable=False
    )

    allocated_amount = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String(30),
        default="ALLOCATED",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    settled_at = Column(
        DateTime,
        nullable=True
    )
class DonorContribution(Base):
    __tablename__ = "donor_contributions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    contribution_reference = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    funding_request_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    donor_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    donor_account_reference = Column(
        String(255),
        nullable=False
    )

    consent_reference = Column(
        String(100),
        nullable=False
    )

    allocation_id = Column(
        Integer,
        index=True,
        nullable=False
    )

    amount = Column(
        Integer,
        nullable=False
    )

    transaction_reference = Column(
        String(100),
        nullable=True
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

    completed_at = Column(
        DateTime,
        nullable=True
    )