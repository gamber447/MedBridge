from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def generate_key_pair():
    """
    Generate a synthetic RSA key pair for a MedBridge doctor.
    """

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    public_key = private_key.public_key()

    return private_key, public_key


def sign_document_hash(
    document_hash: str,
    private_key
) -> bytes:
    """
    Sign the SHA-256 document hash using the doctor's
    private key.
    """

    signature = private_key.sign(
        document_hash.encode("utf-8"),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

    return signature


def verify_document_signature(
    document_hash: str,
    signature: bytes,
    public_key
) -> bool:
    """
    Verify that the signature belongs to the supplied
    document hash and corresponding public key.
    """

    try:
        public_key.verify(
            signature,
            document_hash.encode("utf-8"),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )

        return True

    except Exception:
        return False