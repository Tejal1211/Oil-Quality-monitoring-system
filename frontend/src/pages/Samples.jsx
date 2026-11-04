import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Radio } from "lucide-react";
import { usePoll } from "../hooks/usePoll";
import { api, fmtTime } from "../services/api";
import { Empty, ErrorBox, Page, Pager, Spinner, useApp, useUnit } from "../components/ui";

const blank = () => ({ sample_id: "", oil_type: "", collected_at: new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16), equipment: "", notes: "", temperature_c: "" });

export default function Samples() {
  const { toast, confirm, settings, loadSettings } = useApp(); const { c, u } = useUnit();
  const { data, error, loading, reload } = usePoll("/samples", 10000);
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [sort, setSort] = useState(["collected_at", -1]); const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); const [err, setErr] = useState("");
  const rows = useMemo(() => {
    let r = (data || []).filter((s) => (!type || s.oil_type === type) && JSON.stringify(s).toLowerCase().includes(q.toLowerCase()));
    return r.sort((a, b) => ((a[sort[0]] ?? "") > (b[sort[0]] ?? "") ? 1 : -1) * sort[1]);
  }, [data, q, type, sort]);
  const pages = Math.ceil(rows.length / 5);
  const types = [...new Set((data || []).map((s) => s.oil_type))];
  const th = (k, l) => <th className="th cursor-pointer select-none" onClick={() => setSort([k, sort[0] === k ? -sort[1] : 1])}>{l}{sort[0] === k ? (sort[1] > 0 ? " ▲" : " ▼") : ""}</th>;

  async function save() {
    setErr("");
    if (!/^[A-Za-z0-9_-]+$/.test(form.sample_id)) return setErr("Sample ID: letters, numbers, - and _ only.");
    if (!form.oil_type.trim()) return setErr("Oil type is required.");
    const body = { ...form, temperature_c: form.temperature_c === "" ? null : Number(form.temperature_c) };
    try {
      form.id ? await api.put(`/samples/${form.id}`, body) : await api.post("/samples", body);
      toast("Sample saved"); setForm(null); reload();
    } catch (e) { setErr(e.message); }
  }
  async function remove(s) { if (await confirm(`Delete sample ${s.sample_id}?`)) { try { await api.del(`/samples/${s.id}`); toast("Sample deleted"); reload(); } catch (e) { toast(e.message, "err"); } } }
  async function activate(s) {
    try { await api.put("/settings", { active_sample_id: settings.active_sample_id === s.sample_id ? "" : s.sample_id }); await loadSettings(); toast("Active sample updated"); } catch (e) { toast(e.message, "err"); }
  }
  const F = (k, l, p = {}) => <div><label className="lbl">{l}</label><input className="input" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...p} /></div>;

  return (
    <Page title="Oil Samples" actions={<button className="btn" onClick={() => { setErr(""); setForm(blank()); }}><Plus size={16} />New sample</button>}>
      <div className="card">
        <div className="flex flex-wrap gap-3 mb-3 noprint">
          <input className="input !w-64" placeholder="Search samples…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className="input !w-48" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">All oil types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        {error && <ErrorBox msg={error} />}
        {loading && !data ? <Spinner /> : !rows.length ? <Empty text={data?.length ? "No samples match the filters" : "No samples registered yet"} /> : <>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr>{th("sample_id", "Sample ID")}{th("oil_type", "Oil type")}{th("collected_at", "Collected")}{th("equipment", "Equipment")}{th("temperature_c", `Temp (${u})`)}<th className="th">Notes</th><th className="th noprint">Actions</th></tr></thead>
            <tbody>{rows.slice((page - 1) * 5, page * 5).map((s) => <tr key={s.id}><td className="td font-medium">{s.sample_id}{settings?.active_sample_id === s.sample_id && <span className="ml-2 text-[10px] text-teal-600 font-bold">ACTIVE</span>}</td><td className="td">{s.oil_type}</td><td className="td">{fmtTime(s.collected_at)}</td><td className="td">{s.equipment || "—"}</td><td className="td">{s.temperature_c != null ? c(s.temperature_c) : "—"}</td><td className="td max-w-[200px] truncate">{s.notes || "—"}</td>
              <td className="td noprint"><div className="flex gap-1"><button className="btn2 !px-2" title="Tag live readings with this sample" onClick={() => activate(s)}><Radio size={14} /></button><button className="btn2 !px-2" onClick={() => { setErr(""); setForm({ ...s, temperature_c: s.temperature_c ?? "" }); }}><Pencil size={14} /></button><button className="btn2 !px-2" onClick={() => remove(s)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
          <Pager page={page} pages={pages} setPage={setPage} /></>}
        <p className="text-xs text-slate-500 mt-3">Samples are records only. No laboratory results or "safe/unsafe" classification are generated. The <Radio size={11} className="inline" /> button tags incoming readings with that sample ID.</p>
      </div>
      {form && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><div className="card max-w-lg w-full space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold">{form.id ? "Edit sample" : "Register new sample"}</h3>
        <div className="grid sm:grid-cols-2 gap-3">{F("sample_id", "Sample ID *")}{F("oil_type", "Oil type *")}{F("collected_at", "Collected at *", { type: "datetime-local" })}{F("equipment", "Machine / equipment")}{F("temperature_c", `Measured temperature (°C)`, { type: "number", step: "0.1" })}</div>
        <div><label className="lbl">Notes</label><textarea className="input" rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        {err && <ErrorBox msg={err} />}
        <div className="flex justify-end gap-2"><button className="btn2" onClick={() => setForm(null)}>Cancel</button><button className="btn" onClick={save}>Save</button></div>
      </div></div>}
    </Page>
  );
}
