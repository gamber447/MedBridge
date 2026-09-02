from datetime import datetime
from uuid import uuid4

from database import SessionLocal
import models


def process_bank_payment(
    medbridge_transaction_reference: str,
    idempotency_key: str,
    hospital_account_reference: str,
    hospital_id: int,
    case_id: int,
    amount: int
):
    db = SessionLocal()

    try:
        # --------------------------------------------------
        # 1. Check for duplicate payment request
        # --------------------------------------------------

        existing_transaction = (
            db.query(models.BankTransaction)
            .filter(
                models.BankTransaction.idempotency_key
                == idempotency_key
            )
            .first()
        )

        if existing_transaction:

            return {
                "success": False,
                "duplicate": True,
                "message": "Duplicate bank payment request blocked.",
                "bank_transaction_reference":
                    existing_transaction.transaction_reference,
                "transaction_status":
                    existing_transaction.transaction_status
            }

        # --------------------------------------------------
        # 2. Find hospital bank account
        # --------------------------------------------------

        account = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_reference
                == hospital_account_reference
            )
            .first()
        )

        if account is None:

            return {
                "success": False,
                "duplicate": False,
                "message": "Hospital bank account not found."
            }

        # --------------------------------------------------
        # 3. Check account status
        # --------------------------------------------------

        if account.account_status != "ACTIVE":

            return {
                "success": False,
                "duplicate": False,
                "message": "Hospital bank account is not active.",
                "account_status": account.account_status
            }

        # --------------------------------------------------
        # 4. Validate amount
        # --------------------------------------------------

        if amount <= 0:

            return {
                "success": False,
                "duplicate": False,
                "message": "Payment amount must be greater than zero."
            }

        # --------------------------------------------------
        # 5. Create bank transaction
        # --------------------------------------------------

        bank_transaction_reference = (
            f"BANK-{uuid4().hex[:12].upper()}"
        )

        transaction = models.BankTransaction(
            transaction_reference=bank_transaction_reference,
            medbridge_transaction_reference=(
                medbridge_transaction_reference
            ),
            idempotency_key=idempotency_key,
            hospital_account_reference=(
                hospital_account_reference
            ),
            hospital_id=hospital_id,
            case_id=case_id,
            amount=amount,
            transaction_type="MEDICAL_FUNDING",
            transaction_status="SETTLED",
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        

        db.add(transaction)

        # --------------------------------------------------
        # 6. Create bank audit log
        # --------------------------------------------------


        audit_event = models.BankAuditLog(
            event_reference=(
                f"BANK-AUDIT-{uuid4().hex[:12].upper()}"
            ),
            event_type="PAYMENT",
            action="SETTLE_PAYMENT",
            transaction_reference=(
                bank_transaction_reference
            ),
            status="SUCCESS",
            details=(
                f"MedBridge transaction="
                f"{medbridge_transaction_reference}; "
                f"Hospital account="
                f"{hospital_account_reference}; "
                f"Hospital ID={hospital_id}; "
                f"Case ID={case_id}; "
                f"Amount={amount}; "
                f"Status=SETTLED"
            ),
            created_at=datetime.utcnow()
        )

        db.add(audit_event)

        # --------------------------------------------------
        # 7. Update hospital bank account balance
        # --------------------------------------------------
        account.balance += amount

        db.commit()

        # --------------------------------------------------
        # 8. Return settlement result
        # --------------------------------------------------

        return {
            "success": True,
            "duplicate": False,
            "message": "Bank payment settled successfully.",
            "bank_transaction_reference":
                bank_transaction_reference,
            "medbridge_transaction_reference":
                medbridge_transaction_reference,
            "hospital_account_reference":
                hospital_account_reference,
            "amount": amount,
            "transaction_status":
                transaction.transaction_status,
            "completed_at":
                transaction.completed_at
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()