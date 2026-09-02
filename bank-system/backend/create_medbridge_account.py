from database import SessionLocal
import models


MEDBRIDGE_ACCOUNT_REFERENCE = "MEDBRIDGE-001"


db = SessionLocal()

try:
    existing = (
        db.query(models.BankAccount)
        .filter(
            models.BankAccount.account_reference
            == MEDBRIDGE_ACCOUNT_REFERENCE
        )
        .first()
    )

    if existing:
        print("MedBridge account already exists.")
        print("Reference:", existing.account_reference)
        print("Balance:", existing.balance)
        print("Status:", existing.account_status)

    else:
        account = models.BankAccount(
            account_reference=MEDBRIDGE_ACCOUNT_REFERENCE,
            account_name="MedBridge Central Account",
            account_type="MEDBRIDGE",
            hospital_id=None,
            donor_id=None,
            account_status="ACTIVE",
            balance=0,
            reserved_balance=0
        )

        db.add(account)
        db.commit()
        db.refresh(account)

        print("MedBridge account created successfully.")
        print("Reference:", account.account_reference)
        print("Name:", account.account_name)
        print("Type:", account.account_type)
        print("Balance:", account.balance)
        print("Status:", account.account_status)

finally:
    db.close()