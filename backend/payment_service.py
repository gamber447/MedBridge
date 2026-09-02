from datetime import datetime
from uuid import uuid4

from database.database import SessionLocal
from database import models
from backend.audit_service import create_audit_log


def process_payment(allocation_id: int, idempotency_key: str):

    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Check whether this request was already processed
        # --------------------------------------------------

        existing_transaction = (
            db.query(models.PaymentTransaction)
            .filter(
                models.PaymentTransaction.idempotency_key
                == idempotency_key
            )
            .first()
        )

        if existing_transaction:

            create_audit_log(
                event_type="SECURITY",
                entity_type="PAYMENT",
                entity_id=existing_transaction.allocation_id,
                action="DUPLICATE_PAYMENT_ATTEMPT",
                status="BLOCKED",
                details=(
                    f"Duplicate payment request blocked. "
                    f"Existing transaction="
                    f"{existing_transaction.transaction_reference}; "
                    f"Idempotency key={idempotency_key}"
                ),
            )

            return {
        "success": False,
        "duplicate": True,
        "message": "Duplicate payment request blocked.",
        "transaction_reference":
            existing_transaction.transaction_reference,
        "payment_status":
            existing_transaction.payment_status
            }

        # --------------------------------------------------
        # 2. Find allocation
        # --------------------------------------------------

        allocation = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.id
                == allocation_id
            )
            .first()
        )

        if allocation is None:

            return {
                "success": False,
                "duplicate": False,
                "message": "Allocation not found."
            }

        # --------------------------------------------------
        # 3. Only PENDING allocations can be paid
        # --------------------------------------------------

        if allocation.allocation_status != "PENDING":

            return {
                "success": False,
                "duplicate": False,
                "message": (
                    "Allocation is not eligible for payment."
                ),
                "allocation_status":
                    allocation.allocation_status
            }

        # --------------------------------------------------
        # 4. Create simulated transaction
        # --------------------------------------------------

        transaction_reference = (
            f"TXN-{uuid4().hex[:12].upper()}"
        )

        transaction = models.PaymentTransaction(
            transaction_reference=transaction_reference,
            idempotency_key=idempotency_key,
            allocation_id=allocation.id,
            case_id=allocation.case_id,
            donor_id=allocation.donor_id,
            amount=allocation.allocated_amount,
            payment_status="SETTLED",
            destination_reference=(
                "DEMO-HOSPITAL-ACCOUNT"
            ),
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )

        db.add(transaction)

        # --------------------------------------------------
        # 5. Update allocation
        # --------------------------------------------------

        allocation.allocation_status = "SETTLED"

        allocation.payment_reference = (
            transaction_reference
        )

        db.commit()

        create_audit_log(
            event_type="PAYMENT",
            entity_type="ALLOCATION",
            entity_id=allocation.id,
            action="PROCESS_PAYMENT",
            status="SUCCESS",
            details=(
                f"Transaction={transaction_reference}; "
                f"Case={allocation.case_id}; "
                f"Donor={allocation.donor_id}; "
                f"Amount={allocation.allocated_amount}; "
                f"Payment status={transaction.payment_status}"
            ),
        )

        return {
            "success": True,
            "duplicate": False,
            "message": "Payment simulated successfully.",
            "transaction_reference":
                transaction_reference,
            "allocation_id":
                allocation.id,
            "amount":
                allocation.allocated_amount,
            "payment_status":
                transaction.payment_status
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()