import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Ctx } from "./components/ui";
import { Sidebar, Topbar } from "./components/Layout";
import { usePoll } from "./hooks/usePoll";
import { api } from "./services/api";
import Dashboard from "./pages/Dashboard";
import Live from "./pages/Live";
import History from "./pages/History";
import Samples from "./pages/Samples";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Devices from "./pages/Devices";
import SettingsPage from "./pages/SettingsPage";

const PAGES = { dashboard: Dashboard, live: Live, history: History, samples: Samples, alerts: Alerts, reports: Reports, devices: Devices, settings: SettingsPage };
const getPage = () => (PAGES[location.hash.slice(1)] ? location.hash.slice(1) : "dashboard");

export default function App() {
  const [page, setPage] = useState(getPage());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dlg, setDlg] = useState(null);
  const [settings, setSettings] = useState(null);
  const { data: status, reload: reloadStatus } = usePoll("/status", (settings?.refresh_s || 5) * 1000);

  const loadSettings = useCallback(() => api.get("/settings").then(setSettings).catch(() => {}), []);
  useEffect(() => { loadSettings(); const h = () => setPage(getPage()); addEventListener("hashchange", h); return () => removeEventListener("hashchange", h); }, [loadSettings]);
  useEffect(() => { document.documentElement.classList.toggle("dark", settings?.theme === "dark"); }, [settings?.theme]);

  const go = (p) => { location.hash = p; };
  const toast = (msg, type = "ok") => { const id = Math.random(); setToasts((t) => [...t, { id, msg, type }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500); };
  const confirm = (msg) => new Promise((res) => setDlg({ msg, res }));
  const refresh = () => { reloadStatus(); loadSettings(); toast("Refreshed"); };
  const toggleTheme = async () => { try { setSettings(await api.put("/settings", { theme: settings?.theme === "dark" ? "light" : "dark" })); } catch (e) { toast(e.message, "err"); } };
  const Page = PAGES[page];

  return (
    <Ctx.Provider value={{ status, settings, loadSettings, setSettings, toast, confirm, go, reloadStatus }}>
      <Sidebar {...{ page, go, collapsed, setCollapsed, mobileOpen, setMobileOpen }} />
      <Topbar {...{ page, setMobileOpen, go, refresh, toggleTheme, collapsed }} />
      <main className={`p-4 md:p-6 transition-all ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}><Page /></main>
      <div className="fixed bottom-4 right-4 z-50 space-y-2 noprint">
        {toasts.map((t) => <div key={t.id} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type === "err" ? "bg-red-600" : "bg-teal-600"}`}>{t.type === "err" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}{t.msg}</div>)}
      </div>
      {dlg && <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"><div className="card max-w-sm w-full"><p className="mb-4 text-sm">{dlg.msg}</p><div className="flex justify-end gap-2"><button className="btn2" onClick={() => { dlg.res(false); setDlg(null); }}>Cancel</button><button className="btn" onClick={() => { dlg.res(true); setDlg(null); }}>Confirm</button></div></div></div>}
    </Ctx.Provider>
  );
}
