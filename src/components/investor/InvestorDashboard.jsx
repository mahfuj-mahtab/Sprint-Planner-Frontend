import { Link } from "react-router-dom";
import {
  BarChart3,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/org/StatCard";
import { formatMoneySensitive } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const STATUS_CLASS = {
  active: "bg-primary/15 text-primary border-primary/30",
  inactive: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  exited: "bg-muted/40 text-muted-foreground border-border",
};

const OWNERSHIP_COLORS = ["#00d4ff", "#00ff94", "#a78bfa", "#fbbf24", "#f472b6", "#64748b"];

export function InvestorDashboard({
  metrics,
  summary,
  loading,
  currency = "BDT",
  canSeeExactAmounts = true,
  compact = false,
}) {
  const fmt = (value, cur = currency) => formatMoneySensitive(value, cur, canSeeExactAmounts);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics || !summary) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No investor data yet. Add investors and record capital to see metrics here.
      </div>
    );
  }

  const cur = summary.currency || metrics.summary?.currency || currency;
  const ownershipData = (metrics.ownershipSummary || [])
    .filter((inv) => Number(inv.ownership_percentage) > 0)
    .map((inv, idx) => ({
      name: inv.name.length > 16 ? `${inv.name.slice(0, 16)}…` : inv.name,
      fullName: inv.name,
      value: Number(inv.ownership_percentage),
      invested: inv.total_invested,
      fill: OWNERSHIP_COLORS[idx % OWNERSHIP_COLORS.length],
    }));

  const topBar = (summary.topInvestors || []).slice(0, 6).map((inv) => ({
    name: inv.name.length > 12 ? `${inv.name.slice(0, 12)}…` : inv.name,
    invested: Number(inv.total_invested || 0),
    ownership: Number(inv.ownership_percentage || 0),
  }));

  const ownershipAllocated = Number(metrics.summary?.total_ownership_allocated || 0);
  const ownershipFree = Math.max(0, 100 - ownershipAllocated);

  return (
    <div className="space-y-6">
      <section className={cn("grid gap-3", compact ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5")}>
        <StatCard
          label="Total raised"
          value={fmt(summary.totalRaised, cur)}
          sub="Capital recorded (not income)"
          variant="income"
        />
        <StatCard
          label="Active investors"
          value={metrics.summary.active_investors}
          sub={`${metrics.summary.total_investors} total`}
          variant="balance"
        />
        <StatCard
          label="Avg per investor"
          value={fmt(summary.avgInvestment, cur)}
          sub="Raised ÷ active count"
          variant="neutral"
        />
        <StatCard
          label="Ownership allocated"
          value={`${ownershipAllocated}%`}
          sub={`${ownershipFree}% unallocated`}
          variant={ownershipAllocated > 100 ? "expense" : "neutral"}
        />
        {!compact && (
          <StatCard
            label="Investment rounds"
            value={(metrics.investors || []).reduce((s, i) => s + Number(i.investment_count || 0), 0)}
            sub="Recorded transactions"
            variant="neutral"
          />
        )}
      </section>

      {summary.totalsByCurrency?.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {summary.totalsByCurrency.map((item) => (
            <span
              key={item.currency}
              className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-mono text-muted-foreground"
            >
              {item.currency}: {fmt(item.amount, item.currency)}
            </span>
          ))}
        </div>
      )}

      <section className="grid lg:grid-cols-12 gap-4">
        <div className="ww-card p-4 lg:col-span-4">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Ownership split
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Equity % by investor</p>
          {ownershipData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No ownership set</p>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ownershipData}
                      dataKey="value"
                      nameKey="fullName"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {ownershipData.map((entry) => (
                        <Cell key={entry.fullName} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, props) => [
                        `${value}% · ${fmt(props.payload.invested, cur)}`,
                        props.payload.fullName,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs max-h-32 overflow-y-auto">
                {ownershipData.map((row) => (
                  <li key={row.fullName} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.fill }} />
                      {row.fullName}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">{row.value}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="ww-card p-4 lg:col-span-8">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top investors by capital
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Total invested per investor</p>
          {topBar.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No investments recorded</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBar} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name) =>
                      name === "invested" ? fmt(value, cur) : `${value}%`
                    }
                  />
                  <Bar dataKey="invested" name="invested" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {!compact && (
        <section className="ww-card p-4">
          <h3 className="text-sm font-semibold mb-4">All investors</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Ownership</th>
                  <th className="px-4 py-3 font-semibold">Invested</th>
                  <th className="px-4 py-3 font-semibold">Rounds</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(metrics.investors || []).map((inv) => (
                  <tr key={inv._id} className="hover:bg-muted/20 transition">
                    <td className="px-4 py-3 font-medium">{inv.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{inv.investor_type}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{inv.ownership_percentage}%</td>
                    <td className="px-4 py-3 font-mono tabular-nums text-primary">
                      {fmt(inv.total_invested, cur)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.investment_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold",
                          STATUS_CLASS[inv.status] || STATUS_CLASS.exited
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export function InvestorQuickActions({ orgId, canWrite = true }) {
  if (!canWrite) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/user/profile/org/${orgId}/investors`}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1"
      >
        <Users className="w-3.5 h-3.5" /> Manage investors
      </Link>
      <Link
        to={`/user/profile/org/${orgId}/investors/record`}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-1"
      >
        <ReceiptText className="w-3.5 h-3.5" /> Record investment
      </Link>
      <Link
        to={`/user/profile/org/${orgId}/investors/dashboard`}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#00d4ff]/40 text-[#00d4ff] hover:bg-[#00d4ff]/10 inline-flex items-center gap-1"
      >
        <BarChart3 className="w-3.5 h-3.5" /> Full dashboard
      </Link>
    </div>
  );
}

export function InvestorAccessBanner({ accessRole, canSeeExactAmounts, canWrite }) {
  if (accessRole === "viewer") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Viewers cannot access investor or finance data.
      </div>
    );
  }
  if (!canSeeExactAmounts && canWrite && accessRole === "editor") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
        Editor role: you can manage investors and record investments, but dollar amounts are hidden.
        Only owners and admins see exact figures.
      </div>
    );
  }
  return null;
}
