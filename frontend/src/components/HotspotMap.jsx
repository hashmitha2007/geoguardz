import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchReports } from "../api.js";

const COLORS = { low: "#2f9e44", medium: "#f0a500", high: "#e03131" };

export default function HotspotMap() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports().then(setReports).catch(() => {});
  }, []);

  return (
    <div className="card">
      <div className="section-title">Disease &amp; Pest Hotspot Map</div>
      <p className="section-sub">GIS view of all reported cases, color-coded by risk level.</p>
      <MapContainer center={[26.15, 91.77]} zoom={6} style={{ height: 460, borderRadius: 12 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((r) => (
          <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={9}
            pathOptions={{ color: COLORS[r.risk], fillColor: COLORS[r.risk], fillOpacity: 0.75 }}>
            <Popup>
              <strong>{r.crop}</strong><br />{r.finding}<br />Risk: {r.risk}<br />Status: {r.status}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="legend">
        <span><i className="dot" style={{ background: COLORS.low }} /> Low risk</span>
        <span><i className="dot" style={{ background: COLORS.medium }} /> Medium risk</span>
        <span><i className="dot" style={{ background: COLORS.high }} /> High risk</span>
      </div>
    </div>
  );
}
