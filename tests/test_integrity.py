from security.integrity import calculate_sha256, verify_file_integrity


FILE_PATH = "tests/test_files/medical_report.txt"


# This represents the hash captured when the hospital
# originally submitted the document.
STORED_HASH = (
    "08adcab29f097558bc2018e9d57cb79bc7fac358efab66f800c205af274a299c"
)


print("\nStored SHA-256:")
print(STORED_HASH)

current_hash = calculate_sha256(FILE_PATH)

print("\nCurrent SHA-256:")
print(current_hash)

result = verify_file_integrity(
    FILE_PATH,
    STORED_HASH
)

print("\nIntegrity check:")
print(result)

if result:
    print("\n✅ Document has not changed.")
else:
    print("\n🚨 WARNING: Document integrity failure!")
    print("The document may have been modified.")