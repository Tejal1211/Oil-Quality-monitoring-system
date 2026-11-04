import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { usePoll } from "../hooks/usePoll";
import { Badge, Empty, ErrorBox, Spinner, Stat, useApp, useUnit } from "./ui";
import { fmtTime } from "../services/api";

export const RANGES = [["1 hour", 1], ["6 hours", 6], ["24 hours", 24], ["7 days", 168]];

export function Chart({ rows, height = 300 }) {
  const { c, u, raw } = useUnit(); const { settings } = useApp();
  if (!rows.length) return <Empty text="Waiting for sensor data" />;
  const data = rows.map((r) => ({ t: new Date(r.ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), v: +raw(r.temperature_c).toFixed(2) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 10, top: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
        <XAxis dataKey="t" tick={{ fontSize: 11 }} minTickGap={50} />
        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit={u} />
        <Tooltip formatter={(v) => [`${v} ${u}`, "Temperature"]} />
        {settings && <ReferenceLine y={+raw(settings.temp_warn).toFixed(1)} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Warn (example)", fontSize: 10, fill: "#f59e0b" }} />}
        <Line type="monotone" dataKey="v" stroke="#0d9488" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function TempPanel({ big = false }) {
  const { status, settings } = useApp(); const { c, u } = useUnit();
  const [h, setH] = useState(1);
  const { data, error, loading } = usePoll(`/readings/history?hours=${h}`, (settings?.refresh_s || 5) * 1000);
  const last = status?.last_reading;
  const st = data?.stats;
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="lbl">Current temperature</div>
          <div className={`font-bold ${big ? "text-5xl" : "text-4xl"}`}>{last ? c(last.temperature_c) : "—"}<span className="text-xl ml-1">{u}</span></div>
          <div className="text-xs text-slate-500 mt-1">Latest: {fmtTime(last?.ts)} {last && <Badge color={last.source === "demo" ? "amber" : "green"}>{last.source === "demo" ? "Simulated demo data" : "Hardware data"}</Badge>}</div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {RANGES.map(([l, v]) => <button key={v} onClick={() => setH(v)} className={h === v ? "btn" : "btn2"}>{l}</button>)}
        </div>
      </div>
      {error && <ErrorBox msg={error} />}
      {loading && !data ? <Spinner /> : <Chart rows={data?.readings || []} height={big ? 380 : 280} />}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Stat label="Minimum" value={st?.n ? `${c(st.min)} ${u}` : "—"} />
        <Stat label="Maximum" value={st?.n ? `${c(st.max)} ${u}` : "—"} />
        <Stat label="Average" value={st?.n ? `${c(st.avg)} ${u}` : "—"} />
      </div>
    </div>
  );
}
