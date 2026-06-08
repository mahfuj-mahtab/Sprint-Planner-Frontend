import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  FolderKanban,
  Users,
} from "lucide-react";
import api from "@/ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { StatCard } from "@/components/org/StatCard";
import { Skeleton } from "@/components/ui/Loading";
import { formatDate, formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full bg-[#00d4ff] rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ClientPortalOrg() {
  const { orgId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/portal/org/${orgId}/overview`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <DashboardLayout sidebar={<ClientPortalSidebar />}>
        <div className="ww-page-full py-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout sidebar={<ClientPortalSidebar />}>
        <div className="ww-page-full py-12 text-center text-muted-foreground">
          Unable to load portal. You may not have access.
        </div>
      </DashboardLayout>
    );
  }

  const { org, account_client, linked_clients, summary, projects, all_payments } = data;
  const currency = account_client?.currency || "BDT";

  return (
    <DashboardLayout sidebar={<ClientPortalSidebar />}>
      <div className="border-b border-border bg-background/90 sticky top-0 z-20">
        <div className="ww-page-full py-4 flex items-center gap-3">
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground no-underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Portals
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#00d4ff]">Client portal</p>
            <h1 className="text-xl font-semibold ww-heading">{org.name}</h1>
          </div>
        </div>
      </div>

      <div className="ww-page-full py-8 space-y-8 pb-16">
        <div className="ww-card p-5 border-[#00d4ff]/20">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#00d4ff] shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold">{account_client.name}</h2>
              {account_client.company ? (
                <p className="text-sm text-muted-foreground">{account_client.company}</p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-2">
                This portal shows all work linked to your account
                {linked_clients?.length
                  ? `, including ${linked_clients.length} sub-client(s) under your billing account.`
                  : "."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total paid" value={formatMoney(summary.totalPaid, currency)} variant="income" />
          <StatCard label="Payments" value={summary.paymentCount} sub="All time" variant="balance" />
          <StatCard label="Projects" value={summary.projectCount} variant="neutral" />
          <StatCard
            label="Outstanding"
            value={formatMoney(summary.outstanding, currency)}
            sub="Budget vs paid"
            variant="neutral"
          />
        </div>

        {linked_clients?.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Work streams under your account
            </h2>
            <div className="flex flex-wrap gap-2">
              {linked_clients.map((c) => (
                <span
                  key={c._id}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/30"
                >
                  {c.name}
                  {c.company ? ` · ${c.company}` : ""}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            Projects ({projects.length})
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects linked yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <Link
                  key={p._id}
                  to={`/portal/org/${orgId}/project/${p._id}`}
                  className="ww-card p-4 hover:border-primary/40 transition no-underline text-inherit"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.client_id?.name && p.client_id._id !== account_client._id ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Via: {p.client_id.name}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded border border-primary/30 text-primary shrink-0">
                      {p.status_label || p.status}
                    </span>
                  </div>
                  {p.description ? (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                  ) : null}
                  <div className="flex gap-3 mt-3 text-[11px] text-muted-foreground">
                    {p.start_date ? <span>Start {formatDate(p.start_date)}</span> : null}
                    {p.end_date ? <span>End {formatDate(p.end_date)}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment history
          </h2>
          {all_payments?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="ww-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Project</th>
                    <th className="p-3 font-medium hidden md:table-cell">Client tag</th>
                    <th className="p-3 font-medium hidden lg:table-cell">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {all_payments.map((pay) => (
                    <tr key={pay._id} className="border-b border-border/60 last:border-0">
                      <td className="p-3 whitespace-nowrap">{formatDate(pay.payment_date)}</td>
                      <td className="p-3 font-mono font-medium text-[#00ff94]">
                        {formatMoney(pay.amount, currency)}
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">
                        {pay.project?.name || "—"}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {pay.client?.name || "—"}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground capitalize">
                        {pay.payment_method || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
