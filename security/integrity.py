import hashlib
from pathlib import Path


def calculate_sha256(file_path: str) -> str:
    """
    Calculate the SHA-256 hash of a file.
    """

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:
        while True:
            chunk = file.read(8192)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


def verify_file_integrity(
    file_path: str,
    original_hash: str
) -> bool:
    """
    Compare the current file hash with the
    original stored hash.
    """

    current_hash = calculate_sha256(file_path)

    return current_hash == original_hash