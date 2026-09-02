from datetime import datetime
import random

from database import SessionLocal
import models


TARGET_DONORS = 100000
EXISTING_DONORS = 16253


def generate_balance():

    roll = random.random()

    # -----------------------------------------------
    # 12% - zero balance
    # -----------------------------------------------

    if roll < 0.12:
        return 0

    # -----------------------------------------------
    # 20% - very low balance
    # ₹10 - ₹500
    # -----------------------------------------------

    elif roll < 0.32:
        return random.randint(10, 500)

    # -----------------------------------------------
    # 25% - low balance
    # ₹501 - ₹2,500
    # -----------------------------------------------

    elif roll < 0.57:
        return random.randint(501, 2500)

    # -----------------------------------------------
    # 23% - normal small balance
    # ₹2,501 - ₹10,000
    # -----------------------------------------------

    elif roll < 0.80:
        return random.randint(2501, 10000)

    # -----------------------------------------------
    # 14% - moderate balance
    # ₹10,001 - ₹50,000
    # -----------------------------------------------

    elif roll < 0.94:
        return random.randint(10001, 50000)

    # -----------------------------------------------
    # 5% - higher balance
    # ₹50,001 - ₹2,00,000
    # -----------------------------------------------

    elif roll < 0.99:
        return random.randint(50001, 200000)

    # -----------------------------------------------
    # 1% - high balance
    # ₹2,00,001 - ₹10,00,000
    # -----------------------------------------------

    else:
        return random.randint(
            200001,
            1000000
        )


def seed_donor_accounts():

    db = SessionLocal()

    try:

        # --------------------------------------------------
        # Get all donors
        # --------------------------------------------------

        donors = (
            db.query(models.Donor)
            .order_by(models.Donor.id.asc())
            .all()
        )

        print(
            f"Donors found: {len(donors)}"
        )

        if len(donors) != TARGET_DONORS:
            raise Exception(
                f"Expected {TARGET_DONORS} donors, "
                f"but found {len(donors)}. "
                f"Run seed_donors.py first."
            )

        created_count = 0
        existing_count = 0

        # --------------------------------------------------
        # Create accounts
        #
        # Existing donor accounts are NOT modified.
        # This protects existing funding/settlements.
        # --------------------------------------------------

        for donor in donors:

            existing_account = (
                db.query(models.BankAccount)
                .filter(
                    models.BankAccount.donor_id
                    == donor.id
                )
                .first()
            )

            if existing_account:

                existing_count += 1
                continue

            # --------------------------------------------------
            # Generate realistic synthetic balance
            # --------------------------------------------------

            balance = generate_balance()

            account = models.BankAccount(
                account_reference=(
                    donor.account_reference
                ),

                account_name=(
                    donor.full_name
                ),

                account_type="DONOR",

                hospital_id=None,

                donor_id=donor.id,

                account_status=(
                    donor.account_status
                ),

                balance=balance,

                created_at=datetime.utcnow()
            )

            db.add(account)

            created_count += 1

            if created_count % 1000 == 0:

                db.commit()

                print(
                    f"New donor accounts created: "
                    f"{created_count}"
                )

        db.commit()

        # --------------------------------------------------
        # Final statistics
        # --------------------------------------------------

        total_donor_accounts = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR"
            )
            .count()
        )

        zero_balance = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR",
                models.BankAccount.balance == 0
            )
            .count()
        )

        active_accounts = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR",
                models.BankAccount.account_status
                == "ACTIVE"
            )
            .count()
        )

        inactive_accounts = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR",
                models.BankAccount.account_status
                == "INACTIVE"
            )
            .count()
        )

        blocked_accounts = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR",
                models.BankAccount.account_status
                == "BLOCKED"
            )
            .count()
        )

        total_balance = (
            db.query(models.BankAccount)
            .filter(
                models.BankAccount.account_type
                == "DONOR"
            )
            .with_entities(
                models.BankAccount.balance
            )
            .all()
        )

        total_money = sum(
            float(row[0] or 0)
            for row in total_balance
        )

        print()
        print(
            "=============================================="
        )
        print(
            "MEDBRIDGE DONOR BANK ACCOUNTS"
        )
        print(
            "=============================================="
        )

        print(
            f"New accounts created: {created_count}"
        )

        print(
            f"Already existing: {existing_count}"
        )

        print(
            f"Total donor accounts: "
            f"{total_donor_accounts}"
        )

        print(
            f"Zero-balance accounts: "
            f"{zero_balance}"
        )

        print(
            f"Active accounts: "
            f"{active_accounts}"
        )

        print(
            f"Inactive accounts: "
            f"{inactive_accounts}"
        )

        print(
            f"Blocked accounts: "
            f"{blocked_accounts}"
        )

        print(
            f"Total simulated donor funds: "
            f"₹{total_money:,.2f}"
        )

        print(
            "=============================================="
        )

        if total_donor_accounts != TARGET_DONORS:
            raise Exception(
                f"Account population check failed. "
                f"Expected {TARGET_DONORS}, "
                f"found {total_donor_accounts}."
            )

        print(
            "SUCCESS: Exactly 100,000 donor accounts exist."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_donor_accounts()