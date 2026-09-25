import React, { useEffect, useState } from "react";
import { fetchReports, updateReportStatus } from "../api.js";

export default function OfficerDashboard() {
  const [reports, setReports] = useState([]);

  function load() {
    fetchReports().then(setReports).catch(() => {});
  }
  useEffect(load, []);

  async function act(id, status) {
    await updateReportStatus(id, status);
    load();
  }

  return (
    <div className="card">
      <div className="section-title">Officer Dashboard</div>
      <p className="section-sub">All reports across the region. Validate AI predictions or flag ones that need a field visit.</p>
      <table>
        <thead>
          <tr><th>Farmer</th><th>Crop</th><th>AI Finding</th><th>Confidence</th><th>Risk</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.farmer_name}</td>
              <td>{r.crop}</td>
              <td>{r.finding}</td>
              <td>{r.confidence}%</td>
              <td><span className={`badge ${r.risk}`}>{r.risk.toUpperCase()}</span></td>
              <td>{r.status}</td>
              <td>
                <button className="pill-btn accept" onClick={() => act(r.id, "Validated")}>Validate</button>{" "}
                <button className="pill-btn reject" onClick={() => act(r.id, "Flagged for field visit")}>Flag</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && <p className="empty">No reports submitted yet.</p>}
    </div>
  );
}
