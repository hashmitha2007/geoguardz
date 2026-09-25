"""
Crop image analysis.

This ships a lightweight heuristic classifier (leaf discoloration ratio via
pixel sampling) so the API is fully functional out of the box with no GPU,
model download, or training data required.

To upgrade to a real trained model (e.g. a CNN fine-tuned on PlantVillage):
  1. Train/export a model (ONNX, TorchScript, or a Keras .h5).
  2. Replace the body of `analyze_crop_image` with a call to that model,
     keeping the same return shape: {"finding": str, "confidence": float 0-100,
     "stress_ratio": float 0-1}.
  3. Everything downstream (risk scoring, advisories, API contract) is unchanged.
"""
import io
from PIL import Image


def analyze_crop_image(image_bytes: bytes) -> dict:
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return {"finding": "Could not read image", "confidence": 30.0, "stress_ratio": 0.1}

    img = img.resize((80, 80))
    pixels = img.getdata()

    total = len(pixels)
    healthy_px = 0
    stressed_px = 0
    dark_px = 0

    for r, g, b in pixels:
        brightness = (r + g + b) / 3
        if brightness < 60:
            dark_px += 1
            continue
        if g > r * 1.05 and g > b * 1.15:
            healthy_px += 1
        elif r > g * 0.95 and r > 90 and b < g:
            stressed_px += 1

    stress_ratio = stressed_px / total
    healthy_ratio = healthy_px / total

    if stress_ratio > 0.30:
        finding = "Likely fungal/bacterial leaf spot"
        confidence = min(92, 55 + round(stress_ratio * 100))
    elif stress_ratio > 0.15:
        finding = "Possible early-stage disease or nutrient stress"
        confidence = min(85, 45 + round(stress_ratio * 100))
    elif healthy_ratio > 0.4:
        finding = "No strong disease signs detected"
        confidence = min(88, 50 + round(healthy_ratio * 60))
    else:
        finding = "Inconclusive — image quality may be limiting analysis"
        confidence = 38

    return {"finding": finding, "confidence": float(confidence), "stress_ratio": stress_ratio}
