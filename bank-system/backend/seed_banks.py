from datetime import datetime

from database import SessionLocal
import models


def seed_bank():

    db = SessionLocal()

    try:
        bank_reference = "BANK-IN-001"

        existing_bank = (
            db.query(models.Bank)
            .filter(
                models.Bank.bank_reference
                == bank_reference
            )
            .first()
        )

        if existing_bank:
            bank = existing_bank
            print(
                f"Bank already exists: "
                f"{bank.bank_reference}"
            )
        else:
            bank = models.Bank(
                bank_reference="BANK-IN-001",
                bank_name="MedBridge Demo Bank",
                bank_code="MDB001",
                country="INDIA",
                verification_status="VERIFIED",
                status="ACTIVE",
                created_at=datetime.utcnow()
            )

            db.add(bank)
            db.commit()
            db.refresh(bank)

            print(
                "Sample bank created successfully."
            )

        # -----------------------------------------------
        # Connect all existing donors to this bank
        # -----------------------------------------------

        updated_count = (
            db.query(models.Donor)
            .filter(
                models.Donor.bank_id == None
            )
            .update(
                {
                    models.Donor.bank_id: bank.id
                },
                synchronize_session=False
            )
        )

        db.commit()

        print(
            f"Donors connected to bank: "
            f"{updated_count}"
        )

        print()
        print(
            f"Bank ID: {bank.id}"
        )
        print(
            f"Bank Reference: "
            f"{bank.bank_reference}"
        )
        print(
            f"Bank Name: "
            f"{bank.bank_name}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_bank()