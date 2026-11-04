import { useEffect, useState } from "react";
import { usePoll } from "../hooks/usePoll";
import { api, fmtTime } from "../services/api";
import { Badge, Page, Stat, StatusPill, useApp, useUnit } from "../components/ui";

export default function Devices() {
  const { status, settings, toast, confirm, setSettings, reloadStatus } = useApp(); const { c, u } = useUnit();
  const { data: health, error } = usePoll("/health", 5000);
  const { data: ports, reload: reloadPorts } = usePoll("/ports", 15000);
  const [port, setPort] = useState(""); const [baud, setBaud] = useState(9600);
  useEffect(() => { if (settings) { setPort(settings.serial_port); setBaud(settings.baud); } }, [settings]);
  const save = async () => {
    if (!(await confirm(`Apply ${port} @ ${baud} baud and reconnect?`))) return;
    try { setSettings(await api.put("/settings", { serial_port: port, baud: Number(baud) })); toast("Serial settings saved; reconnecting"); reloadStatus(); } catch (e) { toast(e.message, "err"); }
  };
  const retry = async () => { try { await api.post("/device/reconnect"); toast("Reconnect requested"); setTimeout(reloadStatus, 3000); } catch (e) { toast(e.message, "err"); } };
  return (
    <Page title="Device Management" actions={<button className="btn" onClick={retry}>Reconnect / Retry</button>}>
      <div className="card grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Device" value="Arduino Uno R3" /><Stat label="Device ID" value={status?.device_id || "—"} /><Stat label="Sensor" value="DS18B20" />
        <div><div className="lbl">Connection</div><StatusPill mode={status?.mode || "disconnected"} /></div>
        <Stat label="Serial port" value={<>{status?.port} <Badge color={status?.serial_open ? "green" : "red"}>{status?.serial_open ? "open" : "closed"}</Badge></>} />
        <Stat label="Baud rate" value={status?.baud || 9600} />
        <Stat label="Last reading" value={status?.last_reading ? `${c(status.last_reading.temperature_c)} ${u} (${status.last_reading.source})` : "—"} />
        <div><div className="lbl">Backend service</div><Badge color={health ? "green" : "red"}>{health ? "Running" : error ? "Unreachable" : "Checking…"}</Badge></div>
        {status?.error && <div className="sm:col-span-2 lg:col-span-4 text-sm text-red-600">Last error: {status.error}</div>}
        {status?.mode === "demo" && <div className="sm:col-span-2 lg:col-span-4 text-sm text-amber-700">Backend is in Demo Mode: no hardware confirmed. Values are simulated.</div>}
      </div>
      <div className="card"><h3 className="font-semibold mb-3">Serial configuration</h3>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div><label className="lbl">Port (detected: {ports?.ports?.length ? ports.ports.join(", ") : "none"})</label><input className="input" list="ports" value={port} onChange={(e) => setPort(e.target.value)} /><datalist id="ports">{ports?.ports?.map((p) => <option key={p} value={p} />)}</datalist></div>
          <div><label className="lbl">Baud rate</label><select className="input" value={baud} onChange={(e) => setBaud(e.target.value)}>{[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => <option key={b}>{b}</option>)}</select></div>
          <div className="flex gap-2"><button className="btn" onClick={save}>Save & reconnect</button><button className="btn2" onClick={reloadPorts}>Scan ports</button></div>
        </div><p className="text-xs text-slate-500 mt-2">Baud must match the Arduino sketch (9600).</p></div>
      <div className="card"><h3 className="font-semibold mb-2">Hardware troubleshooting</h3>
        <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <li>Check the USB cable and that Arduino IDE sees the board (Tools → Port).</li>
          <li>Close Arduino IDE Serial Monitor: only one program can use the port.</li>
          <li>Use the COM port shown in Device Manager (Windows) and set it above.</li>
          <li>DS18B20 needs a 4.7 kΩ pull-up between data (D7) and 5V. A reading of -127 °C means disconnected sensor.</li>
          <li>Install CH340 drivers if you have a clone board that doesn't show up.</li>
          <li>Baud rate must be 9600 on both sides.</li>
        </ul></div>
    </Page>
  );
}
