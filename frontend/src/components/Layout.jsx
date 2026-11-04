import { useState } from "react";
import { Activity, Bell, ChevronLeft, Cpu, Droplets, FileText, FlaskConical, LayoutDashboard, LineChart, Menu, Moon, RefreshCw, Settings, Sun, User } from "lucide-react";
import { StatusPill, useApp } from "./ui";
import { fmtTime } from "../services/api";

export const NAV = [["dashboard", "Dashboard", LayoutDashboard], ["live", "Live Monitoring", Activity], ["history", "Temperature History", LineChart], ["samples", "Oil Samples", FlaskConical], ["alerts", "Alerts & Notifications", Bell], ["reports", "Reports", FileText], ["devices", "Device Management", Cpu], ["settings", "Settings", Settings]];

export function Sidebar({ page, go, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { status } = useApp();
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden noprint" onClick={() => setMobileOpen(false)} />}
      <aside className={`noprint fixed top-0 left-0 h-full z-40 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-200 ${collapsed ? "lg:w-16" : "lg:w-64"} w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-200 dark:border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white grid place-items-center shrink-0"><Droplets size={20} /></div>
          {!collapsed && <div className="leading-tight"><div className="font-bold">OilSense AI</div><div className="text-[10px] text-slate-500">Smart Oil Monitoring</div></div>}
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.map(([k, l, I]) => (
            <button key={k} title={l} onClick={() => { go(k); setMobileOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${page === k ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
              <I size={18} className="shrink-0" />{!collapsed && l}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
          {!collapsed && <StatusPill mode={status?.mode || "disconnected"} />}
          <button className="btn2 w-full hidden lg:flex" onClick={() => setCollapsed(!collapsed)}><ChevronLeft size={16} className={collapsed ? "rotate-180" : ""} />{!collapsed && "Collapse"}</button>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ page, setMobileOpen, go, refresh, toggleTheme, collapsed }) {
  const { status, settings } = useApp(); const [menu, setMenu] = useState(false);
  const title = NAV.find((n) => n[0] === page)?.[1];
  return (
    <header className={`noprint sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 px-4 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
      <button className="lg:hidden btn2 !px-2" onClick={() => setMobileOpen(true)}><Menu size={18} /></button>
      <div className="min-w-0"><div className="text-[11px] text-slate-500 truncate">OilSense AI / {title}</div><div className="font-semibold truncate">{title}</div></div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:block text-right text-[11px] text-slate-500">Last data<div className="text-xs font-medium text-navy dark:text-slate-200">{fmtTime(status?.last_ts)}</div></div>
        <StatusPill mode={status?.mode || "disconnected"} />
        <button className="btn2 !px-2" title="Refresh" onClick={refresh}><RefreshCw size={16} /></button>
        <button className="btn2 !px-2" title="Toggle theme" onClick={toggleTheme}>{settings?.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button className="btn2 !px-2 relative" title="Alerts" onClick={() => go("alerts")}><Bell size={16} />{status?.open_alerts > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 grid place-items-center">{status.open_alerts}</span>}</button>
        <div className="relative">
          <button className="btn2 !px-2" onClick={() => setMenu(!menu)}><User size={16} /></button>
          {menu && <div className="absolute right-0 mt-2 w-52 card !p-2 text-sm" onMouseLeave={() => setMenu(false)}>
            <div className="px-2 py-1 font-semibold">Student Demo User</div><div className="px-2 pb-2 text-xs text-slate-500">Administrator</div>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { go("settings"); setMenu(false); }}>Settings</button>
            <button className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { go("devices"); setMenu(false); }}>Device status</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
