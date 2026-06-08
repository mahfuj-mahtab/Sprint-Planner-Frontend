import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Building2, LayoutDashboard } from "lucide-react";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";

export function ClientPortalSidebar() {
  const location = useLocation();
  const [portals, setPortals] = useState([]);

  useEffect(() => {
    api
      .get("/api/v1/portal/orgs")
      .then((r) => setPortals(r.data.portals || []))
      .catch(() => {});
  }, []);

  const activeOrgId = location.pathname.match(/^\/portal\/org\/([^/]+)/)?.[1];

  return (
    <div className="p-4 space-y-4 h-full">
      <div className="px-2">
        <p className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-semibold">Client portal</p>
        <p className="text-xs text-muted-foreground mt-1">Read-only view of your projects & payments</p>
      </div>

      <Link
        to="/portal"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition no-underline",
          location.pathname === "/portal"
            ? "bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]"
            : "border-transparent hover:bg-muted/80 text-foreground"
        )}
      >
        <LayoutDashboard className="w-4 h-4" />
        My portals
      </Link>

      <div className="space-y-1">
        <p className="px-2 text-[10px] uppercase tracking-wide text-muted-foreground">Organizations</p>
        {portals.map((p) => (
          <Link
            key={p.org_id}
            to={`/portal/org/${p.org_id}`}
            className={cn(
              "flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm border transition no-underline",
              activeOrgId === p.org_id
                ? "bg-primary/15 border-primary/40"
                : "border-transparent hover:bg-muted/80"
            )}
          >
            <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium truncate">{p.org_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {p.client_account?.name || "Client account"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
