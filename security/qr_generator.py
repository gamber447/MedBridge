import qrcode
from pathlib import Path


def generate_qr_code(token: str, output_path: str) -> str:
    """
    Generate a QR code containing only the secure
    MedBridge verification token.
    """

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(token)
    qr.make(fit=True)

    image = qr.make_image()

    output_file = Path(output_path)
    output_file.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    image.save(output_file)

    return str(output_file)