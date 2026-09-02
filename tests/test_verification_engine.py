from security.verification_engine import (
    VerificationInput,
    evaluate_case,
)


print("\n===================================")
print("MEDBRIDGE VERIFICATION ENGINE TEST")
print("===================================")


# --------------------------------------------------
# TEST 1: Fully verified case
# --------------------------------------------------

print("\nTEST 1: Fully verified case")

case_1 = VerificationInput(
    hospital_verified=True,
    doctor_verified=True,
    document_integrity_valid=True,
    digital_signature_valid=True,
    information_matches=True,
    qr_valid=True,
    medical_urgency="NORMAL",
)

result_1 = evaluate_case(case_1)

print(f"Trust Score: {result_1.trust_score}")
print(f"Risk Level: {result_1.risk_level}")
print(f"Status: {result_1.verification_status}")
print(f"Escalation: {result_1.escalation_required}")

assert result_1.trust_score == 100
assert result_1.risk_level == "LOW"
assert result_1.verification_status == "VERIFIED"
assert result_1.escalation_required is False

print("✅ Test 1 passed.")


# --------------------------------------------------
# TEST 2: Critical emergency with failed checks
# --------------------------------------------------

print("\nTEST 2: Critical emergency with suspicious checks")

case_2 = VerificationInput(
    hospital_verified=True,
    doctor_verified=True,
    document_integrity_valid=False,
    digital_signature_valid=False,
    information_matches=True,
    qr_valid=True,
    medical_urgency="CRITICAL",
)

result_2 = evaluate_case(case_2)

print(f"Trust Score: {result_2.trust_score}")
print(f"Risk Level: {result_2.risk_level}")
print(f"Status: {result_2.verification_status}")
print(f"Escalation: {result_2.escalation_required}")
print(f"Escalation Level: {result_2.escalation_level}")

assert result_2.trust_score == 70
assert result_2.risk_level == "MEDIUM"
assert result_2.verification_status == "REVIEW_REQUIRED"
assert result_2.escalation_required is True
assert result_2.escalation_level == "IMMEDIATE"

print("🚨 Test 2 passed — critical case escalated.")


print("\n===================================")
print("ALL VERIFICATION TESTS PASSED")
print("===================================")