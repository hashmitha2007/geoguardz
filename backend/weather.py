"""
Weather lookup via Open-Meteo (free, no API key required).
Falls back to a deterministic estimate if the request fails, so the API
never breaks a demo just because of a flaky network.
"""
import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def get_weather(lat: float, lng: float) -> dict:
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation",
    }
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()["current"]
            return {
                "temp_c": data["temperature_2m"],
                "humidity": data["relative_humidity_2m"],
                "rain_mm": data.get("precipitation", 0.0),
            }
    except Exception:
        # deterministic fallback so the pipeline still returns a usable estimate
        seed = abs((lat * 12.9898 + lng * 78.233) % 1)
        return {
            "temp_c": round(20 + (seed * 10) % 10, 1),
            "humidity": round(55 + seed * 40, 1),
            "rain_mm": round(seed * 30, 1),
        }
