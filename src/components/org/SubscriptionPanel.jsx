import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { EmptyState } from "@/components/org/EmptyState";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";

let moneyCanSee = true;
function mfmt(value, currency = "BDT", compact = false) {
  return formatMoneySensitive(value, currency, moneyCanSee, compact);
}
import { partitionsForExpense, partitionOptionLabel } from "@/lib/partitionScopes";
import { categoriesForType } from "@/lib/financeCategories";
import { CategoryColumn } from "@/components/org/CategoryManager";
import { SubscriptionDashboard } from "@/components/org/SubscriptionDashboard";
import { monthlyEquivalent } from "@/lib/subscriptionSchedule";
import { cn } from "@/lib/utils";

const INTERVALS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom (days)" },
];

const today = () => new Date().toISOString().slice(0, 10);

const intervalLabel = (sub) => {
  const hit = INTERVALS.find((i) => i.value === sub.billing_interval);
  if (sub.billing_interval === "custom") return `Every ${sub.custom_interval_days || 30} days`;
  return hit?.label || sub.billing_interval;
};

function dueBadge(days) {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: "bg-destructive/20 text-destructive border-destructive/40" };
  if (days === 0) return { text: "Due today", className: "bg-amber-500/20 text-amber-200 border-amber-500/40" };
  if (days <= 7) return { text: `In ${days}d`, className: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30" };
  return { text: formatDate(new Date(Date.now() + days * 86400000).toISOString()), className: "bg-muted/40 text-muted-foreground border-border" };
}

