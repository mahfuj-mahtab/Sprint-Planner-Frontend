import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/org/StatCard";
import {
  MemberGroupedBarChart,
  MemberWorkloadBarChart,
  PriorityPieChart,
  TaskStatusPie,
  TeamStackedTaskChart,
} from "@/components/charts/DashboardCharts";
import { convertDate } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "./MemberAvatar";
import SHowStatus from "./SHowStatus";
import PriorityShow from "./PriorityShow";
import { KANBAN_COLUMNS, normalizeTaskStatus, isTaskDone, STATUS_META } from "@/lib/taskWorkflow";

const DISPLAY_STATUSES = [...KANBAN_COLUMNS, "Cancelled"];

const TEAM_ACCENTS = [
  { bar: "from-[#00d4ff] to-[#00ff94]", border: "border-[#00d4ff]/35", glow: "shadow-[0_0_40px_rgba(0,212,255,0.08)]", chip: "bg-[#00d4ff]/15 text-[#00d4ff]" },
  { bar: "from-[#a78bfa] to-[#00d4ff]", border: "border-[#a78bfa]/35", glow: "shadow-[0_0_40px_rgba(167,139,250,0.08)]", chip: "bg-[#a78bfa]/15 text-[#c4b5fd]" },
  { bar: "from-[#00ff94] to-[#fbbf24]", border: "border-[#00ff94]/35", glow: "shadow-[0_0_40px_rgba(0,255,148,0.08)]", chip: "bg-[#00ff94]/15 text-[#00ff94]" },
  { bar: "from-[#ff6b35] to-[#f87171]", border: "border-[#ff6b35]/35", glow: "shadow-[0_0_40px_rgba(255,107,53,0.08)]", chip: "bg-[#ff6b35]/15 text-[#ff9f7a]" },
];

function countByStatus(tasks) {
  const counts = Object.fromEntries(DISPLAY_STATUSES.map((s) => [s, 0]));
  for (const t of tasks) {
    const s = normalizeTaskStatus(t.status);
    if (counts[s] !== undefined) counts[s]++;
  }
  return counts;
}

function countByPriority(tasks) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const t of tasks) {
    if (counts[t.priority] !== undefined) counts[t.priority]++;
  }
  return counts;
}

function bumpMemberStat(stat, status) {
  const s = normalizeTaskStatus(status);
  stat.total++;
  if (s === "Done") stat.completed++;
  else if (s === "In Progress" || s === "In Review") stat.wip++;
  else if (s === "Pending" || s === "Backlog") stat.pending++;
  else if (s === "Blocked") stat.hold++;
  else if (s === "Cancelled") stat.cancelled++;
}

