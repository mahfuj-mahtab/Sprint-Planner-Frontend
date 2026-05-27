import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, TrendingDown, Calendar, Target } from "lucide-react";
import api from "@/ApiInception";
import { StatCard } from "@/components/org/StatCard";
import { formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

export function SubscriptionDashboard({ orgId, currency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/finance/subscriptions/dashboard`)
      .then((r) => setData(r.data.dashboard))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  const cur = data?.primaryCurrency || currency || "BDT";
  const fmt = (v) => formatMoney(v, cur);
  const s = data?.summary;
  const monthlyActual = s?.runningMonthly ?? 0;
  const monthlyExpected = s?.plannedMonthly ?? 0;
  const monthlyProbable = monthlyActual + monthlyExpected;
  const yearlyActual = s?.runningMonthly ? s.runningMonthly * 12 : 0;
  const yearlyExpected = s?.plannedMonthly ? s.plannedMonthly * 12 : 0;
  const yearlyProbable = yearlyActual + yearlyExpected;

  const chartData = (data?.byMonth || []).map((m) => ({
    label: m.label,
    expected: m.expectedTotal,
    running: m.expectedRunning,
    planned: m.expectedPlanned,
    actual: m.actual,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Could not load subscription dashboard.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-[#a78bfa]/25 bg-gradient-to-br from-[#a78bfa]/10 via-card to-transparent p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#a78bfa] font-mono mb-2">
              Recurring costs
            </div>
            <h2 className="text-xl font-bold ww-heading">Subscription dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {data.counts.running} running · {data.counts.planned} planned · expected vs actual
              charges (next 12 months)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <StatCard
          label="Monthly actual"
          value={fmt(monthlyActual)}
          variant="expense"
          sub="Running subscriptions"
        />
        <StatCard
          label="Monthly expected"
          value={fmt(monthlyExpected)}
          variant="balance"
          sub="Planned subscriptions"
        />
        <StatCard
          label="Monthly probable total"
          value={fmt(monthlyProbable)}
          variant="neutral"
          sub="Actual + expected"
        />
        <StatCard
          label="Yearly total actual"
          value={fmt(yearlyActual)}
          variant="expense"
          sub="Running subscriptions"
        />
        <StatCard
          label="Yearly total expected"
          value={fmt(yearlyExpected)}
          variant="balance"
          sub="Planned subscriptions"
        />
        <StatCard
          label="Yearly probable total"
          value={fmt(yearlyProbable)}
          variant="neutral"
          sub="Actual + expected"
        />
      </div>

      {Object.keys(data.summaryByCurrency || {}).length > 1 ? (
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {Object.entries(data.summaryByCurrency).map(([c, row]) => (
            <span key={c} className="px-2.5 py-1 rounded-full border border-border bg-muted/30">
              {c}: {formatMoney(row.totalMonthly, c)}/mo · {formatMoney(row.totalYearly, c)}/yr
            </span>
          ))}
        </div>
      ) : null}

      <div className="ww-card-sm border-border/80 p-4 sm:p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-[#a78bfa]" />
          Monthly expected vs actual
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Next 12 months · {cur}</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [fmt(v), name]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="running" name="Running (expected)" stackId="e" fill="#a78bfa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="planned" name="Planned (expected)" stackId="e" fill="#64748b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#00ff94" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No forecast data yet.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="ww-card-sm border-border/80 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            By category (monthly equiv.)
          </h3>
          {data.byCategory?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.byCategory.map((c) => (
                <li key={c.name} className="flex justify-between gap-2 border-b border-border/50 pb-2">
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-xs shrink-0 text-muted-foreground">
                    <span className="text-destructive">{fmt(c.running)}</span>
                    {c.planned > 0 ? (
                      <span className="text-[#a78bfa] ml-1">+{fmt(c.planned)} plan</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ww-card-sm border-border/80 p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Month breakdown
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 font-medium">Month</th>
                <th className="text-right py-2 font-medium">Running</th>
                <th className="text-right py-2 font-medium">Planned</th>
                <th className="text-right py-2 font-medium">Expected</th>
                <th className="text-right py-2 font-medium">Actual</th>
                <th className="text-right py-2 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {(data.byMonth || []).map((m) => (
                <tr key={m.key} className="border-b border-border/40">
                  <td className="py-2 font-medium">{m.label}</td>
                  <td className="py-2 text-right font-mono text-[#a78bfa]">{fmt(m.expectedRunning)}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">{fmt(m.expectedPlanned)}</td>
                  <td className="py-2 text-right font-mono">{fmt(m.expectedTotal)}</td>
                  <td className="py-2 text-right font-mono text-primary">{fmt(m.actual)}</td>
                  <td
                    className={cn(
                      "py-2 text-right font-mono",
                      m.variance > 0 ? "text-destructive" : "text-primary"
                    )}
                  >
                    {fmt(m.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
