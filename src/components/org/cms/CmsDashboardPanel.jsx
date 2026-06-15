import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, Eye, Heart, Trophy, BarChart2, Sparkles } from "lucide-react";
import { StatCard } from "@/components/org/StatCard";
import { CmsSocialJourney } from "@/components/org/cms/CmsSocialJourney";
import {
  formatCmsDate,
  formatCmsDateTime,
  formatNumber,
  statusBadgeStyle,
} from "@/lib/cms";

const PRIORITY_COLORS = {
  low: "#94a3b8",
  medium: "#38bdf8",
  high: "#f59e0b",
  urgent: "#ef4444",
};

function heatColor(intensity) {
  // 0..1
  if (!intensity) return "rgba(255,255,255,0.03)";
  const v = Math.min(Math.max(intensity, 0), 1);
  return `rgba(56,189,248,${0.15 + v * 0.7})`;
}

function MetricLine({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {hint ? <div className="text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function CmsDashboardPanel({ dashboard, loading, onSelectPlatform }) {
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Loading dashboard…</p>
    );
  }
  if (!dashboard) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No dashboard data yet.
      </p>
    );
  }

  const {
    summary,
    by_platform = [],
    priority_breakdown = {},
    upcoming_scheduled = [],
    recent_published = [],
    top_performers = [],
    weekly_trend = [],
    heatmap = [],
    goals = { active: [], achieved: [] },
    journey = [],
  } = dashboard;

  const priorityData = Object.entries(priority_breakdown).map(([k, v]) => ({
    name: k,
    value: v,
  }));
  const platformViews = by_platform.map((p) => ({
    name: p.name,
    views: Number(p.analytics?.views || 0),
    color: p.color,
  }));
  const weekData = weekly_trend.map((d) => ({
    day: d.day,
    Published: d.published,
    Scheduled: d.scheduled,
  }));

  // Heatmap: render as 7×N grid where N = number of buckets (default 24 if missing)
  const heatmapRows = heatmap.weekday || [];
  const heatmapHours = heatmap.hours || [];
  const heatmapValues = heatmap.values || [];

  return (
    <div className="space-y-6">
      <CmsSocialJourney journey={journey} onSelectPlatform={onSelectPlatform} />

      {/* Summary */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-primary" /> Overview
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platforms" value={summary.platform_count} variant="neutral" />
          <StatCard label="Content pieces" value={summary.content_count} variant="neutral" />
          <StatCard label="Scheduled" value={summary.scheduled_count} variant="balance" />
          <StatCard label="Published" value={summary.published_count} variant="income" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total followers" value={formatNumber(summary.total_followers)} variant="income" />
          <StatCard label="Engagement rate" value={`${(summary.engagement_rate || 0).toFixed(1)}%`} variant="balance" />
          <StatCard label="Published this week" value={summary.published_this_week} variant="neutral" />
          <StatCard label="Published this month" value={summary.published_this_month} variant="neutral" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total views" value={formatNumber(summary.views)} variant="neutral" />
          <StatCard label="Total likes" value={formatNumber(summary.likes)} variant="income" />
          <StatCard label="Comments" value={formatNumber(summary.comments)} variant="balance" />
          <StatCard label="Shares" value={formatNumber(summary.shares)} variant="neutral" />
        </div>
      </section>

      {/* Goals */}
      {goals.active?.length || goals.achieved?.length ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <Trophy className="w-4 h-4 text-amber-400" /> Goals
          </div>
          {goals.active?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {goals.active.slice(0, 6).map((g) => {
                const pct = g.progress_pct ?? 0;
                return (
                  <div key={g._id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{g.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {g.platform_name || "Org-wide"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatNumber(g.current_value)} → {formatNumber(g.target_value)}{" "}
                      {g.metric}
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {pct.toFixed(0)}% · target {formatCmsDate(g.target_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {goals.achieved?.length ? (
            <div className="mt-4 text-[11px] text-muted-foreground">
              🏆 {goals.achieved.length} goal{goals.achieved.length === 1 ? "" : "s"}{" "}
              achieved — see Goals tab to celebrate.
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">By platform</h3>
          {!by_platform.length ? (
            <p className="text-sm text-muted-foreground">
              Create a platform to see breakdowns.
            </p>
          ) : (
            <div className="space-y-4">
              {by_platform.map((p) => (
                <div key={p.platform_id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-sm" style={{ color: p.color }}>
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.total_content} items
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {p.by_status?.map((s) => {
                      const badge = statusBadgeStyle(s.color);
                      return (
                        <span
                          key={s.status_id}
                          className="text-[10px] px-2 py-0.5 rounded border"
                          style={badge}
                        >
                          {s.name}: {s.count}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span>{formatNumber(p.analytics?.views)} views</span>
                    <span>{formatNumber(p.analytics?.likes)} likes</span>
                    <span>{p.scheduled_count} scheduled</span>
                    <span>{p.published_count} published</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Priority mix & platform views</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48">
              {priorityData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {priorityData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={PRIORITY_COLORS[entry.name] || "#8884d8"}
                        />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No priority data</p>
              )}
            </div>

            <div className="h-48">
              {platformViews.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformViews}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                    />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Bar dataKey="views">
                      {platformViews.map((p, i) => (
                        <Cell key={i} fill={p.color || "#38bdf8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No views data</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Weekly trend */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
          <BarChart2 className="w-4 h-4 text-primary" /> Weekly activity
        </div>
        <div className="h-56">
          {weekData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weekData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Published"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Scheduled"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No activity in the last 7 days.</p>
          )}
        </div>
      </section>

      {/* Top performers */}
      {top_performers.length ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <Heart className="w-4 h-4 text-rose-400" /> Top performers
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {top_performers.map((t) => (
              <div
                key={t._id}
                className="rounded-lg border border-border p-3 space-y-1 bg-background/40"
              >
                <p className="text-sm font-medium truncate" title={t.title}>
                  {t.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.platform_name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Eye className="w-3 h-3" /> {formatNumber(t.views)}
                </div>
                {t.engagement_rate ? (
                  <div className="text-[10px] text-muted-foreground">
                    ER {t.engagement_rate.toFixed(2)}%
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Upcoming + recent + heatmap */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <CalendarClock className="w-4 h-4 text-cyan-400" /> Upcoming scheduled
          </div>
          {!upcoming_scheduled.length ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {upcoming_scheduled.map((item) => (
                <li
                  key={item._id}
                  className="flex items-start justify-between gap-2 text-sm border-b border-border/40 pb-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.platform_name}
                    </p>
                  </div>
                  <span className="text-[11px] text-cyan-400 shrink-0">
                    {formatCmsDateTime(item.scheduled_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Recent published</h3>
          {!recent_published.length ? (
            <p className="text-sm text-muted-foreground">No published items yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {recent_published.map((item) => (
                <li
                  key={item._id}
                  className="flex items-start justify-between gap-2 text-sm border-b border-border/40 pb-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.platform_name} · {formatNumber(item.views)} views
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatCmsDateTime(item.published_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Best posting hours</h3>
          {!heatmapRows.length ? (
            <p className="text-sm text-muted-foreground">
              No heatmap data — publish more content to learn your best hours.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `28px repeat(${heatmapHours.length}, minmax(14px, 1fr))`,
                }}
              >
                <div />
                {heatmapHours.map((h) => (
                  <div
                    key={`h-${h}`}
                    className="text-[9px] text-muted-foreground text-center"
                  >
                    {h}
                  </div>
                ))}
                {heatmapRows.map((row, ri) => (
                  <>
                    <div
                      key={`l-${ri}`}
                      className="text-[9px] text-muted-foreground self-center pr-1 text-right"
                    >
                      {row}
                    </div>
                    {heatmapHours.map((h, ci) => {
                      const v = heatmapValues?.[ri]?.[ci] || 0;
                      return (
                        <div
                          key={`c-${ri}-${ci}`}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: heatColor(v) }}
                          title={`${row} ${h}: ${v.toFixed(2)}`}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Tip: log analytics on published pieces and update follower snapshots on each platform to
        keep growth charts accurate.
      </p>
    </div>
  );
}

export default CmsDashboardPanel;
