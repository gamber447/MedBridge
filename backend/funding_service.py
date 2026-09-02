from database.database import SessionLocal
from database import models


def get_funding_summary(case_id: int):

    db = SessionLocal()

    try:
        case = (
            db.query(models.MedicalCase)
            .filter(models.MedicalCase.id == case_id)
            .first()
        )

        if case is None:
            return {
                "success": False,
                "message": "Medical case not found."
            }

        allocations = (
            db.query(models.DonationAllocation)
            .filter(
                models.DonationAllocation.case_id == case_id
            )
            .all()
        )

        total_settled = sum(
            allocation.allocated_amount
            for allocation in allocations
            if allocation.allocation_status == "SETTLED"
        )

        remaining_amount = max(
            case.approved_amount - total_settled,
            0
        )

        if remaining_amount == 0:

            status = "FULLY_FUNDED"
            escalation_required = False

        elif total_settled > 0:

            status = "PARTIALLY_FUNDED"
            escalation_required = True

        else:

            status = "NOT_FUNDED"
            escalation_required = True

        return {
            "success": True,
            "case_id": case.id,
            "case_reference": case.case_reference,
            "approved_amount": case.approved_amount,
            "total_settled": total_settled,
            "remaining_amount": remaining_amount,
            "funding_status": status,
            "escalation_required": escalation_required
        }

    finally:
        db.close()