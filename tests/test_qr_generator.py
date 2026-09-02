from pathlib import Path

from security.qr_verification import generate_verification_token
from security.qr_generator import generate_qr_code


print("\n===================================")
print("MEDBRIDGE QR IMAGE TEST")
print("===================================")


token = generate_verification_token()

output_path = "tests/generated_qr/verification.png"

result = generate_qr_code(
    token,
    output_path
)

print("\nVerification token:")
print(token)

print("\nQR image created:")
print(result)


assert Path(result).exists()

print("\n✅ QR image exists.")
print("✅ QR generation successful.")