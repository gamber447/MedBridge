from database import SessionLocal
import models


db = SessionLocal()

try:
    existing_account = (
        db.query(models.BankAccount)
        .filter(
            models.BankAccount.account_reference
            == "DEMO-BANK-001"
        )
        .first()
    )

    if existing_account:
        print("DEMO-BANK-001 already exists.")

    else:
        account = models.BankAccount(
            account_reference="DEMO-BANK-001",
            account_name="Demo Hospital Account",
            account_type="HOSPITAL",
            hospital_id=1,
            account_status="ACTIVE",
            balance=0
        )

        db.add(account)
        db.commit()

        print("DEMO-BANK-001 created successfully.")

finally:
    db.close()