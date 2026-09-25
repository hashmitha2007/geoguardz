import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats } from "../api.js";

export default function Home() {
  const [stats, setStats] = useState({ total: 0, high_risk: 0, validated: 0, crops_monitored: 0 });

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  return (
    <section>
      <div className="hero">
        <div>
          <h1>AI-powered crop health monitoring, right from a phone.</h1>
          <p>
            Geoguardz lets farmers photograph a crop, get an instant AI risk read combined
            with local weather, and reach agriculture officers directly — with every report
            mapped on a live GIS hotspot map.
          </p>
          <Link className="btn btn-primary" to="/report">📷 Report a crop issue</Link>{" "}
          <Link className="btn btn-ghost" to="/map">🗺️ View hotspot map</Link>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="n">{stats.total}</div><div className="l">Total reports</div></div>
        <div className="stat"><div className="n">{stats.high_risk}</div><div className="l">High-risk cases</div></div>
        <div className="stat"><div className="n">{stats.validated}</div><div className="l">Officer-validated</div></div>
        <div className="stat"><div className="n">{stats.crops_monitored}</div><div className="l">Crops monitored</div></div>
      </div>
    </section>
  );
}
