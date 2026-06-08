import { useCallback, useEffect, useState } from "react";
import api from "@/ApiInception";

export function useClientPortals(enabled = true) {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!enabled) {
      setPortals([]);
      setLoading(false);
      return Promise.resolve([]);
    }
    setLoading(true);
    return api
      .get("/api/v1/portal/orgs")
      .then((r) => {
        const list = r.data.portals || [];
        setPortals(list);
        return list;
      })
      .catch(() => {
        setPortals([]);
        return [];
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { portals, loading, reload: load, hasPortal: portals.length > 0 };
}
