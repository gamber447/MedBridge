from security.qr_verification import (
    generate_verification_token,
    verify_token_format,
)


print("\n===================================")
print("MEDBRIDGE QR TOKEN TEST")
print("===================================")


token_1 = generate_verification_token()
token_2 = generate_verification_token()


print("\nGenerated token 1:")
print(token_1)

print("\nGenerated token 2:")
print(token_2)


# Check token format
assert verify_token_format(token_1) is True
assert verify_token_format(token_2) is True


# Two tokens must not be identical
assert token_1 != token_2


print("\n✅ Token format valid.")
print("✅ Tokens are unique.")
print("✅ Secure QR verification token generation passed.")