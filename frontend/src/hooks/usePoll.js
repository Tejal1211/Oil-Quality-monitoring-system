import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
export function usePoll(path, ms = 5000) {
  const [s, setS] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    try { setS({ data: await api.get(path), error: null, loading: false }); }
    catch (e) { setS((p) => ({ ...p, error: e.message, loading: false })); }
  }, [path]);
  useEffect(() => {
    setS((p) => ({ ...p, loading: true })); load();
    const t = setInterval(load, ms); return () => clearInterval(t);
  }, [load, ms]);
  return { ...s, reload: load };
}
