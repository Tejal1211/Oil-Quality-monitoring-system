import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Page, useApp } from "../components/ui";

export default function SettingsPage() {
  const { settings, setSettings, toast, confirm } = useApp();
  const [f, setF] = useState(null); const [errs, setErrs] = useState({});
  useEffect(() => { if (settings) setF({ ...settings }); }, [settings]);
  if (!f) return <p>Loading…</p>;
  const set = (k, v) => setF({ ...f, [k]: v });
  const num = (k, l, min, max, step = 1, hint) => <div><label className="lbl">{l}</label><input type="number" className="input" min={min} max={max} step={step} value={f[k]} onChange={(e) => set(k, e.target.value)} />{hint && <p className="text-[11px] text-slate-400">{hint}</p>}{errs[k] && <p className="text-xs text-red-600">{errs[k]}</p>}</div>;
  const sel = (k, l, opts) => <div><label className="lbl">{l}</label><select className="input" value={f[k]} onChange={(e) => set(k, e.target.value)}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>;
  const chk = (k, l) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>;

  async function save() {
    const e = {}; const n = (k) => Number(f[k]);
    if (!(n("temp_warn") >= -50 && n("temp_warn") <= 300)) e.temp_warn = "-50 to 300 °C";
    if (!(n("temp_crit") > n("temp_warn"))) e.temp_crit = "Must be greater than the warning threshold";
    if (!(n("refresh_s") >= 1 && n("refresh_s") <= 300)) e.refresh_s = "1 to 300 s";
    if (!(n("retention_days") >= 1 && n("retention_days") <= 3650)) e.retention_days = "1 to 3650 days";
    if (!(n("no_data_timeout_s") >= 5 && n("no_data_timeout_s") <= 3600)) e.no_data_timeout_s = "5 to 3600 s";
    if (!(n("abnormal_delta") > 0)) e.abnormal_delta = "Must be > 0";
    if (!f.serial_port.trim()) e.serial_port = "Required";
    setErrs(e); if (Object.keys(e).length) return toast("Please fix the highlighted fields", "err");
    if (!(await confirm("Save settings?"))) return;
    try {
      const body = { ...f }; ["temp_warn", "temp_crit", "refresh_s", "retention_days", "no_data_timeout_s", "abnormal_delta", "baud"].forEach((k) => (body[k] = Number(body[k])));
      setSettings(await api.put("/settings", body)); toast("Settings saved");
    } catch (e) { toast(e.message, "err"); }
  }
  return (
    <Page title="Settings" actions={<button className="btn" onClick={save}>Save settings</button>}>
      <div className="card"><h3 className="font-semibold mb-1">Temperature thresholds</h3><p className="text-xs text-amber-600 mb-3">Defaults (60 / 80 °C) are only examples. Calibrate for your oil and application. Values are stored in °C.</p>
        <div className="grid sm:grid-cols-3 gap-3">{num("temp_warn", "Warning threshold (°C)", -50, 300, 0.5)}{num("temp_crit", "Critical threshold (°C)", -50, 300, 0.5)}{num("abnormal_delta", "Abnormal change (°C between readings)", 0.5, 100, 0.5)}</div></div>
      <div className="card"><h3 className="font-semibold mb-3">Display & data</h3>
        <div className="grid sm:grid-cols-4 gap-3">{num("refresh_s", "Refresh interval (s)", 1, 300)}{sel("unit", "Temperature unit", [["C", "Celsius (°C)"], ["F", "Fahrenheit (°F)"]])}{sel("theme", "Theme", [["light", "Light"], ["dark", "Dark"]])}{num("retention_days", "Data retention (days)", 1, 3650)}</div></div>
      <div className="card"><h3 className="font-semibold mb-3">Notifications</h3>
        <div className="flex flex-wrap gap-6 mb-3">{chk("notify_enabled", "Enable alert notifications")}{chk("notify_sound", "Sound")}</div>{num("no_data_timeout_s", "No-data alert after (s)", 5, 3600)}</div>
      <div className="card"><h3 className="font-semibold mb-3">Serial & mode</h3>
        <div className="grid sm:grid-cols-3 gap-3"><div><label className="lbl">Serial port</label><input className="input" value={f.serial_port} onChange={(e) => set("serial_port", e.target.value)} />{errs.serial_port && <p className="text-xs text-red-600">{errs.serial_port}</p>}</div>
          {sel("baud", "Baud rate", [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => [b, b]))}
          {sel("demo_mode", "Demo Mode", [["auto", "Auto (use demo only if no hardware)"], ["off", "Off (real hardware only)"], ["force", "Always on (simulated)"]])}</div></div>
    </Page>
  );
}
