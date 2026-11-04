const BASE = "/api";
async function req(path, opts = {}) {
  let r;
  try { r = await fetch(BASE + path, { headers: { "Content-Type": "application/json" }, ...opts }); }
  catch { throw new Error("Backend not reachable. Is the FastAPI server running on port 8000?"); }
  if (!r.ok) {
    let m = r.statusText;
    try { const j = await r.json(); m = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {}
    throw new Error(m);
  }
  return r.json();
}
export const api = {
  get: (p) => req(p),
  post: (p, b) => req(p, { method: "POST", body: JSON.stringify(b || {}) }),
  put: (p, b) => req(p, { method: "PUT", body: JSON.stringify(b) }),
  del: (p) => req(p, { method: "DELETE" }),
};
export function downloadCSV(filename, rows, cols) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
export const fmtTime = (t) => (t ? new Date(t).toLocaleString() : "—");
