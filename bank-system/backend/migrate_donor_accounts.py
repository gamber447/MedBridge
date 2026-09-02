from database import engine
from sqlalchemy import text


def migrate():

    with engine.begin() as connection:

        result = connection.execute(
            text("PRAGMA table_info(bank_accounts)")
        )

        columns = [
            row[1]
            for row in result
        ]

        if "donor_id" not in columns:

            connection.execute(
                text(
                    """
                    ALTER TABLE bank_accounts
                    ADD COLUMN donor_id INTEGER
                    """
                )
            )

            print(
                "donor_id column added successfully."
            )

        else:

            print(
                "donor_id column already exists."
            )


if __name__ == "__main__":
    migrate()