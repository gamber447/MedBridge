from database import SessionLocal
import models
from sqlalchemy import text


def migrate():
    db = SessionLocal()
    try:
        columns = {row[1] for row in db.execute(text("PRAGMA table_info(bank_transactions)"))}
        if "source_account_reference" not in columns:
            db.execute(text("ALTER TABLE bank_transactions ADD COLUMN source_account_reference VARCHAR(255)"))
            db.commit()
            print("source_account_reference column added.")
        else:
            print("source_account_reference column already exists.")

        account = (
            db.query(models.BankAccount)
            .filter(models.BankAccount.account_reference == "MEDBRIDGE-001")
            .first()
        )
        if account is None:
            db.add(models.BankAccount(
                account_reference="MEDBRIDGE-001",
                account_name="MedBridge Settlement Account",
                account_type="MEDBRIDGE",
                hospital_id=None,
                donor_id=None,
                account_status="ACTIVE",
                balance=0,
                reserved_balance=0
            ))
            db.commit()
            print("MEDBRIDGE-001 created.")
        else:
            print("MEDBRIDGE-001 already exists.")
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
