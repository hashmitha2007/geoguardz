const BASE = "/api";

export async function submitReport({ image, crop, lat, lng, farmerName, symptoms }) {
  const form = new FormData();
  form.append("image", image);
  form.append("crop", crop);
  form.append("lat", lat);
  form.append("lng", lng);
  form.append("farmer_name", farmerName || "Anonymous farmer");
  form.append("symptoms", symptoms || "");

  const res = await fetch(`${BASE}/reports`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to submit report");
  return res.json();
}

export async function fetchReports(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${BASE}/reports?${params}`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function updateReportStatus(id, status) {
  const res = await fetch(`${BASE}/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update report");
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
