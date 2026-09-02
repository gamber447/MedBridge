import sqlite3


DATABASE_FILE = "bank.db"


connection = sqlite3.connect(DATABASE_FILE)

try:
    cursor = connection.cursor()

    columns = cursor.execute(
        "PRAGMA table_info(bank_transactions)"
    ).fetchall()

    column_names = [column[1] for column in columns]

    if "source_account_reference" in column_names:
        print(
            "source_account_reference already exists."
        )
    else:
        cursor.execute(
            """
            ALTER TABLE bank_transactions
            ADD COLUMN source_account_reference TEXT
            """
        )

        connection.commit()

        print(
            "source_account_reference added successfully."
        )

finally:
    connection.close()
    