function getMemberTaskStats(team) {
  const tasks = team.tasks || [];
  const byUser = {};

  for (const m of team.members || []) {
    const id = String(m.user?._id || m.user);
    byUser[id] = {
      id,
      name: m.user?.fullName || "Unknown",
      role: m.role,
      total: 0,
      completed: 0,
      wip: 0,
      pending: 0,
      hold: 0,
      cancelled: 0,
    };
  }

  for (const task of tasks) {
    const assignees = task.assignee?.length ? task.assignee : [];
    for (const user of assignees) {
      const id = String(user._id || user);
      if (!byUser[id]) {
        byUser[id] = {
          id,
          name: user.fullName || "Unknown",
          role: null,
          total: 0,
          completed: 0,
          wip: 0,
          pending: 0,
          hold: 0,
          cancelled: 0,
        };
      }
      bumpMemberStat(byUser[id], task.status);
    }
  }

  return Object.values(byUser)
    .map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function buildGlobalMemberRows(teams) {
  const map = {};
  for (const team of teams) {
    for (const m of getMemberTaskStats(team)) {
      const key = `${m.id}::${team._id}`;
      map[key] = {
        ...m,
        teamId: team._id,
        teamName: team.name,
      };
    }
    for (const m of team.members || []) {
      const id = String(m.user?._id || m.user);
      const key = `${id}::${team._id}`;
      if (!map[key]) {
        map[key] = {
          id,
          name: m.user?.fullName || "Unknown",
          role: m.role,
          teamId: team._id,
          teamName: team.name,
          total: 0,
          completed: 0,
          wip: 0,
          pending: 0,
          hold: 0,
          cancelled: 0,
          rate: 0,
        };
      }
    }
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function sprintTimeMeta(sprint) {
  if (!sprint?.startDate || !sprint?.endDate) {
    return { elapsedPct: 0, daysLeft: 0, totalDays: 0, label: "Dates not set" };
  }
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const now = new Date();
  const totalMs = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), totalMs);
  const elapsedPct = Math.round((elapsed / totalMs) * 100);
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  let label = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
  if (now > end) label = "Sprint ended";
  else if (now < start) label = "Not started yet";
  return { elapsedPct, daysLeft, totalDays, label };
}

function isOverdue(task) {
  if (!task.endDate || isTaskDone(task.status) || normalizeTaskStatus(task.status) === "Cancelled") return false;
  const end = new Date(task.endDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
}

function isDueSoon(task, withinDays = 3) {
  if (!task.endDate || isTaskDone(task.status) || normalizeTaskStatus(task.status) === "Cancelled") return false;
  const end = new Date(task.endDate);
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + withinDays);
  return end >= now && end <= limit;
}

function truncateName(name, max = 18) {
  if (!name) return "—";
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

function roleLabel(role) {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function Panel({ title, subtitle, children, className, accent }) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden",
        accent ? accent.border : "border-border",
        accent?.glow,
        className
      )}
    >
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

function MemberProgressRow({ member }) {
  const maxBar = Math.max(member.total, 1);
  const doneW = (member.completed / maxBar) * 100;
  const wipW = (member.wip / maxBar) * 100;
  const pendW = (member.pending / maxBar) * 100;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/15 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3 min-w-[180px]">
          <MemberAvatar name={member.name} size="sm" accent="cyan" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
            {member.role && (
              <span className="text-[10px] text-muted-foreground capitalize">{roleLabel(member.role)}</span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 text-center font-mono font-semibold text-foreground tabular-nums">{member.total}</td>
      <td className="py-3 text-center font-mono text-[#00ff94] tabular-nums">{member.completed}</td>
      <td className="py-3 text-center font-mono text-[#00d4ff] tabular-nums">{member.wip}</td>
      <td className="py-3 text-center font-mono text-muted-foreground tabular-nums">{member.pending}</td>
      <td className="py-3 text-center font-mono text-[#a78bfa] tabular-nums">{member.hold}</td>
      <td className="py-3 pl-4 min-w-[140px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-muted/80 overflow-hidden flex">
            <div className="h-full bg-[#00ff94]" style={{ width: `${doneW}%` }} />
            <div className="h-full bg-[#00d4ff]" style={{ width: `${wipW}%` }} />
            <div className="h-full bg-slate-500" style={{ width: `${pendW}%` }} />
          </div>
          <span
            className={cn(
              "text-xs font-mono font-bold w-10 text-right tabular-nums",
              member.rate >= 70 ? "text-[#00ff94]" : member.rate >= 40 ? "text-[#00d4ff]" : "text-muted-foreground"
            )}
          >
            {member.rate}%
          </span>
        </div>
      </td>
    </tr>
  );
}

function TeamWiseAnalytics({ teams = [], sprint }) {
  const safeTeams = teams || [];
  const allTasks = safeTeams.flatMap((t) => t.tasks || []);
  const statusCounts = countByStatus(allTasks);
  const priorityCounts = countByPriority(allTasks);
  const completed = statusCounts.Done || 0;
  const total = allTasks.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const unassigned = allTasks.filter((t) => !t.assignee?.length).length;
  const overdue = allTasks.filter(isOverdue);
  const dueSoon = allTasks.filter(isDueSoon);
  const memberIds = new Set();
  safeTeams.forEach((team) => {
    (team.members || []).forEach((m) => {
      const id = m.user?._id || m.user;
      if (id) memberIds.add(String(id));
    });
  });
  const time = sprintTimeMeta(sprint);
  const globalMemberRows = buildGlobalMemberRows(safeTeams);

  const statusPie = DISPLAY_STATUSES.map((s) => ({
    name: STATUS_META[s]?.label || s,
    value: statusCounts[s] || 0,
    color: STATUS_META[s]?.dot || "#94a3b8",
  }));

  const priorityPie = [
    { name: "Critical", value: priorityCounts.Critical },
    { name: "High", value: priorityCounts.High },
    { name: "Medium", value: priorityCounts.Medium },
    { name: "Low", value: priorityCounts.Low },
  ].filter((p) => p.value > 0);

  const teamStackData = safeTeams.map((team) => {
    const c = countByStatus(team.tasks || []);
    return {
      name: truncateName(team.name),
      completed: c.Done,
      wip: (c["In Progress"] || 0) + (c["In Review"] || 0),
      pending: (c.Pending || 0) + (c.Backlog || 0),
      hold: c.Blocked,
      cancelled: c.Cancelled,
    };
  });

  const teamWorkloadChart = safeTeams.map((team) => {
    const tasks = team.tasks || [];
    return {
      name: truncateName(team.name, 12),
      total: tasks.length,
      completed: tasks.filter((t) => isTaskDone(t.status)).length,
    };
  });

  const topMembersGlobal = [...globalMemberRows]
    .filter((m) => m.total > 0)
    .slice(0, 12)
    .map((m) => ({
      name: truncateName(`${m.name} (${truncateName(m.teamName, 8)})`, 22),
      completed: m.completed,
      wip: m.wip,
      pending: m.pending,
    }));

  if (!safeTeams.length && !total) {
    return (
      <div className="ww-page-full max-w-none min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border border-dashed border-[#00d4ff]/30 bg-gradient-to-br from-[#00d4ff]/5 to-card p-16 text-center max-w-lg">
          <BarChart3 className="w-12 h-12 text-[#00d4ff] mx-auto mb-4 opacity-70" />
          <p className="text-muted-foreground">No teams or tasks yet. Create teams, add members, and assign tasks to unlock analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ww-page-full max-w-none w-full min-h-[calc(100vh-7rem)] pb-16 space-y-8 bg-gradient-to-b from-[#00d4ff]/[0.04] via-background to-background">
      {/* Hero — full width */}
      <section className="relative rounded-2xl border border-[#00d4ff]/20 overflow-hidden bg-gradient-to-br from-[#0d1520] via-card to-[#0a1219] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(0,212,255,0.12),transparent),radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(0,255,148,0.08),transparent)] pointer-events-none" />
        <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col xl:flex-row xl:items-center gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#00d4ff] font-mono mb-2">Sprint intelligence</p>
            <h1 className="text-3xl sm:text-4xl font-bold ww-heading bg-gradient-to-r from-foreground via-foreground to-[#00d4ff] bg-clip-text text-transparent">
              {sprint?.name || "Sprint"}
            </h1>
            {sprint?.startDate && sprint?.endDate && (
              <p className="text-sm text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-2">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#00d4ff]" />
                  {convertDate(sprint.startDate)} → {convertDate(sprint.endDate)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#a78bfa]" />
                  {time.label}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-6 xl:gap-10">
            {[
              { pct: completionPct, color: "#00ff94", label: "Tasks done", sub: `${completed}/${total}` },
              { pct: time.elapsedPct, color: "#00d4ff", label: "Time used", sub: `${time.totalDays}d sprint` },
            ].map((ring) => (
              <div key={ring.label} className="flex flex-col items-center">
                <div
                  className="relative w-28 h-28 rounded-full"
                  style={{ background: `conic-gradient(${ring.color} ${ring.pct * 3.6}deg, #1a2332 0deg)` }}
                >
                  <div className="absolute inset-[6px] rounded-full bg-[#0d1117] flex flex-col items-center justify-center border border-border/50">
                    <span className="text-2xl font-bold font-mono" style={{ color: ring.color }}>
                      {ring.pct}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground mt-2">{ring.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{ring.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-[#00d4ff]/15 bg-black/20">
          {[
            { label: "Teams", value: safeTeams.length, icon: Layers, color: "text-[#00d4ff]" },
            { label: "Members", value: memberIds.size, icon: Users, color: "text-[#a78bfa]" },
            { label: "All tasks", value: total, icon: Target, color: "text-foreground" },
            { label: "Completed", value: completed, icon: CheckCircle2, color: "text-[#00ff94]" },
          ].map((row) => (
            <div key={row.label} className="px-6 py-4 flex items-center gap-3 border-r border-border/30 last:border-r-0">
              <row.icon className={cn("w-5 h-5 shrink-0", row.color)} />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{row.label}</div>
                <div className="font-mono text-xl font-bold text-foreground">{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="In progress" value={(statusCounts["In Progress"] || 0) + (statusCounts["In Review"] || 0)} variant="balance" />
        <StatCard label="Pending" value={(statusCounts.Pending || 0) + (statusCounts.Backlog || 0)} variant="neutral" />
        <StatCard label="On hold" value={statusCounts.Blocked} variant="neutral" />
        <StatCard label="Cancelled" value={statusCounts.Cancelled} variant="expense" />
        <StatCard label="Unassigned" value={unassigned} variant="neutral" sub="Tasks with no owner" />
        <StatCard
          label="At risk"
          value={overdue.length + dueSoon.length}
          variant="expense"
          sub={`${overdue.length} overdue · ${dueSoon.length} due soon`}
        />
      </div>

      {/* Charts row — full width */}
      <div className="grid xl:grid-cols-3 gap-5">
        <Panel title="Status mix" subtitle="Entire sprint" className="xl:col-span-1">
          {total > 0 ? <TaskStatusPie data={statusPie} /> : <p className="text-sm text-muted-foreground py-12 text-center">No tasks</p>}
        </Panel>
        <Panel title="Priority mix" subtitle="Workload weight" className="xl:col-span-1">
          {total > 0 ? <PriorityPieChart data={priorityPie} /> : <p className="text-sm text-muted-foreground py-12 text-center">No tasks</p>}
        </Panel>
        <Panel title="Team task volume" subtitle="Total assigned per team" className="xl:col-span-1">
          {teamWorkloadChart.some((t) => t.total > 0) ? (
            <MemberWorkloadBarChart data={teamWorkloadChart} barKey="total" color="#a78bfa" />
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No team tasks</p>
          )}
        </Panel>
      </div>

      {teamStackData.length > 0 && (
        <Panel title="Team status breakdown" subtitle="Stacked view — completed, WIP, pending, hold, cancelled">
          <TeamStackedTaskChart data={teamStackData} />
        </Panel>
      )}

      {/* ——— TEAM + MEMBER PERFORMANCE (main ask) ——— */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-[#00ff94]" />
          <div>
            <h2 className="text-xl font-bold ww-heading">Team & member performance</h2>
            <p className="text-sm text-muted-foreground">Who completed how many tasks — per team and per person</p>
          </div>
        </div>
      </div>

      {safeTeams.map((team, teamIndex) => {
        const accent = TEAM_ACCENTS[teamIndex % TEAM_ACCENTS.length];
        const tasks = team.tasks || [];
        const c = countByStatus(tasks);
        const teamTotal = tasks.length;
        const rate = teamTotal > 0 ? Math.round(((c.Done || 0) / teamTotal) * 100) : 0;
        const members = getMemberTaskStats(team);
        const memberChartData = members
          .filter((m) => m.total > 0)
          .map((m) => ({
            name: truncateName(m.name),
            completed: m.completed,
            wip: m.wip,
            pending: m.pending,
          }));

        return (
          <section
            key={team._id}
            className={cn(
              "rounded-2xl border overflow-hidden bg-card/90 backdrop-blur-sm",
              accent.border,
              accent.glow
            )}
          >
            <div className={cn("h-1.5 w-full bg-gradient-to-r", accent.bar)} />
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-2xl font-bold text-foreground">{team.name}</h3>
                    <span className={cn("text-xs font-mono px-2.5 py-1 rounded-full border", accent.chip)}>
                      {teamTotal} tasks · {rate}% done
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(team.members || []).length} roster members ·{" "}
                    {members.filter((m) => m.total > 0).length} with assigned work
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3 shrink-0">
                  {[
                    { label: "Done", val: c.Done, color: "text-[#00ff94]" },
                    { label: "WIP", val: (c["In Progress"] || 0) + (c["In Review"] || 0), color: "text-[#00d4ff]" },
                    { label: "Pending", val: (c.Pending || 0) + (c.Backlog || 0), color: "text-slate-400" },
                    { label: "Hold", val: c.Hold, color: "text-[#a78bfa]" },
                  ].map((box) => (
                    <div key={box.label} className="rounded-xl bg-muted/25 border border-border/60 px-4 py-3 text-center min-w-[72px]">
                      <div className={cn("font-mono text-xl font-bold", box.color)}>{box.val}</div>
                      <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{box.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 rounded-xl border border-border/70 overflow-hidden bg-[#0a0f14]/50">
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00d4ff]" />
                      Member task counts
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
                      Assigned · Done · WIP · Pending · Hold · Rate
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                          <th className="text-left py-3 px-4 font-medium">Member</th>
                          <th className="py-3 px-2 font-medium text-center">Assigned</th>
                          <th className="py-3 px-2 font-medium text-center text-[#00ff94]">Done</th>
                          <th className="py-3 px-2 font-medium text-center text-[#00d4ff]">WIP</th>
                          <th className="py-3 px-2 font-medium text-center">Pending</th>
                          <th className="py-3 px-2 font-medium text-center text-[#a78bfa]">Hold</th>
                          <th className="text-left py-3 px-4 font-medium">Completion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                              No members on this team yet
                            </td>
                          </tr>
                        ) : (
                          members.map((m) => <MemberProgressRow key={m.id} member={m} />)
                        )}
                      </tbody>
                    </table>
                  </div>
                  {members.some((m) => m.total === 0) && (
                    <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border/40 bg-muted/10">
                      Members with 0 assigned tasks are listed — assign sprint tasks to track their workload.
                    </p>
                  )}
                </div>
                <div className="xl:col-span-2 rounded-xl border border-border/70 bg-[#0a0f14]/50 p-4">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00ff94]" />
                    Member workload chart
                  </p>
                  {memberChartData.length > 0 ? (
                    <MemberGroupedBarChart data={memberChartData} />
                  ) : (
                    <p className="text-sm text-muted-foreground py-16 text-center">No assigned tasks for this team</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Global member leaderboard */}
      <Panel
        title="All members — sprint workload"
        subtitle="Every person across teams: assigned tasks and completion"
        accent={{ border: "border-[#00ff94]/25", glow: "shadow-[0_0_48px_rgba(0,255,148,0.06)]" }}
      >
        {globalMemberRows.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No members found</p>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/25">
                      <th className="text-left py-3 px-4">Member</th>
                      <th className="text-left py-3 px-3">Team</th>
                      <th className="text-center py-3 px-2">Assigned</th>
                      <th className="text-center py-3 px-2 text-[#00ff94]">Done</th>
                      <th className="text-center py-3 px-2 text-[#00d4ff]">WIP</th>
                      <th className="text-center py-3 px-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalMemberRows.map((m) => (
                      <tr key={`${m.id}-${m.teamId}`} className="border-b border-border/40 hover:bg-muted/15">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <MemberAvatar name={m.name} size="sm" accent="primary" />
                            <span className="font-medium truncate max-w-[140px]">{m.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{m.teamName}</td>
                        <td className="py-2.5 text-center font-mono font-semibold">{m.total}</td>
                        <td className="py-2.5 text-center font-mono text-[#00ff94]">{m.completed}</td>
                        <td className="py-2.5 text-center font-mono text-[#00d4ff]">{m.wip}</td>
                        <td className="py-2.5 text-center">
                          <span
                            className={cn(
                              "text-xs font-mono font-bold px-2 py-0.5 rounded",
                              m.rate >= 70 ? "bg-[#00ff94]/15 text-[#00ff94]" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {m.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3">Top contributors (stacked by status)</p>
                {topMembersGlobal.length > 0 ? (
                  <MemberGroupedBarChart data={topMembersGlobal} />
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">Assign tasks to members to see charts</p>
                )}
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* Status matrix */}
      {safeTeams.length > 0 && (
        <Panel title="Team status matrix" subtitle="Task counts by status for each team">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Team</th>
                  {DISPLAY_STATUSES.map((s) => (
                    <th key={s} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                      {STATUS_META[s]?.label || s}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-center">Total</th>
                  <th className="px-4 py-3 font-medium text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                {safeTeams.map((team, i) => {
                  const c = countByStatus(team.tasks || []);
                  const teamTotal = (team.tasks || []).length;
                  const teamRate = teamTotal > 0 ? Math.round(((c.Done || 0) / teamTotal) * 100) : 0;
                  return (
                    <tr key={team._id} className="border-b border-border/50 hover:bg-[#00d4ff]/5">
                      <td className="px-4 py-3 font-medium">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2 bg-[#00d4ff]"
                          style={{ boxShadow: "0 0 8px rgba(0,212,255,0.5)" }}
                        />
                        {team.name}
                      </td>
                      {DISPLAY_STATUSES.map((s) => (
                        <td key={s} className="px-3 py-3 text-center font-mono tabular-nums">
                          {c[s] || "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-mono font-bold">{teamTotal}</td>
                      <td className="px-4 py-3 text-center font-mono text-[#00ff94]">{teamRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <section className="rounded-2xl border border-destructive/40 bg-gradient-to-r from-destructive/10 via-card to-card p-5 sm:p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 text-destructive mb-4">
            <AlertTriangle className="w-5 h-5" />
            Attention needed
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {[...overdue, ...dueSoon].slice(0, 24).map((task) => {
              const team = safeTeams.find((t) => String(t._id) === String(task.team_id));
              const assigneeNames = task.assignee?.map((u) => u.fullName).filter(Boolean).join(", ") || "Unassigned";
              return (
                <li
                  key={task._id}
                  className="flex flex-col gap-2 text-sm py-3 px-4 rounded-xl bg-background/60 border border-border/80"
                >
                  <span className="font-medium">{task.title}</span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[#00d4ff]">{team?.name || "—"}</span>
                    <span className="text-muted-foreground">· {assigneeNames}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SHowStatus status={task.status} />
                    <PriorityShow status={task.priority} />
                    <span className={cn("text-xs font-mono ml-auto", isOverdue(task) ? "text-destructive" : "text-amber-400")}>
                      {isOverdue(task) ? "Overdue" : "Due soon"} · {convertDate(task.endDate)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export default TeamWiseAnalytics;
