import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./components/Home.jsx";
import ReportForm from "./components/ReportForm.jsx";
import OfficerDashboard from "./components/OfficerDashboard.jsx";
import HotspotMap from "./components/HotspotMap.jsx";

export default function App() {
  return (
    <div>
      <header className="top">
        <div className="topbar">
          <div className="brand">🌾 Geoguardz</div>
          <nav className="tabs">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/report">Report Issue</NavLink>
            <NavLink to="/officer">Officer Dashboard</NavLink>
            <NavLink to="/map">Hotspot Map</NavLink>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/map" element={<HotspotMap />} />
        </Routes>
      </main>
    </div>
  );
}
