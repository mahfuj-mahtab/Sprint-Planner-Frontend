import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ExternalLink } from "lucide-react";
import api from "@/ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { Skeleton } from "@/components/ui/Loading";

export default function ClientPortalHome() {
  const navigate = useNavigate();
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/v1/portal/orgs")
      .then((r) => {
        const list = r.data.portals || [];
        setPortals(list);
        if (list.length === 1) {
          navigate(`/portal/org/${list[0].org_id}`, { replace: true });
        }
      })
      .catch(() => setPortals([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <DashboardLayout sidebar={<ClientPortalSidebar />}>
      <div className="ww-page-full py-8 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#00d4ff] mb-1">Client portal</p>
          <h1 className="text-2xl font-semibold ww-heading">Your workspaces</h1>
          <p className="text-sm text-muted-foreground mt-2">
            See projects, delivery progress, and payments — read-only.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : portals.length === 0 ? (
          <div className="ww-card border-dashed p-12 text-center text-sm text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No client portal access yet.</p>
            <p className="mt-2">Your vendor will invite you by email after you register.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {portals.map((p) => (
              <Link
                key={p.org_id}
                to={`/portal/org/${p.org_id}`}
                className="ww-card p-5 hover:border-[#00d4ff]/40 transition no-underline text-inherit group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold group-hover:text-[#00d4ff]">{p.org_name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Account: {p.client_account?.name}
                      {p.client_account?.company ? ` · ${p.client_account.company}` : ""}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#00d4ff]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
