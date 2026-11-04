import { Download, Printer } from "lucide-react";
import { ReadingsTable, Filters, exportCSV, useHistory } from "./History";
import { Page, Spinner, Stat, ErrorBox, useUnit } from "../components/ui";
import { fmtTime } from "../services/api";

export default function Reports() {
  const h = useHistory(); const { c, u } = useUnit(); const st = h.data?.stats;
  const src = h.data?.source === "demo" ? "SIMULATED demonstration data (not real hardware)" : h.data?.source === "all" ? "Mixed: hardware and simulated" : "Arduino Uno R3 + DS18B20 (hardware)";
  return (
    <Page title="Reports" actions={<><button className="btn2" disabled={!h.data?.readings.length} onClick={() => exportCSV(h.data.readings)}><Download size={16} />CSV</button><button className="btn" onClick={() => window.print()}><Printer size={16} />Print</button></>}>
      <Filters h={h} />
      {h.error && <ErrorBox msg={h.error} />}
      {h.loading ? <Spinner /> : (
        <div className="card space-y-4">
          <div><h3 className="text-lg font-bold">OilSense AI – Smart Oil Quality Monitoring System</h3><p className="text-sm text-slate-500">Temperature Monitoring Report · generated {new Date().toLocaleString()}</p></div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><b>Device ID:</b> ARDUINO-UNO-001</div><div><b>Sample ID:</b> {h.f.sample || "Not specified"}</div>
            <div><b>Date range:</b> {fmtTime(h.f.start)} to {fmtTime(h.f.end)}</div><div><b>Units:</b> {u}</div>
            <div className="sm:col-span-2"><b>Data source:</b> {src}</div></div>
          <div className="grid grid-cols-4 gap-4"><Stat label="Readings" value={st?.n ?? 0} /><Stat label="Min" value={st?.n ? `${c(st.min)} ${u}` : "—"} /><Stat label="Max" value={st?.n ? `${c(st.max)} ${u}` : "—"} /><Stat label="Average" value={st?.n ? `${c(st.avg)} ${u}` : "—"} /></div>
          <ReadingsTable rows={h.data?.readings || []} size={15} />
          <p className="text-xs text-slate-500 border-t pt-3">Insufficient data for oil quality assessment. Temperature alone cannot determine oil purity, contamination, acidity, viscosity or remaining life. Alert thresholds are example values. {h.data?.downsampled && "Data was down-sampled for display."}</p>
        </div>)}
    </Page>
  );
}
