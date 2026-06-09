import { StatCard } from "@/components/org/StatCard";
import { formatCmsDateTime, formatNumber, statusBadgeStyle } from "@/lib/cms";

export function CmsDashboardPanel({ dashboard, loading }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading dashboard…</p>;
  }
  if (!dashboard) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No dashboard data yet.</p>;
  }

  const { summary, by_platform, upcoming_scheduled, priority_breakdown } = dashboard;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Platforms" value={summary.platform_count} variant="neutral" />
        <StatCard label="Content pieces" value={summary.content_count} variant="neutral" />
        <StatCard label="Scheduled" value={summary.scheduled_count} variant="balance" />
        <StatCard label="Published" value={summary.published_count} variant="income" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total views" value={formatNumber(summary.views)} variant="neutral" />
        <StatCard label="Total likes" value={formatNumber(summary.likes)} variant="income" />
        <StatCard label="Comments" value={formatNumber(summary.comments)} variant="balance" />
        <StatCard label="Shares" value={formatNumber(summary.shares)} variant="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">By platform</h3>
          {!by_platform?.length ? (
            <p className="text-sm text-muted-foreground">Create a platform to see breakdowns.</p>
          ) : (
            <div className="space-y-4">
              {by_platform.map((p) => (
                <div key={p.platform_id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-medium text-sm" style={{ color: p.color }}>
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.total_content} items</span>
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
          <h3 className="text-sm font-semibold mb-3">Priority mix</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(priority_breakdown || {}).map(([key, count]) => (
              <div key={key} className="rounded-lg border border-border/60 px-3 py-2">
                <p className="text-[10px] uppercase text-muted-foreground">{key}</p>
                <p className="text-lg font-semibold font-mono">{count}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold mt-6 mb-3">Upcoming scheduled</h3>
          {!upcoming_scheduled?.length ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {upcoming_scheduled.map((item) => (
                <li
                  key={item._id}
                  className="flex items-start justify-between gap-2 text-sm border-b border-border/40 pb-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.platform_name}</p>
                  </div>
                  <span className="text-[11px] text-[#22d3ee] shrink-0">
                    {formatCmsDateTime(item.scheduled_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
