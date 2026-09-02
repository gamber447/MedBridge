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

        if "reserved_balance" not in columns:

            connection.execute(
                text(
                    """
                    ALTER TABLE bank_accounts
                    ADD COLUMN reserved_balance INTEGER
                    NOT NULL DEFAULT 0
                    """
                )
            )

            print(
                "reserved_balance column added successfully."
            )

        else:

            print(
                "reserved_balance column already exists."
            )


if __name__ == "__main__":
    migrate()