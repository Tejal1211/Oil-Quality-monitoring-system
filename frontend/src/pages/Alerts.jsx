import { useState } from "react";
import { usePoll } from "../hooks/usePoll";
import { api, fmtTime } from "../services/api";
import { Badge, Empty, ErrorBox, Page, Spinner, useApp } from "../components/ui";

const TYPES = { temp_high: "Temperature above threshold", sensor_disconnected: "Sensor disconnected", no_data: "No data received", serial_failure: "Serial communication failure", abnormal_change: "Abnormal temperature change", test: "Test alert" };

export default function Alerts() {
  const { toast, confirm, reloadStatus } = useApp(); const [f, setF] = useState("");
  const { data, error, loading, reload } = usePoll("/alerts" + (f ? `?status=${f}` : ""), 5000);
  const act = async (a, kind) => {
    if (kind === "resolve" && !(await confirm(`Mark alert #${a.id} as resolved?`))) return;
    try { await api.post(`/alerts/${a.id}/${kind}`); toast(kind === "resolve" ? "Alert resolved" : "Alert acknowledged"); reload(); reloadStatus(); } catch (e) { toast(e.message, "err"); }
  };
  const sev = { critical: "red", warning: "amber", info: "blue" };
  return (
    <Page title="Alerts & Notifications" actions={<>
      <select className="input !w-40" value={f} onChange={(e) => setF(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select>
      <button className="btn2" onClick={async () => { try { await api.post("/alerts/test"); toast("Test alert created"); reload(); reloadStatus(); } catch (e) { toast(e.message, "err"); } }}>Create test alert</button></>}>
      <div className="card">
        {error && <ErrorBox msg={error} />}
        {loading && !data ? <Spinner /> : !data?.length ? <Empty text="No alerts" /> :
          <div className="overflow-x-auto"><table className="w-full"><thead><tr>{["Type", "Severity", "Time", "Device", "Description", "Status", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{data.map((a) => <tr key={a.id}><td className="td font-medium">{TYPES[a.type] || a.type}</td><td className="td"><Badge color={sev[a.severity]}>{a.severity}</Badge></td><td className="td whitespace-nowrap">{fmtTime(a.created_at)}</td><td className="td">{a.device_id}</td><td className="td min-w-[240px]">{a.description}</td>
              <td className="td"><Badge color={a.status === "open" ? "red" : a.status === "acknowledged" ? "amber" : "green"}>{a.status}</Badge></td>
              <td className="td"><div className="flex gap-1">{a.status === "open" && <button className="btn2" onClick={() => act(a, "acknowledge")}>Acknowledge</button>}{a.status !== "resolved" && <button className="btn" onClick={() => act(a, "resolve")}>Resolve</button>}</div></td></tr>)}</tbody></table></div>}
        <p className="text-xs text-slate-500 mt-3">A temperature alert is not proof that oil is degraded or unsafe. Thresholds are examples; edit them in Settings.</p>
      </div>
    </Page>
  );
}
