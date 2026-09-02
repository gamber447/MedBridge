from database import engine
from sqlalchemy import text


def migrate():

    with engine.begin() as connection:

        # Check existing columns
        result = connection.execute(
            text("PRAGMA table_info(donors)")
        )

        columns = [
            row[1]
            for row in result
        ]

        if "bank_id" not in columns:

            connection.execute(
                text(
                    """
                    ALTER TABLE donors
                    ADD COLUMN bank_id INTEGER
                    """
                )
            )

            print(
                "bank_id column added successfully."
            )

        else:

            print(
                "bank_id column already exists."
            )


if __name__ == "__main__":
    migrate()