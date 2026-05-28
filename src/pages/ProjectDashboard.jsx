import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  FolderKanban,
  Layers,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/org/StatCard";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoneySensitive } from "@/lib/formatMoney";
import { useOrgAccess } from "@/hooks/useOrgAccess";
import { convertDate } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/MemberAvatar";
import {
  MemberGroupedBarChart,
  PriorityPieChart,
  TaskStatusPie,
  TeamStackedTaskChart,
} from "@/components/charts/DashboardCharts";
import SHowStatus from "@/components/SHowStatus";
import PriorityShow from "@/components/PriorityShow";

const TEAM_ACCENTS = [
  { bar: "from-[#00d4ff] to-[#00ff94]", border: "border-[#00d4ff]/35", chip: "bg-[#00d4ff]/15 text-[#00d4ff]" },
  { bar: "from-[#a78bfa] to-[#00d4ff]", border: "border-[#a78bfa]/35", chip: "bg-[#a78bfa]/15 text-[#c4b5fd]" },
  { bar: "from-[#00ff94] to-[#fbbf24]", border: "border-[#00ff94]/35", chip: "bg-[#00ff94]/15 text-[#00ff94]" },
];

function Panel({ title, subtitle, children, className }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
      {(title || subtitle) && (
        <header className="px-5 py-4 border-b border-border/70 bg-gradient-to-r from-muted/30 to-transparent">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function MemberTable({ members, showTeam }) {
  if (!members?.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No member data</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <th className="text-left py-3 px-3 font-medium">Member</th>
            {showTeam && <th className="text-left py-3 px-2 font-medium">Team</th>}
            <th className="text-center py-3 px-2">Assigned</th>
            <th className="text-center py-3 px-2 text-[#00ff94]">Done</th>
            <th className="text-center py-3 px-2 text-[#00d4ff]">WIP</th>
            <th className="text-center py-3 px-2">Pending</th>
            <th className="text-center py-3 px-2">Rate</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={`${m.userId || m.name}-${m.teamName || ""}`} className="border-b border-border/40 hover:bg-muted/15">
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <MemberAvatar name={m.name} size="sm" accent="cyan" />
                  <span className="font-medium truncate max-w-[160px]">{m.name}</span>
                </div>
              </td>
              {showTeam && <td className="py-2.5 px-2 text-xs text-muted-foreground">{m.teamName || "—"}</td>}
              <td className="py-2.5 text-center font-mono font-semibold">{m.total}</td>
              <td className="py-2.5 text-center font-mono text-[#00ff94]">{m.completed}</td>
              <td className="py-2.5 text-center font-mono text-[#00d4ff]">{m.wip}</td>
              <td className="py-2.5 text-center font-mono text-muted-foreground">{m.pending}</td>
              <td className="py-2.5 text-center">
                <span
                  className={cn(
                    "text-xs font-mono font-bold px-2 py-0.5 rounded",
                    m.completionPct >= 70 ? "bg-[#00ff94]/15 text-[#00ff94]" : "bg-muted text-muted-foreground"
                  )}
                >
                  {m.completionPct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectDashboard() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { access } = useOrgAccess(orgId);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/dashboard`)
      .then((r) => setData(r.data.dashboard))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId, projectId]);

  const canSee = access?.canSeeExactAmounts ?? data?.access?.canSeeExactAmounts ?? true;
  const fmt = (v) => formatMoneySensitive(v, "BDT", canSee);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="ww-page-full max-w-none space-y-4">
          <Skeleton className="h-12 w-80" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="ww-page-full max-w-none">
          <p className="text-muted-foreground">Could not load project dashboard.</p>
          <button
            type="button"
            onClick={() => navigate(`/user/profile/org/${orgId}?view=details&projectId=${projectId}`)}
            className="mt-4 text-sm text-primary"
          >
            Back to project
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { project, finance, counts, tasks, features, sprints, teams, members, currentVersion, atRiskTasks } = data;

  const taskPie = [
    { name: "Completed", value: tasks.completed, color: "#00ff94" },
    { name: "In progress", value: tasks.wip, color: "#00d4ff" },
    { name: "Pending", value: tasks.pending, color: "#94a3b8" },
    { name: "Hold", value: tasks.hold, color: "#a78bfa" },
    { name: "Cancelled", value: tasks.cancelled, color: "#f87171" },
  ];

  const priorityPie = [
    { name: "High", value: tasks.priority?.High || 0 },
    { name: "Medium", value: tasks.priority?.Medium || 0 },
    { name: "Low", value: tasks.priority?.Low || 0 },
  ];

  const teamStackData = (teams || []).map((t) => ({
    name: t.team.name.length > 14 ? `${t.team.name.slice(0, 14)}…` : t.team.name,
    completed: t.completed,
    wip: t.wip,
    pending: t.pending,
    hold: t.hold,
    cancelled: t.cancelled,
  }));

  const memberChartData = (members || [])
    .filter((m) => m.total > 0)
    .slice(0, 12)
    .map((m) => ({
      name: m.name.length > 16 ? `${m.name.slice(0, 16)}…` : m.name,
      completed: m.completed,
      wip: m.wip,
      pending: m.pending,
    }));

  return (
    <DashboardLayout>
      <div className="border-b border-[#00d4ff]/20 bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="ww-page-full max-w-none py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/user/profile/org/${orgId}?view=details&projectId=${projectId}&tab=sprints`)}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Project
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#00d4ff] font-mono">Project dashboard</p>
              <h1 className="text-lg sm:text-xl font-bold ww-heading truncate">{project.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/user/profile/org/${orgId}?view=details&projectId=${projectId}&tab=sprints`}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Sprints
            </Link>
            <Link
              to={`/user/profile/org/${orgId}?view=details&projectId=${projectId}&tab=features`}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Features
            </Link>
            <Link
              to={`/user/profile/org/${orgId}/dashboard`}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Org dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="ww-page-full max-w-none w-full min-h-[calc(100vh-7rem)] pb-16 space-y-8 bg-gradient-to-b from-[#a78bfa]/[0.04] via-background to-background">
        {/* Hero */}
        <section className="relative rounded-2xl border border-[#a78bfa]/25 overflow-hidden bg-gradient-to-br from-[#0d1520] via-card to-[#0a1219] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(167,139,250,0.14),transparent),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(0,255,148,0.08),transparent)] pointer-events-none" />
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col xl:flex-row xl:items-center gap-8">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border capitalize">{project.status}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border capitalize">{project.project_type?.replace("_", " ")}</span>
                {currentVersion && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary">
                    {currentVersion.name} · {currentVersion.status}
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold ww-heading">{project.name}</h2>
              {project.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{project.description}</p>}
              {project.client && (
                <p className="text-sm mt-2 text-[#00d4ff]">
                  Client: <span className="font-medium">{project.client.name}</span>
                  {project.client.company ? ` · ${project.client.company}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-8">
              <div className="flex flex-col items-center">
                <div
                  className="relative w-28 h-28 rounded-full"
                  style={{ background: `conic-gradient(#00ff94 ${tasks.completionPct * 3.6}deg, #1a2332 0deg)` }}
                >
                  <div className="absolute inset-[6px] rounded-full bg-[#0d1117] flex flex-col items-center justify-center border border-border/50">
                    <span className="text-2xl font-bold font-mono text-[#00ff94]">{tasks.completionPct}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase">tasks</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2 font-mono">
                  {tasks.completed}/{tasks.total} completed
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="relative w-28 h-28 rounded-full"
                  style={{
                    background: `conic-gradient(${finance.profit >= 0 ? "#00ff94" : "#f87171"} ${Math.min(100, Math.abs(finance.profit) > 0 ? 72 : 0) * 3.6}deg, #1a2332 0deg)`,
                  }}
                >
                  <div className="absolute inset-[6px] rounded-full bg-[#0d1117] flex flex-col items-center justify-center border border-border/50 px-1">
                    <span className={cn("text-lg font-bold font-mono", finance.profit >= 0 ? "text-[#00ff94]" : "text-destructive")}>
                      {fmt(finance.profit)}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">profit</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2 font-mono">All-time on project</span>
              </div>
            </div>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-[#a78bfa]/15 bg-black/20">
            {[
              { label: "Sprints", value: counts.sprints, sub: `${counts.activeSprints} active`, icon: Zap, color: "text-[#fbbf24]" },
              { label: "Teams", value: counts.teams, sub: `${counts.members} members`, icon: Users, color: "text-[#00d4ff]" },
              { label: "Features", value: counts.features, sub: `${features.completed} done`, icon: Layers, color: "text-[#a78bfa]" },
              { label: "Versions", value: counts.versions, sub: currentVersion?.name || "—", icon: FolderKanban, color: "text-foreground" },
              { label: "Revenue", value: fmt(finance.revenue), sub: `Month ${fmt(finance.monthIncome)}`, icon: TrendingUp, color: "text-[#00ff94]" },
              { label: "Cost", value: fmt(finance.cost), sub: `Month ${fmt(finance.monthExpense)}`, icon: TrendingDown, color: "text-destructive" },
            ].map((row) => (
              <div key={row.label} className="px-5 py-4 border-r border-border/30 last:border-r-0">
                <div className="flex items-center gap-2 mb-1">
                  <row.icon className={cn("w-4 h-4", row.color)} />
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wide">{row.label}</span>
                </div>
                <div className="font-mono text-lg font-bold text-foreground truncate">{row.value}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Total tasks" value={tasks.total} variant="balance" />
          <StatCard label="In progress" value={tasks.wip} variant="balance" />
          <StatCard label="Pending" value={tasks.pending} variant="neutral" />
          <StatCard label="Unassigned" value={tasks.unassigned} variant="neutral" sub="No assignee" />
          <StatCard label="Overdue" value={tasks.overdue} variant="expense" />
          <StatCard label="Due soon" value={tasks.dueSoon} variant="expense" sub="Next 3 days" />
        </div>

        {/* Charts */}
        <div className="grid xl:grid-cols-3 gap-5">
          <Panel title="Task status" subtitle="All project tasks">
            {tasks.total > 0 ? <TaskStatusPie data={taskPie} /> : <p className="text-sm text-muted-foreground py-12 text-center">No tasks</p>}
          </Panel>
          <Panel title="Priority mix" subtitle="Workload distribution">
            {tasks.total > 0 ? <PriorityPieChart data={priorityPie} /> : <p className="text-sm text-muted-foreground py-12 text-center">No tasks</p>}
          </Panel>
          <Panel title="Teams overview" subtitle="Tasks per team">
            {teamStackData.length > 0 ? (
              <TeamStackedTaskChart data={teamStackData} />
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No teams</p>
            )}
          </Panel>
        </div>

        {/* Team + member performance */}
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-[#00ff94]" />
          <div>
            <h2 className="text-xl font-bold ww-heading">Team & member workload</h2>
            <p className="text-sm text-muted-foreground">Who is assigned how many tasks on this project</p>
          </div>
        </div>

        <Panel
          title="All members — project totals"
          subtitle="Combined workload across every team"
          className="border-[#00ff94]/20 shadow-[0_0_48px_rgba(0,255,148,0.05)]"
        >
          <div className="grid xl:grid-cols-2 gap-8">
            <MemberTable members={members} />
            <div>
              <p className="text-xs text-muted-foreground mb-3">Top assignees (stacked by status)</p>
              {memberChartData.length > 0 ? (
                <MemberGroupedBarChart data={memberChartData} />
              ) : (
                <p className="text-sm text-muted-foreground py-12 text-center">Assign tasks to see chart</p>
              )}
            </div>
          </div>
        </Panel>

        {(teams || []).map((teamRow, teamIndex) => {
          const accent = TEAM_ACCENTS[teamIndex % TEAM_ACCENTS.length];
          const chartData = (teamRow.members || [])
            .filter((m) => m.total > 0)
            .map((m) => ({
              name: m.name.length > 14 ? `${m.name.slice(0, 14)}…` : m.name,
              completed: m.completed,
              wip: m.wip,
              pending: m.pending,
            }));

          return (
            <section
              key={teamRow.team._id}
              className={cn("rounded-2xl border overflow-hidden bg-card/90", accent.border)}
            >
              <div className={cn("h-1.5 w-full bg-gradient-to-r", accent.bar)} />
              <div className="p-5 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{teamRow.team.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {teamRow.memberCount} members · {teamRow.total} tasks · {teamRow.completionPct}% complete
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { l: "Done", v: teamRow.completed, c: "text-[#00ff94]" },
                      { l: "WIP", v: teamRow.wip, c: "text-[#00d4ff]" },
                      { l: "Pending", v: teamRow.pending, c: "text-slate-400" },
                    ].map((b) => (
                      <div key={b.l} className="rounded-lg bg-muted/25 border border-border/60 px-3 py-2 text-center min-w-[64px]">
                        <div className={cn("font-mono font-bold", b.c)}>{b.v}</div>
                        <div className="text-[10px] text-muted-foreground">{b.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid xl:grid-cols-5 gap-6">
                  <div className="xl:col-span-3 rounded-xl border border-border/60 overflow-hidden bg-[#0a0f14]/40">
                    <MemberTable members={teamRow.members} />
                  </div>
                  <div className="xl:col-span-2 rounded-xl border border-border/60 p-4 bg-[#0a0f14]/40">
                    {chartData.length > 0 ? (
                      <MemberGroupedBarChart data={chartData} />
                    ) : (
                      <p className="text-sm text-muted-foreground py-16 text-center">No assigned tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Sprints table */}
        <Panel title="Sprint performance" subtitle="Task progress per sprint — open sprint for details">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-3 font-medium">Sprint</th>
                  <th className="py-3 px-2 font-medium">Dates</th>
                  <th className="text-center py-3 px-2">Total</th>
                  <th className="text-center py-3 px-2 text-[#00ff94]">Done</th>
                  <th className="text-center py-3 px-2 text-[#00d4ff]">WIP</th>
                  <th className="text-center py-3 px-2">Pending</th>
                  <th className="text-center py-3 px-2">Progress</th>
                  <th className="text-right py-3 px-3" />
                </tr>
              </thead>
              <tbody>
                {(sprints || []).map((row) => (
                  <tr key={row.sprint._id} className="border-b border-border/50 hover:bg-[#00d4ff]/5">
                    <td className="py-3 px-3 font-medium">
                      {row.sprint.name}
                      {row.sprint.isActive && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground whitespace-nowrap">
                      {convertDate(row.sprint.startDate)} – {convertDate(row.sprint.endDate)}
                    </td>
                    <td className="py-3 text-center font-mono">{row.total}</td>
                    <td className="py-3 text-center font-mono text-[#00ff94]">{row.completed}</td>
                    <td className="py-3 text-center font-mono text-[#00d4ff]">{row.wip}</td>
                    <td className="py-3 text-center font-mono">{row.pending}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 max-w-[140px] mx-auto">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-[#00ff94]" style={{ width: `${row.completionPct}%` }} />
                        </div>
                        <span className="text-xs font-mono w-9">{row.completionPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/user/profile/org/${orgId}/project/${projectId}/sprint/${row.sprint._id}`}
                        className="text-xs font-semibold text-[#00d4ff] hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!sprints?.length && <p className="text-sm text-muted-foreground py-8 text-center">No sprints yet</p>}
          </div>
        </Panel>

        {/* Finance + features row */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Panel title="Project finance" subtitle="Revenue, cost, and monthly flow">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-[#00ff94]/10 border border-[#00ff94]/25 p-4">
                <div className="text-xs text-muted-foreground uppercase">Revenue</div>
                <div className="font-mono text-xl font-bold text-[#00ff94] mt-1">{fmt(finance.revenue)}</div>
              </div>
              <div className="rounded-xl bg-destructive/10 border border-destructive/25 p-4">
                <div className="text-xs text-muted-foreground uppercase">Cost</div>
                <div className="font-mono text-xl font-bold text-destructive mt-1">{fmt(finance.cost)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00d4ff]" />
                Month net:{" "}
                <span className={cn("font-mono font-semibold", finance.monthProfit >= 0 ? "text-[#00ff94]" : "text-destructive")}>
                  {fmt(finance.monthProfit)}
                </span>
              </span>
              <Link to={`/user/profile/org/${orgId}/finance`} className="text-[#00d4ff] hover:underline text-xs">
                Open finance →
              </Link>
            </div>
          </Panel>
          <Panel title="Features & delivery" subtitle="Modules, features, linked tasks">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Modules", value: features.modules },
                { label: "Features", value: features.total },
                { label: "Done", value: features.completed, color: "text-[#00ff94]" },
                { label: "In progress", value: features.inProgress, color: "text-[#00d4ff]" },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-muted/25 border border-border/60 p-3 text-center">
                  <div className={cn("font-mono text-2xl font-bold", f.color)}>{f.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase mt-1">{f.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {tasks.linkedToFeatures} tasks linked to features · {features.pending} features not started
            </p>
            <Link
              to={`/user/profile/org/${orgId}?view=details&projectId=${projectId}&tab=features`}
              className="inline-block mt-3 text-xs font-semibold text-[#a78bfa] hover:underline"
            >
              Feature analysis →
            </Link>
          </Panel>
        </div>

        {/* At risk */}
        {atRiskTasks?.length > 0 && (
          <section className="rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-card to-card p-5 sm:p-6">
            <h3 className="text-base font-semibold flex items-center gap-2 text-destructive mb-4">
              <AlertTriangle className="w-5 h-5" />
              At-risk tasks
            </h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {atRiskTasks.map((task) => (
                <li key={task._id} className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                  <p className="font-medium line-clamp-2">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{task.sprintName || "No sprint"}</p>
                  <p className="text-xs text-[#00d4ff] mt-0.5">{task.assignees?.join(", ") || "Unassigned"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <SHowStatus status={task.status} />
                    <PriorityShow status={task.priority} />
                    <span className={cn("text-[10px] font-mono ml-auto", task.isOverdue ? "text-destructive" : "text-amber-400")}>
                      {task.isOverdue ? "Overdue" : "Due soon"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ProjectDashboard;
