from datetime import datetime
import random

from database import SessionLocal
import models


TOTAL_DONORS = 100000
EXISTING_DONORS = 16253


def seed_donors():

    db = SessionLocal()

    try:
        # --------------------------------------------------
        # Demo Bank
        # --------------------------------------------------

        bank = (
            db.query(models.Bank)
            .filter(
                models.Bank.bank_reference == "BANK-IN-001"
            )
            .first()
        )

        if not bank:
            raise Exception(
                "BANK-IN-001 does not exist. "
                "Run seed_banks.py first."
            )

        # --------------------------------------------------
        # Existing donor count
        # --------------------------------------------------

        current_count = db.query(models.Donor).count()

        print(
            f"Existing donors in database: {current_count}"
        )

        if current_count > TOTAL_DONORS:
            raise Exception(
                f"Database already contains {current_count} donors. "
                f"Target is {TOTAL_DONORS}."
            )

        # --------------------------------------------------
        # Create donors from current count + 1
        # until exactly 100,000
        # --------------------------------------------------

        start_number = current_count + 1

        if start_number <= TOTAL_DONORS:

            print(
                f"Creating donors "
                f"{start_number} to {TOTAL_DONORS}..."
            )

            for number in range(
                start_number,
                TOTAL_DONORS + 1
            ):

                donor_reference = (
                    f"DONOR-IN-{number:06d}"
                )

                account_reference = (
                    f"DONOR-ACCOUNT-IN-{number:06d}"
                )

                full_name = (
                    f"Demo Donor {number:05d}"
                )

                # --------------------------------------------------
                # Account status
                #
                # Synthetic distribution:
                # 88% ACTIVE
                # 9% INACTIVE
                # 3% BLOCKED
                # --------------------------------------------------

                status_roll = random.random()

                if status_roll < 0.88:
                    account_status = "ACTIVE"

                elif status_roll < 0.97:
                    account_status = "INACTIVE"

                else:
                    account_status = "BLOCKED"

                donor = models.Donor(
                    donor_reference=donor_reference,
                    full_name=full_name,
                    bank_id=bank.id,
                    account_reference=account_reference,
                    account_status=account_status,
                    created_at=datetime.utcnow()
                )

                db.add(donor)

                if number % 1000 == 0:
                    db.commit()

                    print(
                        f"Donors created: {number}"
                    )

        db.commit()

        # --------------------------------------------------
        # Add consent only for NEW donors
        #
        # Distribution:
        #
        # 55% ACTIVE
        # 15% PENDING
        # 20% DECLINED
        # 10% NO CONSENT
        #
        # NO_CONSENT means no DonorConsent row is created.
        # --------------------------------------------------

        print()
        print("Creating donor consent distribution...")

        donors = (
            db.query(models.Donor)
            .filter(
                models.Donor.id > EXISTING_DONORS
            )
            .order_by(models.Donor.id.asc())
            .all()
        )

        for index, donor in enumerate(donors):

            roll = random.random()

            # -----------------------------------------------
            # ACTIVE CONSENT
            # -----------------------------------------------

            if roll < 0.55:

                consent_status = "ACTIVE"

                # Different realistic contribution limits
                limit_roll = random.random()

                if limit_roll < 0.55:
                    maximum_contribution = random.choice(
                        [500, 1000, 2000, 5000]
                    )

                elif limit_roll < 0.85:
                    maximum_contribution = random.choice(
                        [5000, 10000, 15000, 25000]
                    )

                elif limit_roll < 0.97:
                    maximum_contribution = random.choice(
                        [25000, 50000, 75000, 100000]
                    )

                else:
                    maximum_contribution = random.choice(
                        [100000, 200000, 500000]
                    )

                consented_at = datetime.utcnow()
                revoked_at = None

            # -----------------------------------------------
            # PENDING
            # -----------------------------------------------

            elif roll < 0.70:

                consent_status = "PENDING"
                maximum_contribution = 0
                consented_at = None
                revoked_at = None

            # -----------------------------------------------
            # DECLINED
            # -----------------------------------------------

            elif roll < 0.90:

                consent_status = "DECLINED"
                maximum_contribution = 0
                consented_at = None
                revoked_at = None

            # -----------------------------------------------
            # NO CONSENT
            #
            # Do not create a DonorConsent record.
            # -----------------------------------------------

            else:

                continue

            consent_reference = (
                f"CONSENT-IN-{donor.donor_reference[-6:]}"
            )

            existing_consent = (
                db.query(models.DonorConsent)
                .filter(
                    models.DonorConsent.donor_id
                    == donor.id
                )
                .first()
            )

            if existing_consent:
                continue

            consent = models.DonorConsent(
                consent_reference=consent_reference,
                donor_id=donor.id,
                consent_status=consent_status,
                consent_scope="MEDICAL_FUNDING",
                maximum_contribution=maximum_contribution,
                consented_at=consented_at,
                revoked_at=revoked_at
            )

            db.add(consent)

            if (index + 1) % 1000 == 0:
                db.commit()

                print(
                    f"Consent records processed: "
                    f"{index + 1}"
                )

        db.commit()

        # --------------------------------------------------
        # Make sure ALL donors are connected to bank
        # --------------------------------------------------

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

        # --------------------------------------------------
        # REAL database statistics
        # --------------------------------------------------

        total_donors = (
            db.query(models.Donor).count()
        )

        active_count = (
            db.query(models.DonorConsent)
            .filter(
                models.DonorConsent.consent_status
                == "ACTIVE"
            )
            .count()
        )

        pending_count = (
            db.query(models.DonorConsent)
            .filter(
                models.DonorConsent.consent_status
                == "PENDING"
            )
            .count()
        )

        declined_count = (
            db.query(models.DonorConsent)
            .filter(
                models.DonorConsent.consent_status
                == "DECLINED"
            )
            .count()
        )

        consent_count = (
            db.query(models.DonorConsent).count()
        )

        no_consent_count = (
            total_donors - consent_count
        )

        print()
        print(
            "=============================================="
        )
        print(
            "MEDBRIDGE DONOR POPULATION"
        )
        print(
            "=============================================="
        )

        print(
            f"Total donors: {total_donors}"
        )

        print(
            f"Active consent: {active_count}"
        )

        print(
            f"Pending consent: {pending_count}"
        )

        print(
            f"Declined consent: {declined_count}"
        )

        print(
            f"No consent: {no_consent_count}"
        )

        print(
            f"Bank links added: {updated_count}"
        )

        print(
            "=============================================="
        )

        if total_donors != TOTAL_DONORS:
            raise Exception(
                f"Population check failed. "
                f"Expected {TOTAL_DONORS}, "
                f"found {total_donors}."
            )

        print(
            "SUCCESS: Exactly 100,000 donors exist."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_donors()