import io
import json

import qrcode
from fastapi.responses import StreamingResponse


def generate_qr_image(registration):

    payload = {
        "registration_id": registration.id,
        "token": registration.qr_token
    }

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(json.dumps(payload))
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png"
    )