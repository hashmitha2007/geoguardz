import React, { useState } from "react";
import { submitReport } from "../api.js";

export default function ReportForm() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState("Rice");
  const [symptoms, setSymptoms] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [lat, setLat] = useState("26.15");
  const [lng, setLng] = useState("91.77");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function onFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude.toFixed(4));
      setLng(pos.coords.longitude.toFixed(4));
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!image) { setError("Please upload a crop image."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const report = await submitReport({ image, crop, lat, lng, farmerName, symptoms });
      setResult(report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">Report a crop issue</div>
      <p className="section-sub">Upload a photo and a few details — Geoguardz will analyze it and generate a risk assessment.</p>

      <form onSubmit={onSubmit}>
        <div className="grid2">
          <div>
            <label>Crop photo</label>
            <div className="dropzone" onClick={() => document.getElementById("fileInput").click()}>
              {preview ? <img src={preview} alt="preview" /> : "📷 Click to upload a crop image"}
            </div>
            <input id="fileInput" type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />

            <label>Crop type</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              {["Rice", "Maize", "Wheat", "Tomato", "Potato", "Tea", "Ginger", "Other"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <label>Symptoms observed (optional)</label>
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. yellow spots on leaves, wilting, holes in leaves" />
          </div>
          <div>
            <label>Location</label>
            <div className="row2">
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" />
            </div>
            <button type="button" className="btn btn-ghost" onClick={useMyLocation}>📍 Use my current location</button>

            <label>Farmer name (optional)</label>
            <input value={farmerName} onChange={(e) => setFarmerName(e.target.value)} placeholder="Your name" />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Analyzing..." : "🔍 Analyze & Submit Report"}
        </button>
      </form>

      {error && <p style={{ color: "#e03131" }}>{error}</p>}

      {result && (
        <div className="result">
          <strong>Report {result.id}</strong>{" "}
          <span className={`badge ${result.risk}`}>{result.risk.toUpperCase()} RISK</span>
          <p><strong>AI finding:</strong> {result.finding} ({result.confidence}% confidence)</p>
          <p><strong>Conditions:</strong> {result.weather.temp_c}°C, {result.weather.humidity}% humidity, ~{result.weather.rain_mm}mm rainfall</p>
          <p><strong>Advisory:</strong> {result.advisory}</p>
        </div>
      )}
    </div>
  );
}
