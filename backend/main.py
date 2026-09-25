"""
Geoguardz backend — FastAPI service for the AI-assisted crop health
monitoring platform.

Endpoints:
  POST /api/reports          -> submit a new crop report (image + details), returns AI risk assessment
  GET  /api/reports          -> list all reports (optional ?risk=, ?status= filters)
  PATCH /api/reports/{id}    -> officer validates/flags a report
  GET  /api/weather          -> weather + derived risk factors for a lat/lng
  GET  /api/stats            -> summary counters for the dashboard

Run:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""
import time
import uuid
from typing import Optional, Literal

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_model import analyze_crop_image
from weather import get_weather
from database import ReportsDB

app = FastAPI(title="Geoguardz API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend's origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

db = ReportsDB()


class ReportStatusUpdate(BaseModel):
    status: Literal["Validated", "Flagged for field visit", "Pending review"]
    officer_note: Optional[str] = None


def risk_from(confidence: float, stress_ratio: float, humidity: float, rain_mm: float) -> str:
    score = stress_ratio * 100 * 0.55 + confidence * 0.25
    score += 15 if humidity > 75 else 7 if humidity > 60 else 0
    score += 8 if rain_mm > 18 else 0
    if score >= 55:
        return "high"
    if score >= 30:
        return "medium"
    return "low"


def advisory_for(risk: str, crop: str) -> str:
    if risk == "high":
        return (f"High risk detected for {crop}. Isolate affected plants where possible, avoid "
                 f"over-irrigation, and consult your local agriculture extension officer before "
                 f"applying any treatment. Continue monitoring daily.")
    if risk == "medium":
        return (f"Moderate risk for {crop}. Monitor the field every 2-3 days, remove visibly "
                 f"affected leaves, and improve field drainage/airflow. Avoid unnecessary "
                 f"pesticide use until symptoms are confirmed.")
    return f"Low risk for {crop} based on current image and conditions. Continue routine monitoring."


@app.post("/api/reports")
async def create_report(
    image: UploadFile = File(...),
    crop: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    farmer_name: str = Form("Anonymous farmer"),
    symptoms: str = Form(""),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(400, "Empty image upload")

    analysis = analyze_crop_image(image_bytes)          # {finding, confidence, stress_ratio}
    weather = await get_weather(lat, lng)                # {temp_c, humidity, rain_mm}
    risk = risk_from(analysis["confidence"], analysis["stress_ratio"],
                      weather["humidity"], weather["rain_mm"])
    advisory = advisory_for(risk, crop)

    report = {
        "id": "GR" + uuid.uuid4().hex[:10].upper(),
        "date": time.time(),
        "farmer_name": farmer_name,
        "crop": crop,
        "symptoms": symptoms,
        "lat": lat,
        "lng": lng,
        "finding": analysis["finding"],
        "confidence": analysis["confidence"],
        "weather": weather,
        "risk": risk,
        "advisory": advisory,
        "status": "Pending review",
    }
    await db.insert(report)
    return report


@app.get("/api/reports")
async def list_reports(risk: Optional[str] = None, status: Optional[str] = None):
    return await db.list(risk=risk, status=status)


@app.patch("/api/reports/{report_id}")
async def update_report(report_id: str, update: ReportStatusUpdate):
    updated = await db.update_status(report_id, update.status, update.officer_note)
    if not updated:
        raise HTTPException(404, "Report not found")
    return updated


@app.get("/api/weather")
async def weather(lat: float, lng: float):
    return await get_weather(lat, lng)


@app.get("/api/stats")
async def stats():
    all_reports = await db.list()
    total = len(all_reports)
    high = sum(1 for r in all_reports if r["risk"] == "high")
    validated = sum(1 for r in all_reports if r["status"] == "Validated")
    crops = len({r["crop"] for r in all_reports})
    return {"total": total, "high_risk": high, "validated": validated, "crops_monitored": crops}


@app.get("/")
async def root():
    return {"service": "Geoguardz API", "status": "ok"}
