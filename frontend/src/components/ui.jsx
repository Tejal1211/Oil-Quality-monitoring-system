import { createContext, useContext } from "react";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const useUnit = () => {
  const { settings } = useApp(); const f = settings?.unit === "F";
  return { u: f ? "°F" : "°C", c: (v) => (v == null ? "—" : (f ? (v * 9) / 5 + 32 : v).toFixed(1)), raw: (v) => (f ? (v * 9) / 5 + 32 : v) };
};
export function StatusPill({ mode }) {
  const m = { connected: ["Connected", "bg-emerald-100 text-emerald-700"], demo: ["Demo Mode", "bg-amber-100 text-amber-700"], disconnected: ["Disconnected", "bg-red-100 text-red-700"] }[mode] || ["Unknown", "bg-slate-200 text-slate-600"];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m[1]}`}><span className="w-2 h-2 rounded-full bg-current" />{m[0]}</span>;
}
export const Badge = ({ color = "slate", children }) => {
  const c = { slate: "bg-slate-200 text-slate-700", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700", green: "bg-emerald-100 text-emerald-700", teal: "bg-teal-100 text-teal-700", blue: "bg-blue-100 text-blue-700" }[color];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{children}</span>;
};
export const Spinner = ({ label = "Loading…" }) => <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm"><Loader2 className="animate-spin" size={18} />{label}</div>;
export const ErrorBox = ({ msg }) => <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200"><AlertTriangle size={16} />{msg}</div>;
export const Empty = ({ text }) => <div className="flex flex-col items-center gap-2 py-10 text-slate-400 text-sm"><Inbox size={28} />{text}</div>;
export const Page = ({ title, children, actions }) => <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{title}</h2><div className="flex gap-2 noprint">{actions}</div></div>{children}</div>;
export function Pager({ page, pages, setPage }) {
  return <div className="flex items-center justify-end gap-2 pt-3 text-sm noprint"><button className="btn2" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page} / {pages || 1}</span><button className="btn2" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>;
}
export const Stat = ({ label, value }) => <div><div className="lbl">{label}</div><div className="text-lg font-semibold">{value}</div></div>;
