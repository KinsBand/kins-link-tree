import os
import qrcode
from PIL import Image, ImageDraw

def generate_kins_branded_qr(
    data_url="https://kinsband.com/?utm_source=merch_qr",
    logo_path="public/kins-logo-new.png",
    output_path="dist/kins-branded-qr-300dpi.png",
    box_size=20,
    border=4
):
    """
    Generates a print-ready 300 DPI QR Code with Error Correction Level H (High, 30%)
    and overlays the Kins band logo in a central dark circular quiet-zone badge (~20% total area).
    """
    print(f"Generating QR Code for: {data_url}")
    
    # 1. Create QR Code with High Error Correction (Level H)
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data_url)
    qr.make(fit=True)

    # Make base image (RGB)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    qr_width, qr_height = qr_img.size

    # 2. Calculate Logo Quiet-Zone Dimensions (Max 20% of QR size)
    logo_max_size = int(qr_width * 0.20)

    # 3. Create Solid Dark Circle Quiet Zone Badge in Center with White Border
    draw = ImageDraw.Draw(qr_img)
    center_x, center_y = qr_width // 2, qr_height // 2
    radius = (logo_max_size // 2) + 12

    # Draw solid dark circle badge (#0a0a0c) so white brush stroke logo letters contrast sharply
    draw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        fill="#0a0a0c",
        outline="white",
        width=4
    )

    # 4. Open and Resize Band Logo
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        
        # Calculate aspect ratio
        aspect = logo.width / logo.height
        if aspect > 1:
            w = logo_max_size
            h = int(logo_max_size / aspect)
        else:
            h = logo_max_size
            w = int(logo_max_size * aspect)
            
        logo = logo.resize((w, h), Image.Resampling.LANCZOS)

        # Paste logo into center
        pos = (center_x - (w // 2), center_y - (h // 2))
        qr_img.paste(logo, pos, mask=logo)
    else:
        print(f"Warning: Logo file not found at {logo_path}. QR code generated with fallback.")

    # 5. Ensure output directory exists and save PNG
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    qr_img.save(output_path, "PNG", dpi=(300, 300))
    print(f"✅ Print-Ready Branded QR Code successfully saved to: {output_path}")

if __name__ == "__main__":
    generate_kins_branded_qr()