export function SubscriptionPanel({
  orgId,
  accounts,
  projects,
  categories,
  currency,
  hasAccounts,
  partitionsForAccount,
  onRefresh,
  canSeeExactAmounts = true,
  canWrite = true,
}) {
  moneyCanSee = canSeeExactAmounts;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [lastProcessed, setLastProcessed] = useState([]);
  const [lifecycleFilter, setLifecycleFilter] = useState("all");

  const subscriptionCategories = categoriesForType(categories, "subscription");
  const defaultCategory =
    subscriptionCategories.find((c) => c.name === "SaaS")?.name ||
    subscriptionCategories[0]?.name ||
    "Other subscription";

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: defaultCategory,
    account_id: "",
    partition_id: "",
    project_id: "",
    billing_interval: "monthly",
    custom_interval_days: "30",
    next_due_date: today(),
    auto_deduct: true,
    is_active: true,
    lifecycle: "running",
    planned_start_date: "",
    notes: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/finance/subscriptions`)
      .then((r) => {
        setItems(r.data.subscriptions || []);
        setLastProcessed(r.data.processed || []);
        const charged = (r.data.processed || []).filter((p) => p.status === "charged");
        if (charged.length) {
          toast.info(`Auto-charged ${charged.length} subscription(s)`, { theme: "dark" });
          onRefresh?.();
        }
        const failed = (r.data.processed || []).filter((p) => p.status === "insufficient_balance");
        if (failed.length) {
          toast.warn(`${failed.length} due but insufficient balance`, { theme: "dark" });
        }
      })
      .catch(() => toast.error("Failed to load subscriptions", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, [orgId, onRefresh]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    setForm((f) => ({ ...f, category: f.category || defaultCategory }));
  }, [defaultCategory, modalOpen]);

  const resetForm = () => ({
    name: "",
    amount: "",
    category: defaultCategory,
    account_id: accounts[0]?._id || "",
    partition_id: "",
    project_id: "",
    billing_interval: "monthly",
    custom_interval_days: "30",
    next_due_date: today(),
    auto_deduct: true,
    is_active: true,
    lifecycle: "running",
    planned_start_date: "",
    notes: "",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(resetForm());
    setModalOpen(true);
  };

  const openEdit = (sub) => {
    setEditingId(sub._id);
    setForm({
      name: sub.name,
      amount: String(sub.amount),
      category: sub.category,
      account_id: sub.account_id?._id || sub.account_id,
      partition_id: sub.partition_id?._id || sub.partition_id,
      project_id: sub.project_id?._id || sub.project_id || "",
      billing_interval: sub.billing_interval,
      custom_interval_days: String(sub.custom_interval_days || 30),
      next_due_date: sub.next_due_date ? new Date(sub.next_due_date).toISOString().slice(0, 10) : today(),
      auto_deduct: sub.auto_deduct,
      is_active: sub.is_active,
      lifecycle: sub.lifecycle || "running",
      planned_start_date: sub.planned_start_date
        ? new Date(sub.planned_start_date).toISOString().slice(0, 10)
        : "",
      notes: sub.notes || "",
    });
    setModalOpen(true);
  };

  const markRunning = async (sub) => {
    try {
      await api.patch(`/api/v1/org/${orgId}/finance/subscriptions/${sub._id}`, {
        lifecycle: "running",
        auto_deduct: true,
        next_due_date: sub.next_due_date || today(),
      });
      toast.success("Now running — will auto-charge on due dates", { theme: "dark" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!form.name.trim() || !amt || amt <= 0) {
      toast.error("Name and amount required", { theme: "dark" });
      return;
    }
    if (!form.account_id || !form.partition_id) {
      toast.error("Select account and partition", { theme: "dark" });
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      amount: amt,
      category: form.category,
      account_id: form.account_id,
      partition_id: form.partition_id,
      project_id: form.project_id || undefined,
      billing_interval: form.billing_interval,
      custom_interval_days: form.billing_interval === "custom" ? Number(form.custom_interval_days) : undefined,
      next_due_date: form.next_due_date,
      auto_deduct: form.lifecycle === "planned" ? false : form.auto_deduct,
      is_active: form.is_active,
      lifecycle: form.lifecycle,
      planned_start_date: form.lifecycle === "planned" ? form.planned_start_date || undefined : undefined,
      notes: form.notes,
    };

    try {
      if (editingId) {
        await api.patch(`/api/v1/org/${orgId}/finance/subscriptions/${editingId}`, payload);
        toast.success("Subscription updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/finance/subscriptions`, payload);
        toast.success("Subscription added", { theme: "dark" });
      }
      setModalOpen(false);
      load();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subscription?")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/finance/subscriptions/${id}`);
      toast.success("Deleted", { theme: "dark" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleCharge = async (id) => {
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/finance/subscriptions/${id}/charge`);
      toast.success("Charged and next date advanced", { theme: "dark" });
      load();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Charge failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (sub) => {
    try {
      await api.patch(`/api/v1/org/${orgId}/finance/subscriptions/${sub._id}`, { is_active: !sub.is_active });
      load();
    } catch {
      toast.error("Failed to update", { theme: "dark" });
    }
  };

  const daysUntil = (dateStr) => {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((due - t) / 86400000);
  };

  const { runningBurn, plannedBurn } = useMemo(() => {
    let running = 0;
    let planned = 0;
    for (const s of items.filter((x) => x.is_active)) {
      const m = monthlyEquivalent(s.amount, s.billing_interval, s.custom_interval_days);
      if (s.lifecycle === "planned") planned += m;
      else running += m;
    }
    return { runningBurn: running, plannedBurn: planned };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (lifecycleFilter === "all") return items;
    return items.filter((s) => (s.lifecycle || "running") === lifecycleFilter);
  }, [items, lifecycleFilter]);

  if (!hasAccounts) {
    return (
      <EmptyState
        icon={Calendar}
        title="Subscriptions"
        description="Create a finance account first, then track recurring bills with due dates and optional auto-deduction."
      />
    );
  }

  return (
    <div className="space-y-6 text-left">
      <SubscriptionDashboard orgId={orgId} currency={currency} />

      <CategoryColumn
        title="Subscription categories"
        type="subscription"
        items={subscriptionCategories}
        orgId={orgId}
        onRefresh={onRefresh}
        accent="text-[#a78bfa]"
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Track recurring costs (hosting, tools, etc.). On the due date, opening this tab runs auto-deduct from the
            partition you pick — or use Charge now anytime.
          </p>
          {items.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Running ~{mfmt(runningBurn, currency)}/mo
              {plannedBurn > 0 ? ` · Planned ~${mfmt(plannedBurn, currency)}/mo` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { id: "all", label: "All" },
            { id: "running", label: "Running" },
            { id: "planned", label: "Planned" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLifecycleFilter(f.id)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition",
                lifecycleFilter === f.id
                  ? "bg-[#a78bfa]/20 border-[#a78bfa]/40 text-[#a78bfa]"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add subscription
          </button>
        </div>
      </div>

      {lastProcessed.length > 0 ? (
        <div className="text-xs rounded-lg border border-border bg-muted/20 px-3 py-2 space-y-1">
          {lastProcessed.map((p) => (
            <div key={p.subscriptionId} className="flex justify-between gap-2">
              <span>{p.name}</span>
              <span
                className={cn(
                  p.status === "charged" && "text-primary",
                  p.status === "insufficient_balance" && "text-amber-400",
                  p.status === "failed" && "text-destructive"
                )}
              >
                {p.status === "charged" ? "Auto-charged" : p.message || p.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No subscriptions"
          description="Add Netflix, hosting, domain renewals — set amount, billing cycle, and next due date."
          action={
            <button type="button" onClick={openCreate} className="ww-btn-primary text-sm">
              Add first subscription
            </button>
          }
          className="py-12"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((sub) => {
            const isPlanned = sub.lifecycle === "planned";
            const days = isPlanned ? null : daysUntil(sub.next_due_date);
            const badge = days != null ? dueBadge(days) : null;
            return (
              <article
                key={sub._id}
                className={cn(
                  "rounded-xl border p-4 bg-card",
                  !sub.is_active && "opacity-60",
                  isPlanned && "border-[#a78bfa]/30 bg-[#a78bfa]/5",
                  !isPlanned && days <= 0 && sub.is_active && "border-amber-500/40"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{sub.name}</h3>
                      <span
                        className={cn(
                          "text-[9px] uppercase px-1.5 py-0.5 rounded border",
                          isPlanned
                            ? "border-[#a78bfa]/40 text-[#a78bfa] bg-[#a78bfa]/10"
                            : "border-primary/30 text-primary bg-primary/10"
                        )}
                      >
                        {isPlanned ? "Planned" : "Running"}
                      </span>
                    </div>
                    <p className="text-lg font-mono text-destructive mt-0.5">−{mfmt(sub.amount, currency)}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      ~{mfmt(monthlyEquivalent(sub.amount, sub.billing_interval, sub.custom_interval_days), currency)}/mo
                    </p>
                  </div>
                  {isPlanned ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md border border-[#a78bfa]/40 text-[#a78bfa] uppercase tracking-wide">
                      {sub.planned_start_date ? `From ${formatDate(sub.planned_start_date)}` : "Not started"}
                    </span>
                  ) : badge ? (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wide", badge.className)}>
                      {days <= 7 ? badge.text : formatDate(sub.next_due_date)}
                    </span>
                  ) : null}
                </div>

                <dl className="text-xs text-muted-foreground space-y-1 mb-3">
                  <div className="flex justify-between">
                    <dt>Cycle</dt>
                    <dd className="text-foreground">{intervalLabel(sub)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>From</dt>
                    <dd className="text-foreground truncate max-w-[160px]">
                      {sub.account_id?.name} / {sub.partition_id?.name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Auto-deduct</dt>
                    <dd className={sub.auto_deduct ? "text-primary" : "text-muted-foreground"}>
                      {sub.auto_deduct ? "On" : "Off"}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-1.5">
                  {isPlanned ? (
                    <button
                      type="button"
                      onClick={() => markRunning(sub)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30 hover:bg-[#a78bfa]/25 inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Start running
                    </button>
                  ) : (
                  <button
                    type="button"
                    disabled={submitting || !sub.is_active}
                    onClick={() => handleCharge(sub._id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    Charge now
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleActive(sub)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-1"
                  >
                    {sub.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {sub.is_active ? "Pause" : "Resume"}
                  </button>
                  <button type="button" onClick={() => openEdit(sub)} className="p-1.5 rounded-lg border border-border hover:bg-muted">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(sub._id)} className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit subscription" : "Add subscription"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Status">
            <SelectInput
              value={form.lifecycle}
              onChange={(e) => {
                const lifecycle = e.target.value;
                setForm({
                  ...form,
                  lifecycle,
                  auto_deduct: lifecycle === "planned" ? false : form.auto_deduct,
                });
              }}
            >
              <option value="running">Running — live cost, can auto-charge</option>
              <option value="planned">Planned — expected later, no charges yet</option>
            </SelectInput>
          </Field>
          {form.lifecycle === "planned" ? (
            <Field label="Planned start (optional)">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={form.planned_start_date}
                onChange={(e) => setForm({ ...form, planned_start_date: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Name">
            <input
              className="ww-input ww-input-md w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Vercel, Netflix"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="ww-input ww-input-md w-full font-mono"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <SelectInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {subscriptionCategories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Account">
              <SelectInput
                required
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value, partition_id: "" })}
              >
                <option value="">Select…</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Partition (deduct from)">
              <SelectInput
                required
                value={form.partition_id}
                onChange={(e) => setForm({ ...form, partition_id: e.target.value })}
              >
                <option value="">Select…</option>
                {partitionsForExpense(partitionsForAccount[form.account_id] || [], false).map((p) => (
                  <option key={p._id} value={p._id}>
                    {partitionOptionLabel(p, {
                      showBalance: true,
                      currency,
                      formatMoney: (v, c, compact) => mfmt(v, c || currency, compact),
                    })}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Billing">
              <SelectInput
                value={form.billing_interval}
                onChange={(e) => setForm({ ...form, billing_interval: e.target.value })}
              >
                {INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {form.billing_interval === "custom" ? (
              <Field label="Every (days)">
                <input
                  type="number"
                  min="1"
                  className="ww-input ww-input-md w-full"
                  value={form.custom_interval_days}
                  onChange={(e) => setForm({ ...form, custom_interval_days: e.target.value })}
                />
              </Field>
            ) : (
              <Field label="Next due date">
                <input
                  type="date"
                  required
                  className="ww-input ww-input-md w-full"
                  value={form.next_due_date}
                  onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                />
              </Field>
            )}
          </div>
          {form.billing_interval === "custom" ? (
            <Field label="Next due date">
              <input
                type="date"
                required
                className="ww-input ww-input-md w-full"
                value={form.next_due_date}
                onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Project (optional)">
            <SelectInput value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          {form.lifecycle === "running" ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_deduct}
                onChange={(e) => setForm({ ...form, auto_deduct: e.target.checked })}
                className="rounded border-border"
              />
              Auto-deduct on due date (when you open Finance → Subscriptions)
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">
              Planned subscriptions appear in forecasts but won&apos;t charge until you mark them Running.
            </p>
          )}
          {editingId ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-border"
              />
              Active
            </label>
          ) : null}
          <Field label="Notes">
            <input
              className="ww-input ww-input-md w-full"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="text-sm px-4 py-2 rounded-lg border border-border">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="ww-btn-primary text-sm inline-flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
