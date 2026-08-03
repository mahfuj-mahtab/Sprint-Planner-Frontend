import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { CurrencySelect } from "@/components/org/CurrencySelect";
import { defaultFinanceCurrency } from "@/lib/financeCurrencies";
import { EmptyState } from "@/components/org/EmptyState";
import { LinkedEntityField } from "@/components/org/LinkedEntityField";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";

let moneyCanSee = true;
function mfmt(value, currency = "BDT", compact = false) {
  return formatMoneySensitive(value, currency, moneyCanSee, compact);
}
import {
  INCOME_SOURCE_PRIORITIES,
  INCOME_SOURCE_STATUSES,
  INCOME_SOURCE_TYPES,
  defaultForm,
  emptyForecastRow,
  EXPECTED_EARNING_PERIODS,
  formatMonthsAsDuration,
  incomeSourcePriorityRank,
  normalizeIncomeSourcePriority,
  normalizeExpectedFromForm,
  periodYearlyTotal,
  priorityBadgeClass,
  priorityLabel,
  statusBadgeClass,
  statusLabel,
  typeLabel,
} from "@/lib/incomeSources";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

function ForecastEditor({ periods, onChange, currency }) {
  const updateRow = (idx, patch) => {
    const next = periods.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange(next);
  };

  const addRow = () => {
    onChange([...periods, emptyForecastRow(periods.length + 1)]);
  };

  const removeRow = (idx) => {
    if (periods.length <= 1) return;
    const next = periods.filter((_, i) => i !== idx).map((p, i) => ({ ...p, period_index: i + 1 }));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Revenue forecast (by earning year)</span>
        <button type="button" onClick={addRow} className="text-xs text-primary hover:underline">
          + Add year
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Year 1 = first year you earn. Enter monthly <em>or</em> yearly — monthly × 12 is calculated automatically.
      </p>
      {periods.map((row, idx) => {
        const yearly = periodYearlyTotal({
          monthly_income: row.monthly_income === "" ? null : Number(row.monthly_income),
          yearly_income: row.yearly_income === "" ? null : Number(row.yearly_income),
        });
        return (
          <div
            key={idx}
            className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-end rounded-lg border border-border p-2 bg-muted/20"
          >
            <span className="text-xs font-mono text-muted-foreground pb-2">Y{row.period_index}</span>
            <Field label="Monthly">
              <input
                type="number"
                min="0"
                step="0.01"
                className="ww-input ww-input-sm w-full font-mono"
                placeholder="—"
                value={row.monthly_income}
                onChange={(e) =>
                  updateRow(idx, { monthly_income: e.target.value, yearly_income: e.target.value ? "" : row.yearly_income })
                }
              />
            </Field>
            <Field label="Yearly (total)">
              <input
                type="number"
                min="0"
                step="0.01"
                className="ww-input ww-input-sm w-full font-mono"
                placeholder="—"
                value={row.yearly_income}
                disabled={Boolean(row.monthly_income)}
                onChange={(e) => updateRow(idx, { yearly_income: e.target.value })}
              />
            </Field>
            <div className="text-xs font-mono text-primary pb-2 whitespace-nowrap">
              = {mfmt(yearly, currency, true)}/yr
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-1.5 text-destructive hover:bg-muted rounded mb-0.5"
              disabled={periods.length <= 1}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STICKY_SOURCE =
  "sticky left-0 z-[2] border-r border-border bg-inherit shadow-[6px_0_16px_rgba(0,0,0,0.12)]";
const STICKY_SOURCE_HEAD =
  "sticky left-0 z-[3] border-r border-border bg-muted shadow-[6px_0_16px_rgba(0,0,0,0.12)]";

// Full-row background tint per priority so users know where to focus first
const PRIORITY_ROW_BG = {
  high:   "bg-emerald-500/[0.12] hover:bg-emerald-500/[0.18]",
  medium: "bg-[#00d4ff]/[0.07] hover:bg-[#00d4ff]/[0.12]",
  low:    "bg-amber-500/[0.07] hover:bg-amber-500/[0.12]",
  later:  "bg-muted/20 hover:bg-muted/40 opacity-60",
};

function priorityRowBg(priority) {
  return PRIORITY_ROW_BG[normalizeIncomeSourcePriority(priority)] ?? PRIORITY_ROW_BG.medium;
}

function defaultForecastYear(years, matrix) {
  if (!years.length) return new Date().getFullYear();
  const now = new Date().getFullYear();
  if (years.includes(now)) return now;
  const withData = years.find((y) => (matrix?.yearTotals?.[y] ?? matrix?.yearTotals?.[String(y)] ?? 0) > 0);
  return withData ?? years[0];
}

function monthsInCalendarYear(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    return {
      key: `${year}-${String(monthNum).padStart(2, "0")}`,
      monthNum,
      label: MONTH_NAMES[i],
    };
  });
}

function sumYearForRow(row, year) {
  return row.yearTotals?.[year] ?? row.yearTotals?.[String(year)] ?? 0;
}

/** Year-filtered monthly grid + compact yearly overview. */
function ForecastMonthlySnapshot({ matrix, items, fillViewport = false }) {
  const rows = matrix?.rows || [];
  const years = useMemo(() => matrix?.years || [], [matrix]);

  const defaultYear = useMemo(() => defaultForecastYear(years, matrix), [years, matrix]);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [view, setView] = useState("monthly");
  const [hideEmpty, setHideEmpty] = useState(false);

  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(defaultYear);
    }
  }, [years, defaultYear, selectedYear]);

  const rowById = useMemo(
    () => Object.fromEntries(items.map((s) => [String(s._id), s])),
    [items]
  );

  const currencies = useMemo(
    () => [...new Set(rows.map((r) => r.currency || "BDT"))],
    [rows]
  );
  const mixedCurrency = currencies.length > 1;
  const primaryCurrency = currencies[0] || "BDT";

  const yearIndex = years.indexOf(selectedYear);
  const goPrevYear = () => yearIndex > 0 && setSelectedYear(years[yearIndex - 1]);
  const goNextYear = () => yearIndex < years.length - 1 && setSelectedYear(years[yearIndex + 1]);

  const months = useMemo(() => monthsInCalendarYear(selectedYear), [selectedYear]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const pa = normalizeIncomeSourcePriority(rowById[a.sourceId]?.priority);
      const pb = normalizeIncomeSourcePriority(rowById[b.sourceId]?.priority);
      const rankDiff = incomeSourcePriorityRank(pa) - incomeSourcePriorityRank(pb);
      if (rankDiff !== 0) return rankDiff;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [rows, rowById]);

  const visibleRows = useMemo(() => {
    const base = sortedRows;
    if (!hideEmpty || view !== "monthly") return base;
    return base.filter((row) => {
      const hasMonth = months.some(({ key }) => (row.months?.[key] || 0) > 0);
      return hasMonth || sumYearForRow(row, selectedYear) > 0;
    });
  }, [sortedRows, hideEmpty, view, months, selectedYear]);

  const yearStats = useMemo(() => {
    const earning = rows.filter((r) => sumYearForRow(r, selectedYear) > 0).length;
    const total = rows.reduce((s, r) => s + sumYearForRow(r, selectedYear), 0);
    return { earning, total };
  }, [rows, selectedYear]);

  if (!rows.length || !years.length) return null;

  const shellClass = cn(
    "rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-0",
    fillViewport && "flex-1 min-h-[calc(100dvh-12rem)]"
  );

  const scrollClass = cn("overflow-auto flex-1 min-h-0", !fillViewport && "max-h-[min(70vh,720px)]");

  return (
    <div className={shellClass}>
      <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-3 sm:px-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
            <button
              type="button"
              onClick={() => setView("monthly")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-md transition",
                view === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month view
            </button>
            <button
              type="button"
              onClick={() => setView("yearly")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-md transition",
                view === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Year overview
            </button>
          </div>

          {view === "monthly" ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevYear}
                disabled={yearIndex <= 0}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <SelectInput
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm font-semibold min-w-[5.5rem] py-2"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </SelectInput>
              <button
                type="button"
                onClick={goNextYear}
                disabled={yearIndex >= years.length - 1}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30"
                aria-label="Next year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => setHideEmpty(e.target.checked)}
              className="rounded border-border"
            />
            Hide rows with no forecast
          </label>
        </div>

        {view === "monthly" ? (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{selectedYear}</span>
            {" · "}
            {yearStats.earning} of {rows.length} source{rows.length !== 1 ? "s" : ""} earning
            {!mixedCurrency && yearStats.total > 0 ? (
              <>
                {" · "}
                <span className="font-mono text-primary">{mfmt(yearStats.total, primaryCurrency)}</span>{" "}
                combined
              </>
            ) : null}
            {mixedCurrency ? (
              <span className="block text-xs mt-0.5">Multiple currencies — amounts use each row&apos;s currency.</span>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            One column per calendar year — good for comparing sources without scrolling months.
          </p>
        )}
      </div>

      <div className={scrollClass}>
        {view === "monthly" ? (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-[4]">
              <tr className="bg-muted text-muted-foreground">
                <th
                  className={cn(
                    STICKY_SOURCE_HEAD,
                    "text-left px-4 py-3 font-medium min-w-[11rem] max-w-[14rem]"
                  )}
                >
                  Income source
                </th>
                {months.map(({ label }) => (
                  <th
                    key={label}
                    className="px-2 py-3 text-right font-medium min-w-[4.5rem] whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-semibold text-foreground min-w-[5.5rem] bg-muted/90">
                  {selectedYear} total
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-muted-foreground">
                    No forecast for {selectedYear}. Try another year or turn off &quot;Hide rows with no
                    forecast&quot;.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const cur = row.currency || rowById[row.sourceId]?.currency || "BDT";
                  const yearTotal = sumYearForRow(row, selectedYear);
                  const rowPriority = normalizeIncomeSourcePriority(rowById[row.sourceId]?.priority);
                  return (
                    <tr
                      key={row.sourceId}
                      className={cn("border-t border-border/60", priorityRowBg(rowPriority))}
                    >
                      <td className={cn(STICKY_SOURCE, "px-4 py-2.5 align-top")}>
                        <div className="font-medium text-foreground leading-snug">{row.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={cn(
                              "text-[10px] uppercase px-1.5 py-0.5 rounded border",
                              statusBadgeClass(row.status)
                            )}
                          >
                            {statusLabel(row.status)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] uppercase px-1.5 py-0.5 rounded border font-semibold",
                              priorityBadgeClass(rowById[row.sourceId]?.priority || "medium")
                            )}
                          >
                            {priorityLabel(rowById[row.sourceId]?.priority || "medium")}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{cur}</span>
                        </div>
                        {row.revenueStartsAt ? (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            Revenue from {formatDate(row.revenueStartsAt)}
                          </div>
                        ) : null}
                      </td>
                      {months.map(({ key }) => {
                        const amt = row.months?.[key] || 0;
                        return (
                          <td
                            key={key}
                            className={cn(
                              "px-2 py-2.5 text-right font-mono tabular-nums text-[13px]",
                              amt > 0 ? "text-primary font-medium" : "text-muted-foreground/25"
                            )}
                          >
                            {amt > 0 ? mfmt(amt, cur, true) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-[13px] bg-muted/20">
                        {yearTotal > 0 ? mfmt(yearTotal, cur) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
              <tr className="border-t-2 border-[#00d4ff]/40 bg-[#00d4ff]/10 font-semibold sticky bottom-0">
                <td className={cn(STICKY_SOURCE, "px-4 py-3 bg-[#00d4ff]/10")}>Combined</td>
                {months.map(({ key }) => {
                  const amt = matrix.columnTotals?.[key] || 0;
                  return (
                    <td key={key} className="px-2 py-3 text-right font-mono tabular-nums text-primary">
                      {amt > 0 && !mixedCurrency ? mfmt(amt, primaryCurrency, true) : mixedCurrency && amt > 0 ? "·" : "—"}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-right font-mono text-primary bg-[#00d4ff]/15">
                  {!mixedCurrency && yearStats.total > 0
                    ? mfmt(yearStats.total, primaryCurrency)
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm border-collapse min-w-[32rem]">
            <thead className="sticky top-0 z-[4]">
              <tr className="bg-muted text-muted-foreground">
                <th className={cn(STICKY_SOURCE_HEAD, "text-left px-4 py-3 font-medium min-w-[11rem]")}>
                  Income source
                </th>
                {years.map((y) => (
                  <th key={y} className="px-3 py-3 text-right font-medium min-w-[5rem]">
                    {y}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-semibold text-foreground">All years</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const cur = row.currency || rowById[row.sourceId]?.currency || "BDT";
                const rowPriority = normalizeIncomeSourcePriority(rowById[row.sourceId]?.priority);
                return (
                  <tr
                    key={row.sourceId}
                    className={cn("border-t border-border/60", priorityRowBg(rowPriority))}
                  >
                    <td className={cn(STICKY_SOURCE, "px-4 py-2.5")}>
                      <div className="font-medium">{row.name}</div>
                      <span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded border font-semibold inline-block mt-0.5", priorityBadgeClass(rowPriority))}>
                        {priorityLabel(rowPriority)}
                      </span>
                    </td>
                    {years.map((y) => {
                      const amt = sumYearForRow(row, y);
                      return (
                        <td
                          key={y}
                          className={cn(
                            "px-3 py-2.5 text-right font-mono tabular-nums",
                            amt > 0 ? "text-primary font-medium" : "text-muted-foreground/25",
                            y === selectedYear && "bg-primary/[0.08]"
                          )}
                        >
                          {amt > 0 ? mfmt(amt, cur, true) : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-primary">
                      {mfmt(row.totalForecast || 0, cur, true)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-[#00d4ff]/40 bg-[#00d4ff]/10 font-semibold">
                <td className={cn(STICKY_SOURCE, "px-4 py-3")}>Combined</td>
                {years.map((y) => {
                  const amt =
                    matrix.yearTotals?.[y] ?? matrix.yearTotals?.[String(y)] ?? 0;
                  return (
                    <td key={y} className="px-3 py-3 text-right font-mono text-primary">
                      {amt > 0 && !mixedCurrency ? mfmt(amt, primaryCurrency, true) : "—"}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-right font-mono text-primary">
                  {!mixedCurrency
                    ? mfmt(
                        rows.reduce((s, r) => s + (r.totalForecast || 0), 0),
                        primaryCurrency,
                        true
                      )
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SourceDetail({ source, currency }) {
  const [open, setOpen] = useState(false);
  const timeline = source.timeline;
  const actuals = source.actuals || source.summary || {};

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? "Hide" : "Show"} plan & timeline
      </button>
      {open ? (
        <div className="mt-3 space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Started</span>
              <div className="font-medium mt-0.5">
                {timeline?.started_at ? formatDate(timeline.started_at) : "—"}
              </div>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Revenue begins</span>
              <div className="font-medium mt-0.5">
                {timeline?.revenue_starts_at ? formatDate(timeline.revenue_starts_at) : "—"}
                <span className="text-muted-foreground font-normal ml-1">
                  ({formatMonthsAsDuration(source.revenue_start_after_months)} after start)
                </span>
              </div>
            </div>
          </div>
          {source.expected_earning?.monthly > 0 ? (
            <div className="text-xs rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
              <span className="text-muted-foreground">Expected run rate: </span>
              <span className="font-mono text-primary font-medium">
                {mfmt(source.expected_earning.monthly, currency, true)}/mo
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-mono text-primary">
                {mfmt(source.expected_earning.yearly, currency, true)}/yr
              </span>
              {source.expected_earning.basis === "forecast" ? (
                <span className="text-muted-foreground"> (from forecast)</span>
              ) : null}
            </div>
          ) : null}
          {timeline?.periods?.length ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-3 py-2 font-normal text-muted-foreground">Earning year</th>
                    <th className="px-3 py-2 font-normal text-muted-foreground">Calendar</th>
                    <th className="px-3 py-2 font-normal text-muted-foreground text-right">Monthly</th>
                    <th className="px-3 py-2 font-normal text-muted-foreground text-right">Year total</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.periods.map((p) => {
                    const monthly =
                      p.monthly_income != null && p.monthly_income > 0
                        ? p.monthly_income
                        : p.yearly_total / 12;
                    return (
                      <tr key={p.period_index} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2">Year {p.period_index}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.calendar_label}</td>
                        <td className="px-3 py-2 text-right font-mono text-primary">
                          {mfmt(monthly, currency, true)}/mo
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {mfmt(p.yearly_total, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No forecast years added yet.</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs">
            <span>
              Invested: <strong className="font-mono">{mfmt(actuals.total_invested, currency)}</strong>
            </span>
            <span>
              Earned: <strong className="font-mono text-primary">{mfmt(actuals.total_revenue, currency)}</strong>
            </span>
            <span>
              Net:{" "}
              <strong className={cn("font-mono", actuals.net >= 0 ? "text-primary" : "text-destructive")}>
                {mfmt(actuals.net, currency)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function IncomeSourcesPanel({
  orgId,
  projects,
  onProjectCreated,
  onRefresh,
  currency = "BDT",
  canSeeExactAmounts = true,
  canWrite = true,
}) {
  moneyCanSee = canSeeExactAmounts;
  const orgCurrency = defaultFinanceCurrency(currency);
  const [items, setItems] = useState([]);
  const [expectedTotals, setExpectedTotals] = useState(null);
  const [forecastMatrix, setForecastMatrix] = useState(null);
  const [monthlyActuals, setMonthlyActuals] = useState({ years: [], bySourceMonth: {} });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      api.get(`/api/v1/org/${orgId}/finance/income-sources`),
      api.get(`/api/v1/org/${orgId}/finance/income-sources/monthly-actuals`),
    ])
      .then(([sourcesRes, actualsRes]) => {
        const incoming = sourcesRes.data.sources || [];
        incoming.sort((a, b) => {
          const rankDiff =
            incomeSourcePriorityRank(normalizeIncomeSourcePriority(a.priority)) -
            incomeSourcePriorityRank(normalizeIncomeSourcePriority(b.priority));
          if (rankDiff !== 0) return rankDiff;
          return String(a.name || "").localeCompare(String(b.name || ""));
        });
        setItems(incoming);
        setExpectedTotals(sourcesRes.data.expectedTotals || null);
        setForecastMatrix(sourcesRes.data.forecastMatrix || null);
        setMonthlyActuals({
          years: actualsRes.data.years || [],
          bySourceMonth: actualsRes.data.bySourceMonth || {},
        });
      })
      .catch(() => toast.error("Failed to load income sources", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm(orgCurrency));
    setModalOpen(true);
  };

  const openEdit = (source) => {
    setEditingId(source._id);
    setForm({
      name: source.name,
      description: source.description || "",
      type: source.type || "other",
      status: source.status || "idea",
      priority: normalizeIncomeSourcePriority(source.priority),
      currency: defaultFinanceCurrency(source.currency || orgCurrency),
      planned_investment: source.planned_investment ? String(source.planned_investment) : "",
      revenue_start_after_months: String(source.revenue_start_after_months ?? 0),
      started_at: source.started_at
        ? new Date(source.started_at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      project_id: source.project_id?._id || source.project_id || "",
      notes: source.notes || "",
      expected_earning_amount:
        source.expected_earning_amount != null ? String(source.expected_earning_amount) : "",
      expected_earning_period: source.expected_earning_period || "monthly",
      forecast_periods: (source.forecast_periods || []).length
        ? source.forecast_periods.map((p) => ({
            period_index: p.period_index,
            monthly_income: p.monthly_income != null ? String(p.monthly_income) : "",
            yearly_income:
              p.monthly_income != null && p.monthly_income > 0
                ? ""
                : p.yearly_income != null
                  ? String(p.yearly_income)
                  : "",
          }))
        : [emptyForecastRow(1)],
    });
    setModalOpen(true);
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description,
    type: form.type,
    status: form.status,
    priority: normalizeIncomeSourcePriority(form.priority),
    currency: form.currency,
    planned_investment: Number(form.planned_investment) || 0,
    revenue_start_after_months: Math.round(Number(form.revenue_start_after_months) || 0),
    started_at: form.started_at || null,
    project_id: form.project_id || undefined,
    notes: form.notes,
    expected_earning_amount:
      form.expected_earning_amount === "" ? null : Number(form.expected_earning_amount),
    expected_earning_period: form.expected_earning_period || "monthly",
    forecast_periods: form.forecast_periods.map((p, i) => ({
      period_index: Number(p.period_index) || i + 1,
      monthly_income: p.monthly_income === "" ? null : Number(p.monthly_income),
      yearly_income: p.yearly_income === "" ? null : Number(p.yearly_income),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required", { theme: "dark" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.patch(`/api/v1/org/${orgId}/finance/income-sources/${editingId}`, payload);
      } else {
        await api.post(`/api/v1/org/${orgId}/finance/income-sources`, payload);
      }
      toast.success(editingId ? "Updated" : "Created", { theme: "dark" });
      setModalOpen(false);
      await load();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this income source? Linked transactions keep their data but lose the link.")) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/v1/org/${orgId}/finance/income-sources/${id}`);
      toast.success("Deleted", { theme: "dark" });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const formExpected = normalizeExpectedFromForm(
    form.expected_earning_amount,
    form.expected_earning_period
  );

  const actualMatrix = useMemo(() => {
    const months = monthlyActuals.bySourceMonth || {};
    const years = monthlyActuals.years || [];
    const rows = items.map((source) => {
      const srcId = String(source._id);
      const perMonth = months[srcId] || {};
      const yearTotals = {};
      for (const key of Object.keys(perMonth)) {
        const y = Number(key.slice(0, 4));
        yearTotals[y] = (yearTotals[y] || 0) + perMonth[key];
      }
      return {
        sourceId: srcId,
        name: source.name,
        status: source.status,
        priority: normalizeIncomeSourcePriority(source.priority),
        currency: source.currency || currency,
        months: perMonth,
        yearTotals,
      };
    });
    return { years, rows };
  }, [monthlyActuals, items, currency]);

  const [actualYear, setActualYear] = useState(() => {
    const now = new Date().getFullYear();
    const years = actualMatrix.years || [];
    return years.includes(now) ? now : years[years.length - 1] || now;
  });

  useEffect(() => {
    if (actualMatrix.years.length && !actualMatrix.years.includes(actualYear)) {
      setActualYear(actualMatrix.years[actualMatrix.years.length - 1]);
    }
  }, [actualMatrix.years, actualYear]);

  const actualVsForecastByYear = useMemo(() => {
    const years = new Set([...(forecastMatrix?.years || []), ...(actualMatrix.years || [])]);
    return Array.from(years)
      .sort((a, b) => a - b)
      .map((year) => {
        const actual = actualMatrix.rows.reduce(
          (sum, row) => sum + (row.yearTotals?.[year] || row.yearTotals?.[String(year)] || 0),
          0
        );
        const forecast = forecastMatrix?.yearTotals?.[year] ?? forecastMatrix?.yearTotals?.[String(year)] ?? 0;
        return { year: String(year), actual, forecast };
      });
  }, [actualMatrix, forecastMatrix]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasSnapshot = items.length > 0 && forecastMatrix?.monthKeys?.length;

  return (
    <div className="w-full min-h-[calc(100dvh-9rem)] flex flex-col gap-4 pb-10 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold ww-heading flex items-center gap-2">
            <Target className="w-5 h-5 text-primary shrink-0" />
            Income sources
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Pick a year to see Jan–Dec for every source, or switch to year overview. Manage sources below.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground shrink-0"
        >
          <Plus className="w-4 h-4" /> Add source
        </button>
      </div>

      {expectedTotals?.buckets?.length > 0 ? (
        <div className="flex flex-wrap gap-2 shrink-0">
          {expectedTotals.buckets.map((bucket) => (
            <div
              key={bucket.currency}
              className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs"
            >
              <span className="text-muted-foreground">Expected ({bucket.currency}): </span>
              <span className="font-mono text-primary font-medium">
                {mfmt(bucket.monthlyTotal, bucket.currency, true)}/mo
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-mono text-primary">
                {mfmt(bucket.yearlyTotal, bucket.currency, true)}/yr
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {hasSnapshot ? (
        <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[#00d4ff]/25 bg-gradient-to-br from-[#00d4ff]/[0.06] via-card to-card p-3 sm:p-4 gap-2 min-h-[calc(100dvh-13rem)]">
          <ForecastMonthlySnapshot matrix={forecastMatrix} items={items} fillViewport />
        </section>
      ) : null}

      {actualMatrix.rows.length > 0 && actualMatrix.years.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold">Actual monthly snapshot</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Month-by-month actual income by source.
              </p>
            </div>
            <SelectInput value={String(actualYear)} onChange={(e) => setActualYear(Number(e.target.value))} className="max-w-28 text-sm">
              {actualMatrix.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm border-collapse min-w-[60rem]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className={cn(STICKY_SOURCE_HEAD, "text-left px-3 py-2 font-normal text-muted-foreground")}>Income source</th>
                  {MONTH_NAMES.map((label) => (
                    <th key={label} className="px-2 py-2 text-right font-normal text-muted-foreground min-w-[4.5rem]">
                      {label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold">{actualYear} total</th>
                </tr>
              </thead>
              <tbody>
                {[...actualMatrix.rows]
                  .sort((a, b) => {
                    const rankDiff =
                      incomeSourcePriorityRank(normalizeIncomeSourcePriority(a.priority)) -
                      incomeSourcePriorityRank(normalizeIncomeSourcePriority(b.priority));
                    if (rankDiff !== 0) return rankDiff;
                    return String(a.name || "").localeCompare(String(b.name || ""));
                  })
                  .map((row) => {
                  const yearTotal = row.yearTotals?.[actualYear] || 0;
                  const rowPriority = normalizeIncomeSourcePriority(row.priority);
                  return (
                    <tr key={row.sourceId} className={cn("border-t border-border/60", priorityRowBg(rowPriority))}>
                      <td className={cn(STICKY_SOURCE, "px-3 py-2.5")}>
                        <div className="font-medium">{row.name}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded border inline-block", statusBadgeClass(row.status))}>
                            {statusLabel(row.status)}
                          </span>
                          <span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded border inline-block font-semibold", priorityBadgeClass(rowPriority))}>
                            {priorityLabel(rowPriority)}
                          </span>
                        </div>
                      </td>
                      {MONTH_NAMES.map((_, i) => {
                        const key = `${actualYear}-${String(i + 1).padStart(2, "0")}`;
                        const amt = row.months?.[key] || 0;
                        return (
                          <td key={key} className={cn("px-2 py-2.5 text-right font-mono text-[13px]", amt > 0 ? "text-primary" : "text-muted-foreground/30")}>
                            {amt > 0 ? mfmt(amt, row.currency, true) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">{yearTotal > 0 ? mfmt(yearTotal, row.currency) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {actualVsForecastByYear.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <h3 className="text-base font-semibold">Year by year: actual vs prediction</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Combined totals per year.
            </p>
          </div>
          <div className="h-72 rounded-lg border border-border bg-muted/10 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actualVsForecastByYear} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [
                    mfmt(value, currency, true),
                    name === "actual" ? "Actual" : "Predicted",
                  ]}
                />
                <Bar dataKey="forecast" name="Predicted" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#00ff94" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <details className="shrink-0 rounded-xl border border-border bg-card/40 group">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold flex items-center justify-between gap-2 hover:bg-muted/20 rounded-xl [&::-webkit-details-marker]:hidden">
          <span>
            Manage sources ({items.length})
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60">
      {items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No income sources yet"
          description="Example: YouTube channel — $10k investment, revenue after 2 years, $50 in year 1 then $200/mo in year 2."
          action={
            <button type="button" onClick={openCreate} className="ww-btn-primary text-sm">
              Add your first source
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((source) => {
            const cur = source.currency || currency;
            const planned = Number(source.planned_investment) || 0;
            const invested = source.actuals?.total_invested ?? 0;
            const earned = source.actuals?.total_revenue ?? 0;
            const forecastTotal = source.timeline?.total_forecast_revenue ?? 0;
            const investPct = planned > 0 ? Math.min(100, (invested / planned) * 100) : 0;
            const exp = source.expected_earning;

            return (
              <li key={source._id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[15px]">{source.name}</span>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border font-semibold",
                          priorityBadgeClass(source.priority || "medium")
                        )}
                      >
                        {priorityLabel(source.priority || "medium")}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border",
                          statusBadgeClass(source.status)
                        )}
                      >
                        {statusLabel(source.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">{typeLabel(source.type)}</span>
                    </div>
                    {source.description ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{source.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(source)}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(source._id)}
                      className="p-2 rounded-md hover:bg-muted text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground">Planned investment</div>
                    <div className="font-mono font-medium mt-0.5">{mfmt(planned, cur)}</div>
                    {planned > 0 ? (
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-500/80" style={{ width: `${investPct}%` }} />
                      </div>
                    ) : null}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Spent {mfmt(invested, cur, true)}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground">Actual revenue</div>
                    <div className="font-mono font-medium text-primary mt-0.5">{mfmt(earned, cur)}</div>
                  </div>
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Forecast (all years)
                    </div>
                    <div className="font-mono font-medium mt-0.5">{mfmt(forecastTotal, cur)}</div>
                  </div>
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground">Revenue starts</div>
                    <div className="font-medium mt-0.5 text-[11px] leading-snug">
                      {formatMonthsAsDuration(source.revenue_start_after_months)}
                      {source.timeline?.revenue_starts_at ? (
                        <span className="block text-muted-foreground font-normal">
                          ~{formatDate(source.timeline.revenue_starts_at)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <SourceDetail source={source} currency={cur} />
              </li>
            );
          })}
        </ul>
      )}
        </div>
      </details>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit income source" : "New income source"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                className="ww-input ww-input-md w-full"
                required
                placeholder="YouTube channel, SaaS app…"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {INCOME_SOURCE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type">
              <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {INCOME_SOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Currency">
              <CurrencySelect
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Priority">
              <SelectInput value={form.priority || "medium"} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {INCOME_SOURCE_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground">List order rule</div>
              <div className="text-xs mt-0.5">High → Medium → Low → Later (Later stays at bottom)</div>
            </div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-3">
            <div className="text-sm font-medium">Expected earning (optional)</div>
            <p className="text-xs text-muted-foreground -mt-2">
              Steady income you plan to make from this source — used in totals at the top. Leave empty to
              use the active forecast year only.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="ww-input ww-input-md w-full font-mono"
                  placeholder="e.g. 200"
                  value={form.expected_earning_amount}
                  onChange={(e) => setForm({ ...form, expected_earning_amount: e.target.value })}
                />
              </Field>
              <Field label="Period">
                <SelectInput
                  value={form.expected_earning_period}
                  onChange={(e) => setForm({ ...form, expected_earning_period: e.target.value })}
                >
                  {EXPECTED_EARNING_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            {formExpected.monthly > 0 ? (
              <p className="text-xs font-mono text-primary">
                ≈ {mfmt(formExpected.monthly, form.currency || orgCurrency, true)}/month ·{" "}
                {mfmt(formExpected.yearly, form.currency || orgCurrency, true)}/year
              </p>
            ) : null}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Planned investment" hint={`Total you expect to put in (${form.currency || orgCurrency})`}>
              <input
                type="number"
                min="0"
                step="0.01"
                className="ww-input ww-input-md w-full font-mono"
                value={form.planned_investment}
                onChange={(e) => setForm({ ...form, planned_investment: e.target.value })}
              />
            </Field>
            <Field
              label="Revenue starts after (months)"
              hint="24 = 2 years with no revenue, then forecast years begin"
            >
              <input
                type="number"
                min="0"
                step="1"
                className="ww-input ww-input-md w-full font-mono"
                value={form.revenue_start_after_months}
                onChange={(e) => setForm({ ...form, revenue_start_after_months: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatMonthsAsDuration(form.revenue_start_after_months)}
              </p>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Started on" hint="When you began working on this">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={form.started_at}
                onChange={(e) => setForm({ ...form, started_at: e.target.value })}
              />
            </Field>
            <LinkedEntityField
              label="Linked project"
              hint="Optional — ties to delivery work"
              value={form.project_id}
              onChange={(project_id) => setForm({ ...form, project_id })}
              items={projects}
              placeholder="None"
              orgId={orgId}
              entityType="project"
              onEntityCreated={onProjectCreated}
            />
          </div>
          <Field label="Description">
            <textarea
              className="ww-input w-full min-h-[60px] text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <ForecastEditor
            periods={form.forecast_periods}
            onChange={(forecast_periods) => setForm({ ...form, forecast_periods })}
            currency={form.currency || currency}
          />
          <Field label="Notes">
            <input className="ww-input ww-input-md w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 sticky bottom-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? "Save changes" : "Create source"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
