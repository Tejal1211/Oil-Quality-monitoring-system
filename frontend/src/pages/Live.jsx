import { Palette } from "lucide-react";
import TempPanel from "../components/TempPanel";
import { Badge, Page } from "../components/ui";

export default function Live() {
  return (
    <Page title="Live Monitoring">
      <TempPanel big />
      <div className="card opacity-80">
        <div className="flex items-center gap-2 mb-2"><Palette size={18} /><h3 className="font-semibold">Colour Monitoring</h3><Badge>Coming Soon</Badge></div>
        <p className="text-sm text-slate-500 mb-3">Colour sensor not installed. This feature will be available after hardware integration.</p>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-500">
          {["Raw R / G / B readings", "Clear channel + RGB trend charts", "Fresh vs used oil comparison, labels & calibration"].map((x) => <div key={x} className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">{x}<div className="mt-1 font-semibold">Disabled</div></div>)}
        </div>
        <p className="text-xs text-slate-400 mt-3">Requires: TCS34725 on I²C (A4/A5), firmware sending <code>RGB,r,g,b,c</code>, and a backend table for colour readings.</p>
      </div>
      <p className="text-xs text-slate-500">Temperature alone cannot determine oil purity, contamination, acidity, viscosity or remaining useful life.</p>
    </Page>
  );
}
