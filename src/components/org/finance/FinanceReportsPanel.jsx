import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import api from "@/ApiInception";
import { StatCard } from "@/components/org/StatCard";
import { formatMoneySensitive } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

export function FinanceReportsPanel({
  orgId,
  orgName = "Organization",
  currency = "BDT",
  canSeeExactAmounts = true,
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState("business");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fmt = (v) => formatMoneySensitive(v, currency, canSeeExactAmounts);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) years.push(y);
    return years;
  }, [currentYear]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/v1/org/${orgId}/finance/reports/yearly`, {
        params: { year, mode },
      });
      setReport(res.data.report);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, year, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = useMemo(() => {
    if (!report?.summary?.monthly) return [];
    const { income, expense } = report.summary.monthly;
    return MONTH_LABELS.map((label, i) => ({
      name: label,
      income: income[i] || 0,
      expense: expense[i] || 0,
    }));
  }, [report]);

  const generatedAt = new Date().toLocaleString();

  return (
    <div className="finance-reports space-y-6 text-left print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-foreground">Finance reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Yearly income and expense by month, project, and income source.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="ww-input ww-input-md text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("business")}
              className={cn(
                "px-3 py-2 transition-colors",
                mode === "business" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Business
            </button>
            <button
              type="button"
              onClick={() => setMode("all")}
              className={cn(
                "px-3 py-2 transition-colors",
                mode === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 print:border-gray-300">
        <h3 className="text-lg font-semibold text-foreground">{orgName}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {year} · {mode === "business" ? "Business partitions" : "All transactions"} · Generated {generatedAt}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      ) : report ? (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <StatCard
              label="Year income"
              value={fmt(report.summary.yearly.income)}
              variant="income"
              sub={`${year} total`}
            />
            <StatCard
              label="Year expense"
              value={fmt(report.summary.yearly.expense)}
              variant="expense"
              sub={`${year} total`}
            />
            <StatCard
              label="Year net"
              value={fmt(report.summary.yearly.net)}
              variant={report.summary.yearly.net >= 0 ? "income" : "expense"}
              sub="Income − expense"
            />
          </div>

          {(report.unlinked?.projectIncome > 0 || report.unlinked?.sourceIncome > 0) && (
            <div className="text-xs text-amber-600 dark:text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
              {report.unlinked.projectIncome > 0 && (
                <span>Unlinked project income: {fmt(report.unlinked.projectIncome)}. </span>
              )}
              {report.unlinked.sourceIncome > 0 && (
                <span>Unlinked income source income: {fmt(report.unlinked.sourceIncome)}.</span>
              )}
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Monthly trend</h3>
            <div className="h-64 w-full print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left min-w-[480px]">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-mono uppercase text-muted-foreground">Month</th>
                    <th className="px-3 py-2 text-right font-mono uppercase text-muted-foreground">Income</th>
                    <th className="px-3 py-2 text-right font-mono uppercase text-muted-foreground">Expense</th>
                    <th className="px-3 py-2 text-right font-mono uppercase text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTH_LABELS.map((label, i) => {
                    const inc = report.summary.monthly.income[i] || 0;
                    const exp = report.summary.monthly.expense[i] || 0;
                    const net = inc - exp;
                    return (
                      <tr key={label} className="border-t border-border/60">
                        <td className="px-3 py-2">{label}</td>
                        <td className="px-3 py-2 text-right font-mono text-primary tabular-nums">{fmt(inc)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{fmt(exp)}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-mono tabular-nums font-medium",
                            net > 0 && "text-primary",
                            net < 0 && "text-destructive"
                          )}
                        >
                          {fmt(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">By project</h3>
            {report.byProject.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project-linked activity this year.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left min-w-[520px]">
                  <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Project</th>
                      <th className="px-4 py-3 font-semibold text-right">Income</th>
                      <th className="px-4 py-3 font-semibold text-right">Expense</th>
                      <th className="px-4 py-3 font-semibold text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.byProject.map((row) => (
                      <tr key={row.projectId} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary tabular-nums">{fmt(row.income)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{fmt(row.expense)}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono font-semibold tabular-nums",
                            row.profit > 0 && "text-primary",
                            row.profit < 0 && "text-destructive"
                          )}
                        >
                          {fmt(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">By income source</h3>
            {report.byIncomeSource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income-source-linked activity this year.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left min-w-[560px]">
                  <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Income</th>
                      <th className="px-4 py-3 font-semibold text-right">Expense</th>
                      <th className="px-4 py-3 font-semibold text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.byIncomeSource.map((row) => (
                      <tr key={row.sourceId} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{row.status || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary tabular-nums">{fmt(row.income)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{fmt(row.expense)}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono font-semibold tabular-nums",
                            row.net > 0 && "text-primary",
                            row.net < 0 && "text-destructive"
                          )}
                        >
                          {fmt(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      <style>{`
        @media print {
          .finance-reports .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
