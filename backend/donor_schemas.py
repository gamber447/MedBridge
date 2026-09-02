from typing import Literal

from pydantic import BaseModel, Field


class DonorCreate(BaseModel):
    donor_reference: str = Field(
        min_length=5,
        max_length=100
    )

    display_name: str = Field(
        min_length=2,
        max_length=150
    )

    max_contribution_per_case: int = Field(
        ge=1,
        le=10000
    )


class ConsentUpdate(BaseModel):
    consent_status: Literal[
        "CONSENTED",
        "NOT_CONSENTED"
    ]

    max_contribution_per_case: int = Field(
        ge=1,
        le=10000
    )