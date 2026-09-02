from security.integrity import calculate_sha256
from security.signature import (
    generate_key_pair,
    sign_document_hash,
    verify_document_signature,
)


FILE_PATH = "tests/test_files/medical_report.txt"


# --------------------------------------------------
# STEP 1: Simulate the original hospital document
# --------------------------------------------------

original_hash = calculate_sha256(FILE_PATH)

print("\nOriginal document hash:")
print(original_hash)


# --------------------------------------------------
# STEP 2: Simulate doctor signing the document
# --------------------------------------------------

private_key, public_key = generate_key_pair()

signature = sign_document_hash(
    original_hash,
    private_key
)

print("\n✅ Doctor digitally signed the document.")


# --------------------------------------------------
# STEP 3: Simulate an attacker modifying the file
# --------------------------------------------------

print("\n🚨 Simulating document tampering...")

with open(FILE_PATH, "a", encoding="utf-8") as file:
    file.write("\nATTACKER MODIFIED THIS DOCUMENT")


# --------------------------------------------------
# STEP 4: Calculate the new hash
# --------------------------------------------------

modified_hash = calculate_sha256(FILE_PATH)

print("\nModified document hash:")
print(modified_hash)


# --------------------------------------------------
# STEP 5: Verify the original signature
# --------------------------------------------------

signature_valid = verify_document_signature(
    modified_hash,
    signature,
    public_key
)

print("\nSignature verification after modification:")
print(signature_valid)


# --------------------------------------------------
# STEP 6: Security decision
# --------------------------------------------------

if signature_valid:
    print("\n❌ SECURITY FAILURE")
    print("Modified document was incorrectly accepted.")
else:
    print("\n🚨 TAMPERING DETECTED")
    print("Digital signature verification failed.")
    print("The document cannot be trusted.")


assert signature_valid is False