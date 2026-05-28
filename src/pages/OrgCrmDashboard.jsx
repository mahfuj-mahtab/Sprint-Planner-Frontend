import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock,
  Flame,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CrmSubnav } from "@/components/org/CrmSubnav";
import { StatCard } from "@/components/org/StatCard";
import { EmptyState } from "@/components/org/EmptyState";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";
import { logTypeLabel } from "@/lib/crmClient";
import {
  TaskStatusPie,
  CategoryBarChart,
  PriorityPieChart,
} from "@/components/charts/DashboardCharts";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const PAGE_SHELL =
  "ww-page-full max-w-none w-full min-h-[calc(100dvh-8.5rem)] pb-16 space-y-6 sm:space-y-8 bg-gradient-to-b from-[#00d4ff]/[0.05] via-background to-background";

function ChartPanel({ title, subtitle, children, className }) {
  return (
    <div className={cn("ww-card-sm border-border/80 p-5 sm:p-6", className)}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function RevenueTrendChart({ data, formatValue }) {
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No client payments in the last 6 months.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={formatValue} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => [formatValue ? formatValue(v) : v, "Revenue"]}
        />
        <Bar dataKey="amount" fill="#00d4ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function OrgCrmDashboard() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/clients/dashboard`)
      .then((r) => setData(r.data.dashboard))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (data?.access?.role === "viewer") {
      navigate(`/user/profile/org/${orgId}`);
    }
  }, [data, navigate, orgId]);

  const primary = data?.primaryCurrency || "BDT";
  const canSee = data?.access?.canSeeExactAmounts ?? true;
  const fmt = (v, cur = primary) => formatMoneySensitive(v, cur, canSee);

  const clientRevenueAllTime =
    data?.clientRevenueAllTimeByCurrency?.[primary] ??
    data?.revenueByCurrency?.[primary] ??
    data?.incomeStats?.clientAllTime ??
    0;
  const allIncomeAllTime =
    data?.allIncomeAllTimeByCurrency?.[primary] ??
    data?.incomeStats?.allAllTime ??
    clientRevenueAllTime;
  const revenueMonth = data?.revenueThisMonthByCurrency?.[primary] ?? 0;
  const clientRevenueMonth = data?.clientRevenueThisMonthByCurrency?.[primary] ?? 0;
  const pipelineTotal = data?.pipelineByCurrency?.[primary] ?? 0;
  const unlinkedIncome = data?.incomeStats?.unlinkedAllTime ?? 0;

  const currencyBuckets = useMemo(() => {
    if (!data?.revenueByCurrency) return [];
    return Object.keys(data.revenueByCurrency).sort();
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout>
        <CrmSubnav orgId={orgId} active="dashboard" />
        <div className={PAGE_SHELL}>
          <Skeleton className="h-40 sm:h-48 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid xl:grid-cols-12 gap-4">
            <Skeleton className="h-80 rounded-xl xl:col-span-8" />
            <Skeleton className="h-80 rounded-xl xl:col-span-4" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <CrmSubnav orgId={orgId} active="dashboard" />
        <div className={cn(PAGE_SHELL, "flex items-center justify-center")}>
          <p className="text-muted-foreground">Could not load CRM dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { summary } = data;

  return (
    <DashboardLayout>
      <CrmSubnav
        orgId={orgId}
        active="dashboard"
        actions={
          <Link
            to={`/user/profile/org/${orgId}/clients`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New client
          </Link>
        }
      />

      <div className={PAGE_SHELL}>
        <section className="relative rounded-2xl border border-[#00d4ff]/25 overflow-hidden bg-gradient-to-br from-[#0d1520] via-card to-[#0a1219] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(0,212,255,0.16),transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(0,255,148,0.08),transparent)] pointer-events-none" />
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 xl:gap-10">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#00d4ff] font-mono mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Pipeline health
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold ww-heading tracking-tight">
                {summary.totalClients} client{summary.totalClients !== 1 ? "s" : ""}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
                Track leads, log touchpoints, and see who needs attention — built for solo founders and
                small studios.
              </p>
              {summary.followUpsDue > 0 ? (
                <p className="text-sm text-amber-300 mt-3 inline-flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {summary.followUpsDue} follow-up{summary.followUpsDue !== 1 ? "s" : ""} due today or earlier
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap xl:flex-col gap-3 shrink-0">
              {summary.followUpsDue > 0 ? (
                <Link
                  to={`/user/profile/org/${orgId}/clients?filter=follow_up`}
                  className="text-sm px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 inline-flex items-center justify-center gap-2 min-w-[10rem]"
                >
                  <AlertCircle className="w-4 h-4" />
                  Work follow-ups
                </Link>
              ) : null}
              <Link
                to={`/user/profile/org/${orgId}/clients`}
                className="text-sm px-4 py-2.5 rounded-xl border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 inline-flex items-center justify-center gap-2 min-w-[10rem]"
              >
                <Users className="w-4 h-4" />
                All clients
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4">
          <StatCard label="Total clients" value={String(summary.totalClients)} variant="balance" />
          <StatCard label="Leads" value={String(summary.leads)} variant="neutral" sub="Top of funnel" />
          <StatCard
            label="Active"
            value={String(summary.activeClients)}
            variant="income"
            sub="Active + negotiation"
          />
          <StatCard
            label="All income"
            value={fmt(allIncomeAllTime)}
            variant="income"
            sub={`Recorded in Finance · ${primary}`}
          />
          <StatCard
            label="Client revenue"
            value={fmt(clientRevenueAllTime)}
            variant="income"
            sub="Payments linked to a client"
          />
          <StatCard
            label="This month"
            value={fmt(revenueMonth)}
            variant="income"
            sub={
              clientRevenueMonth < revenueMonth
                ? `All income · client ${fmt(clientRevenueMonth, primary)}`
                : "All income in Finance"
            }
          />
          <StatCard
            label="Pipeline"
            value={fmt(pipelineTotal)}
            variant="balance"
            sub="Expected value"
          />
        </div>

        {unlinkedIncome > 0 ? (
          <p className="text-xs text-amber-200/90 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            {fmt(unlinkedIncome)} of all-time income is not linked to a client. Link the client on each
            income entry in Finance so it counts toward client revenue.
          </p>
        ) : null}

        {currencyBuckets.length > 1 ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {currencyBuckets.map((cur) => (
              <span
                key={cur}
                className="px-2.5 py-1 rounded-full border border-border bg-muted/30 font-mono"
              >
                {cur}: {fmt(data.allIncomeAllTimeByCurrency?.[cur] || 0, cur)} all ·{" "}
                {fmt(data.clientRevenueAllTimeByCurrency?.[cur] || data.revenueByCurrency?.[cur] || 0, cur)} client ·{" "}
                {fmt(data.pipelineByCurrency[cur] || 0, cur)} pipe
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid xl:grid-cols-12 gap-4">
          <ChartPanel
            title="Income trend"
            subtitle={`All Finance income · last 6 months · ${primary}`}
            className="xl:col-span-8 min-h-[360px] flex flex-col"
          >
            <div className="flex-1 min-h-[300px]">
              <RevenueTrendChart data={data.revenueTrend} formatValue={(v) => fmt(v)} />
            </div>
          </ChartPanel>

          <ChartPanel
            title="Pipeline by status"
            subtitle="Where clients sit today"
            className="xl:col-span-4 min-h-[360px]"
          >
            <TaskStatusPie data={data.statusChart} />
          </ChartPanel>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ChartPanel title="Client type" subtitle="Prospect vs retainer mix">
            <CategoryBarChart
              data={data.typeChart.map((t) => ({ name: t.name, amount: t.value }))}
              color="#00d4ff"
            />
          </ChartPanel>
          <ChartPanel title="Priority mix" subtitle="Who needs extra focus">
            <PriorityPieChart data={data.priorityChart} />
          </ChartPanel>

          <div className="ww-card-sm border-border/80 p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00d4ff]" />
              Quick signals
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">New this month</span>
                <span className="font-mono font-semibold text-primary">{summary.newClientsThisMonth}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">High priority active</span>
                <span className="font-mono font-semibold">{summary.highPriorityActive}</span>
              </li>
              <li className="flex justify-between gap-2 border-b border-border/60 pb-2">
                <span className="text-muted-foreground">On hold</span>
                <span className="font-mono">{summary.onHold}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-muted-foreground">Past clients</span>
                <span className="font-mono">{summary.pastClients}</span>
              </li>
            </ul>
            {summary.highPriorityActive > 0 ? (
              <Link
                to={`/user/profile/org/${orgId}/clients`}
                className="text-xs text-[#00d4ff] hover:underline inline-flex items-center gap-1"
              >
                <Flame className="w-3 h-3" /> Review high-priority clients
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="ww-card-sm border-border/80 p-5 min-h-[320px]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Top clients
                </h3>
                <p className="text-xs text-muted-foreground">By recorded payments</p>
              </div>
              <Link
                to={`/user/profile/org/${orgId}/clients`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Record payments in Finance to rank clients here.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.topClients.map((c, i) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/profile/org/${orgId}/clients?id=${c._id}`)}
                      className="w-full flex items-center gap-3 rounded-lg border border-border/80 p-2.5 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 transition text-left"
                    >
                      <span className="font-mono text-xs text-muted-foreground w-5">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.projectCount} project{c.projectCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm text-primary">
                          {fmt(c.totalPaid, c.currency)}
                        </div>
                        {c.expectedValue > c.totalPaid ? (
                          <div className="text-[10px] text-muted-foreground">
                            {fmt(c.expectedValue, c.currency)} expected
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ww-card-sm border-border/80 p-5 min-h-[320px]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-200">
                  <AlertCircle className="w-4 h-4" />
                  Follow-ups due
                </h3>
                <p className="text-xs text-muted-foreground">Today or overdue</p>
              </div>
              <Link
                to={`/user/profile/org/${orgId}/clients?filter=follow_up`}
                className="text-xs text-amber-400/90 hover:underline"
              >
                Open queue
              </Link>
            </div>
            {data.followUpQueue.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="All caught up"
                description="No follow-ups due right now. Set dates on active clients to stay on top of outreach."
                className="py-8 border-0 bg-transparent"
              />
            ) : (
              <ul className="space-y-2">
                {data.followUpQueue.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/profile/org/${orgId}/clients?id=${c._id}`)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 hover:bg-amber-500/10 transition text-left text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium truncate block">{c.name}</span>
                        {c.company ? (
                          <span className="text-xs text-muted-foreground truncate block">{c.company}</span>
                        ) : null}
                      </div>
                      <span className="text-xs font-mono text-amber-200 shrink-0">
                        {formatDate(c.next_follow_up)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="ww-card-sm border-border/80 p-5 min-h-[280px]">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#00d4ff]" />
              Coming up (7 days)
            </h3>
            {data.upcomingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled this week.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.upcomingFollowUps.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/profile/org/${orgId}/clients?id=${c._id}`)}
                      className="w-full flex justify-between gap-2 hover:text-[#00d4ff] transition text-left"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {formatDate(c.next_follow_up)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ww-card-sm border-border/80 p-5 min-h-[280px]">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Needs outreach
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">No contact in 30+ days</p>
            {data.staleContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everyone has been touched recently.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.staleContacts.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/profile/org/${orgId}/clients?id=${c._id}`)}
                      className="w-full flex justify-between gap-2 hover:text-foreground transition text-left"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs text-amber-400/90 shrink-0">
                        {c.daysSince != null ? `${c.daysSince}d` : "Never"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ww-card-sm border-border/80 p-5 min-h-[280px] md:col-span-2 xl:col-span-1">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              Recent activity
            </h3>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Log calls and notes on client profiles.</p>
            ) : (
              <ul className="space-y-3 max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
                {data.recentActivity.map((a, i) => (
                  <li key={`${a.clientId}-${i}`} className="text-sm border-l-2 border-primary/30 pl-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/user/profile/org/${orgId}/clients?id=${a.clientId}`)}
                      className="font-medium hover:text-primary text-left truncate block w-full"
                    >
                      {a.clientName}
                    </button>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                      {logTypeLabel(a.type)} · {formatDate(a.loggedAt)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {summary.totalClients === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Start your client pipeline"
            description="Add your first lead or client, set expected value and follow-up dates, then record payments from Finance."
            action={
              <Link to={`/user/profile/org/${orgId}/clients`} className="ww-btn-primary text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add first client
              </Link>
            }
            className="py-12"
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default OrgCrmDashboard;
