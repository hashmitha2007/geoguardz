# Geoguardz — Crop Health Monitoring Platform

AI-assisted crop disease/pest reporting for farmers, with weather-informed risk
scoring, officer validation, and a GIS hotspot map. Built for SIH 2026, Team PDK-X06.

Pipeline: **Crop image + location → AI image analysis → weather & risk analysis →
risk score (Low/Medium/High) → advisory → GIS map + officer validation.**

## Stack

- **Frontend:** React (Vite) + react-leaflet
- **Backend:** Python + FastAPI
- **AI:** lightweight heuristic image classifier (swap-in point for a trained CNN — see `backend/ai_model.py`)
- **Database:** MongoDB (falls back to in-memory storage automatically if `MONGO_URI` isn't set, so it also runs with zero setup)
- **Weather:** Open-Meteo API (free, no key required)
- **Maps:** Leaflet / OpenStreetMap tiles

## Quick start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`. Try it: `http://localhost:8000/docs`
gives you interactive Swagger docs for every endpoint.

To use real MongoDB instead of the in-memory fallback, set an environment
variable before starting the server:

```bash
export MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>/"
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server proxies
`/api/*` requests to the backend on port 8000 (see `vite.config.js`), so run the
backend first.

### Production build

```bash
cd frontend
npm run build      # outputs static files to frontend/dist
```

Serve `frontend/dist` with any static host (Netlify, Vercel, nginx, S3+CloudFront)
and point it at your deployed FastAPI backend (update the API base URL / CORS origin).

## API reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/reports` | Submit a crop image + details, returns full AI risk assessment |
| GET | `/api/reports` | List reports (`?risk=high`, `?status=Validated` filters) |
| PATCH | `/api/reports/{id}` | Officer validates/flags a report |
| GET | `/api/weather?lat=&lng=` | Weather + derived conditions for a location |
| GET | `/api/stats` | Summary counters for the dashboard |

## Upgrading the AI model

`backend/ai_model.py` currently uses a fast pixel-based heuristic (leaf
discoloration ratio) so the whole pipeline works immediately with no model
download or GPU. To plug in a real trained model (e.g. a CNN fine-tuned on
the PlantVillage dataset, as referenced in the project's research slide):

1. Train/export your model (ONNX, TorchScript, or Keras `.h5`).
2. Replace the body of `analyze_crop_image()` with inference calls to that
   model, keeping the return shape: `{"finding": str, "confidence": 0-100, "stress_ratio": 0-1}`.
3. Nothing else changes — the risk scoring, advisories, and API contract are unaffected.

## Also included: standalone browser demo

`demo/geoguardz-demo.html` is a single self-contained HTML file with the
entire flow (AI analysis, weather, risk scoring, GIS map, officer dashboard)
implemented client-side with browser storage — no backend needed. Useful for
a quick offline demo or a judge who just wants to click through the product
without setting up Python/Node.

## Project structure

```
geoguardz-src/
├── backend/
│   ├── main.py           # FastAPI app & endpoints
│   ├── ai_model.py        # crop image analysis
│   ├── weather.py         # Open-Meteo integration
│   ├── database.py        # MongoDB (with in-memory fallback)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── Home.jsx
│   │       ├── ReportForm.jsx
│   │       ├── OfficerDashboard.jsx
│   │       └── HotspotMap.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── demo/
│   └── geoguardz-demo.html
└── README.md
```
