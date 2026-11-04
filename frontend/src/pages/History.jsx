import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Chart } from "../components/TempPanel";
import { Badge, Empty, ErrorBox, Page, Pager, Spinner, Stat, useUnit } from "../components/ui";
import { api, downloadCSV, fmtTime } from "../services/api";

const toLocal = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function useHistory() {
  const [f, setF] = useState({ start: toLocal(new Date(Date.now() - 864e5)), end: toLocal(new Date()), sample: "", source: "auto" });
  const [s, setS] = useState({ data: null, error: null, loading: true });
  const [samples, setSamples] = useState([]);
  const load = async () => {
    setS((p) => ({ ...p, loading: true }));
    try {
      const q = new URLSearchParams({ start: new Date(f.start).toISOString(), end: new Date(f.end).toISOString(), source: f.source });
      if (f.sample) q.set("sample_id", f.sample);
      setS({ data: await api.get("/readings/history?" + q), error: null, loading: false });
    } catch (e) { setS({ data: null, error: e.message, loading: false }); }
  };
  useEffect(() => { load(); api.get("/samples").then(setSamples).catch(() => {}); }, []); // eslint-disable-line
  return { f, setF, ...s, load, samples };
}

export function Filters({ h }) {
  const { f, setF, samples, load } = h;
  const bad = new Date(f.start) > new Date(f.end);
  return (
    <div className="card noprint grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <div><label className="lbl">From</label><input type="datetime-local" className="input" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
      <div><label className="lbl">To</label><input type="datetime-local" className="input" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
      <div><label className="lbl">Sample ID</label><select className="input" value={f.sample} onChange={(e) => setF({ ...f, sample: e.target.value })}><option value="">All</option>{samples.map((s) => <option key={s.id}>{s.sample_id}</option>)}</select></div>
      <div><label className="lbl">Data source</label><select className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="auto">Auto (current mode)</option><option value="hardware">Hardware only</option><option value="demo">Simulated only</option><option value="all">All</option></select></div>
      <button className="btn" disabled={bad} onClick={load}>{bad ? "Start must be before end" : "Apply"}</button>
    </div>
  );
}

export const exportCSV = (rows) => downloadCSV("temperature_readings.csv", rows, ["ts", "device_id", "temperature_c", "source", "sample_id"]);

export function ReadingsTable({ rows, size = 10 }) {
  const { c, u } = useUnit(); const [p, setP] = useState(1);
  const r = [...rows].reverse(); const pages = Math.ceil(r.length / size);
  useEffect(() => setP(1), [rows]);
  if (!r.length) return <Empty text="No readings in this range" />;
  return (<><div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Timestamp</th><th className="th">Temperature ({u})</th><th className="th">Source</th><th className="th">Sample</th></tr></thead>
    <tbody>{r.slice((p - 1) * size, p * size).map((x) => <tr key={x.id}><td className="td">{fmtTime(x.ts)}</td><td className="td">{c(x.temperature_c)}</td><td className="td"><Badge color={x.source === "demo" ? "amber" : "green"}>{x.source === "demo" ? "simulated" : "hardware"}</Badge></td><td className="td">{x.sample_id || "—"}</td></tr>)}</tbody></table></div>
    <Pager page={p} pages={pages} setPage={setP} /></>);
}

export default function History() {
  const h = useHistory(); const { c, u } = useUnit(); const st = h.data?.stats;
  return (
    <Page title="Temperature History" actions={<button className="btn2" disabled={!h.data?.readings.length} onClick={() => exportCSV(h.data.readings)}><Download size={16} />Export CSV</button>}>
      <Filters h={h} />
      {h.error && <ErrorBox msg={h.error} />}
      {h.loading ? <Spinner /> : <>
        <div className="card"><Chart rows={h.data?.readings || []} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Stat label="Readings" value={st?.n ?? 0} /><Stat label="Min" value={st?.n ? `${c(st.min)} ${u}` : "—"} /><Stat label="Max" value={st?.n ? `${c(st.max)} ${u}` : "—"} /><Stat label="Average" value={st?.n ? `${c(st.avg)} ${u}` : "—"} /></div></div>
        <div className="card"><h3 className="font-semibold mb-2">Readings</h3><ReadingsTable rows={h.data?.readings || []} /></div></>}
    </Page>
  );
}
