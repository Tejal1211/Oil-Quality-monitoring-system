import { Thermometer, ShieldCheck, Plug, FlaskConical, TrendingUp, TrendingDown, Minus } from "lucide-react";
import TempPanel from "../components/TempPanel";
import { Badge, Page, useApp, useUnit } from "../components/ui";
import { fmtTime } from "../services/api";

export default function Dashboard() {
  const { status, settings } = useApp(); const { c, u } = useUnit();
  const last = status?.last_reading; const t = last?.temperature_c; const prev = last?.previous_c;
  const delta = t != null && prev != null ? t - prev : null;
  const Trend = delta == null || Math.abs(delta) < 0.05 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  let st = ["No data", "slate"];
  if (t != null && settings) st = t >= settings.temp_crit ? ["High", "red"] : t >= settings.temp_warn ? ["Warning", "amber"] : ["Normal", "green"];
  const Head = ({ I, label }) => <div className="flex items-center gap-2 lbl"><I size={14} />{label}</div>;
  return (
    <Page title="Dashboard">
      {status?.mode === "demo" && <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">Demo Mode: readings shown are <b>simulated</b> and are not from real hardware. Connect the Arduino to use real data.</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card"><Head I={Thermometer} label="Current Oil Temperature" />
          <div className="text-3xl font-bold">{t != null ? c(t) : "—"} <span className="text-base">{u}</span></div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Trend size={14} />{t == null ? "Waiting for sensor data" : prev == null ? "No previous reading" : `Previous ${c(prev)} ${u} (${delta >= 0 ? "+" : ""}${(settings?.unit === "F" ? delta * 1.8 : delta).toFixed(2)})`}</div></div>
        <div className="card"><Head I={ShieldCheck} label="Temperature Status" />
          <Badge color={st[1]}>{st[0]}</Badge>
          <div className="text-xs text-slate-500 mt-2">Warn ≥ {c(settings?.temp_warn)}{u}, High ≥ {c(settings?.temp_crit)}{u}. <b>Example thresholds</b>: calibrate for your oil and application.</div></div>
        <div className="card"><Head I={Plug} label="Sensor Connection" />
          <Badge color={status?.connected ? "green" : status?.mode === "demo" ? "amber" : "red"}>{status?.connected ? "Connected" : status?.mode === "demo" ? "Simulated" : "Disconnected"}</Badge>
          <div className="text-xs text-slate-500 mt-2">Sensor: {status?.sensor || "DS18B20"}<br />Last reading: {fmtTime(status?.last_ts)}</div></div>
        <div className="card"><Head I={FlaskConical} label="Oil Condition Monitoring" />
          <Badge color={t != null ? "blue" : "slate"}>{t != null ? "Monitoring Active (temperature only)" : "Data Insufficient"}</Badge>
          <div className="text-xs text-slate-500 mt-2">Available: Temperature. Not installed: colour.<br /><b>Insufficient data for oil quality assessment.</b></div></div>
      </div>
      <TempPanel />
    </Page>
  );
}
