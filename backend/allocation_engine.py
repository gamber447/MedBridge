from uuid import uuid4

from database.database import SessionLocal
from database import models

from backend.audit_service import create_audit_log


def generate_allocation_reference():
    return f"ALLOC-{uuid4().hex[:10].upper()}"


def allocate_funds(
    case_id: int,
    donor_references: list[str] | None = None
):

    

    db = SessionLocal()

    try:
        # 1. Find the medical case
        medical_case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if medical_case is None:
            return {
                "success": False,
                "message": "Medical case not found."
            }

        # 2. Determine how much money is required
    
        required_amount = medical_case.approved_amount
                # --------------------------------------------------
        # Check existing allocations
        # --------------------------------------------------

        existing_allocations = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.case_id
                == medical_case.id
            )
            .all()
        )

        # If there are pending allocations, do not create
        # another batch. This prevents duplicate allocation
        # requests while existing funding is still processing.
        pending_allocations = [
            allocation
            for allocation in existing_allocations
            if allocation.allocation_status == "PENDING"
        ]

        if pending_allocations:
            return {
                "success": False,
                "message": (
                    "Pending funding allocations already "
                    "exist for this case."
                ),
                "case_id": medical_case.id
            }

        # Calculate funding already allocated
        existing_total = sum(
            allocation.allocated_amount
            for allocation in existing_allocations
        )

        remaining_amount = max(
            required_amount - existing_total,
            0
        )

        # Case already fully allocated
        if remaining_amount == 0:
            return {
                "success": False,
                "message": "Case is already fully funded.",
                "case_id": medical_case.id
            }

        if required_amount <= 0:
            return {
                "success": False,
                "message": "No funding required."
            }

        # Never allocate to a donor who already contributed
        # to this case.
        existing_donor_ids = {
            allocation.donor_id
            for allocation in existing_allocations
            if allocation.donor_id is not None
        }

        # Find only consenting and active donors
        eligible_donors = (
            db.query(models.Donor)
            .filter(
                models.Donor.consent_status == "CONSENTED",
                models.Donor.active == "YES"
            )
            .order_by(models.Donor.id.asc())
            .all()
        )

        # Optional donor pool restriction
        if donor_references is not None:
            eligible_donors = [
                donor
                for donor in eligible_donors
                if donor.donor_reference in donor_references
            ]

        # Do not select donors who have already contributed
        # to this case.
        eligible_donors = [
            donor
            for donor in eligible_donors
            if donor.id not in existing_donor_ids
        ]

        if not eligible_donors:
            return {
                "success": False,
                "message": "No eligible donors available."
            }

        allocations = []
    

        # 4. Allocate according to donor limits
        for donor in eligible_donors:

            if remaining_amount <= 0:
                break

            donor_limit = donor.max_contribution_per_case

            if donor_limit <= 0:
                continue

            allocation_amount = min(
                donor_limit,
                remaining_amount
            )

            allocation = models.DonationAllocation(
                allocation_reference=
                    generate_allocation_reference(),

                donor_id=donor.id,

                case_id=medical_case.id,

                requested_amount=required_amount,

                allocated_amount=allocation_amount,

                allocation_status="PENDING",

                payment_reference=None
            )

            db.add(allocation)

            allocations.append({
                "allocation_reference":
                    allocation.allocation_reference,

                "donor_id": donor.id,

                "donor_reference":
                    donor.donor_reference,

                "allocated_amount":
                    allocation_amount
            })

            remaining_amount -= allocation_amount

        # 5. Save allocations
        db.commit()
    

        # 6. Return result
        total_allocated = (
            required_amount - remaining_amount
        )

        

        create_audit_log(
            event_type="FUNDING",
            entity_type="CASE",
            entity_id=medical_case.id,
            action="FUNDING_ALLOCATION",
            status="SUCCESS",
            details=(
                f"Required={required_amount}; "
                f"Allocated={total_allocated}; "
                f"Remaining={remaining_amount}; "
                f"Allocation count={len(allocations)}"
            ),
        )

        return {
            "success": True,
            "case_id": medical_case.id,
            "case_reference": medical_case.case_reference,
            "required_amount": required_amount,
            "total_allocated": total_allocated,
            "remaining_amount": remaining_amount,
            "allocations": allocations
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()