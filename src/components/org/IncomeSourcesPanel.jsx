import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
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
import { StatCard } from "@/components/org/StatCard";
import { EmptyState } from "@/components/org/EmptyState";
import { LinkedEntityField } from "@/components/org/LinkedEntityField";
import { formatMoney, formatDate } from "@/lib/formatMoney";
import {
  INCOME_SOURCE_STATUSES,
  INCOME_SOURCE_TYPES,
  defaultForm,
  emptyForecastRow,
  EXPECTED_EARNING_PERIODS,
  formatMonthsAsDuration,
  normalizeExpectedFromForm,
  periodYearlyTotal,
  statusBadgeClass,
  statusLabel,
  typeLabel,
} from "@/lib/incomeSources";
import { cn } from "@/lib/utils";

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
              = {formatMoney(yearly, currency, true)}/yr
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
                {formatMoney(source.expected_earning.monthly, currency, true)}/mo
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-mono text-primary">
                {formatMoney(source.expected_earning.yearly, currency, true)}/yr
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
                    <th className="px-3 py-2 font-normal text-muted-foreground text-right">Forecast</th>
                    <th className="px-3 py-2 font-normal text-muted-foreground text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.periods.map((p, i) => (
                    <tr key={p.period_index} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2">Year {p.period_index}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.calendar_label}</td>
                      <td className="px-3 py-2 text-right font-mono text-primary">
                        {p.monthly_income > 0
                          ? `${formatMoney(p.monthly_income, currency, true)}/mo`
                          : formatMoney(p.yearly_total, currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {formatMoney(timeline.cumulative_forecast[i]?.cumulative || 0, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No forecast years added yet.</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs">
            <span>
              Invested: <strong className="font-mono">{formatMoney(actuals.total_invested, currency)}</strong>
            </span>
            <span>
              Earned: <strong className="font-mono text-primary">{formatMoney(actuals.total_revenue, currency)}</strong>
            </span>
            <span>
              Net:{" "}
              <strong className={cn("font-mono", actuals.net >= 0 ? "text-primary" : "text-destructive")}>
                {formatMoney(actuals.net, currency)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function IncomeSourcesPanel({ orgId, projects, onProjectCreated, onRefresh, currency = "BDT" }) {
  const orgCurrency = defaultFinanceCurrency(currency);
  const [items, setItems] = useState([]);
  const [expectedTotals, setExpectedTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/finance/income-sources`)
      .then((r) => {
        setItems(r.data.sources || []);
        setExpectedTotals(r.data.expectedTotals || null);
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl text-left space-y-4">
      {items.length > 0 && expectedTotals ? (
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Total expected — all income sources</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sum of <strong>Expected earning</strong> on each source.{" "}
              {expectedTotals.includedSourceCount} of {expectedTotals.totalSourceCount} source
              {expectedTotals.totalSourceCount !== 1 ? "s" : ""} counted
              {expectedTotals.missingCount > 0
                ? ` · ${expectedTotals.missingCount} not set yet`
                : ""}
              .
            </p>
          </div>
          {expectedTotals.buckets?.length > 0 ? (
            <div className="space-y-4">
              {expectedTotals.buckets.map((bucket) => (
                <div key={bucket.currency}>
                  {expectedTotals.buckets.length > 1 ? (
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono mb-2">
                      {bucket.currency} · {bucket.sourceCount} source
                      {bucket.sourceCount !== 1 ? "s" : ""}
                    </div>
                  ) : null}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <StatCard
                      label="Per month"
                      value={formatMoney(bucket.monthlyTotal, bucket.currency)}
                      variant="income"
                      sub={
                        expectedTotals.buckets.length === 1
                          ? `All ${bucket.sourceCount} source(s)`
                          : `${bucket.currency} subtotal`
                      }
                    />
                    <StatCard
                      label="Per year"
                      value={formatMoney(bucket.yearlyTotal, bucket.currency)}
                      variant="income"
                      sub="Combined yearly equivalent"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set <strong>Expected earning</strong> on each income source to see the combined total
              here.
            </p>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Income sources
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ventures you are building — investment plan, when revenue starts, and yearly forecasts.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4" /> Add source
        </button>
      </div>

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
                    <div className="font-mono font-medium mt-0.5">{formatMoney(planned, cur)}</div>
                    {planned > 0 ? (
                      <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-500/80" style={{ width: `${investPct}%` }} />
                      </div>
                    ) : null}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Spent {formatMoney(invested, cur, true)}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground">Actual revenue</div>
                    <div className="font-mono font-medium text-primary mt-0.5">{formatMoney(earned, cur)}</div>
                  </div>
                  <div className="rounded-md bg-muted/25 px-2.5 py-2">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Forecast (all years)
                    </div>
                    <div className="font-mono font-medium mt-0.5">{formatMoney(forecastTotal, cur)}</div>
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
                ≈ {formatMoney(formExpected.monthly, form.currency || orgCurrency, true)}/month ·{" "}
                {formatMoney(formExpected.yearly, form.currency || orgCurrency, true)}/year
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
