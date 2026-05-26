import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { EmptyState } from "@/components/org/EmptyState";
import { LinkedEntityField } from "@/components/org/LinkedEntityField";
import { categoryLabel, categoriesForType } from "@/lib/financeCategories";
import {
  effectiveScope,
  partitionOptionLabel,
  partitionsForExpense,
} from "@/lib/partitionScopes";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionCrudPanel({
  type,
  orgId,
  items,
  accounts,
  projects,
  clients,
  categories = [],
  currency,
  hasAccounts,
  partitionsForAccount,
  onRefresh,
  onManageCategories,
  prefillClientId,
  onClientCreated,
  onProjectCreated,
  incomeSources = [],
  onIncomeSourceCreated,
  canSeeExactAmounts = true,
  canWrite = true,
}) {
  const isIncome = type === "income";
  const fmt = (v) => formatMoneySensitive(v, currency, canSeeExactAmounts);
  const typeCategories = categoriesForType(categories, type);
  const defaultCategory = typeCategories[0]?.name || (isIncome ? "Other income" : "Misc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: defaultCategory,
    account_id: "",
    partition_id: "",
    project_id: "",
    client_id: "",
    income_source_id: "",
    payment_method: "bank",
    payment_date: today(),
    expense_date: today(),
    is_personal: false,
    notes: "",
  });

  const partitionLookup = useMemo(() => {
    const map = {};
    for (const a of accounts) {
      for (const p of a.partitions || []) map[p._id] = p;
    }
    return map;
  }, [accounts]);

  const accountPartitions = partitionsForAccount[form.account_id] || [];
  const eligiblePartitions = useMemo(() => {
    if (isIncome) return accountPartitions;
    return partitionsForExpense(accountPartitions, form.is_personal);
  }, [isIncome, accountPartitions, form.is_personal]);

  const selectedPartition = partitionLookup[form.partition_id];
  const incomeNonBusiness =
    isIncome && selectedPartition && effectiveScope(selectedPartition) !== "business";

  const expenseBalance = Number(selectedPartition?.balance) || 0;
  const expenseAmount = Number(form.amount) || 0;
  const expenseOverBalance = !isIncome && form.partition_id && expenseAmount > expenseBalance;

  const resetForm = () => ({
    amount: "",
    category: defaultCategory,
    account_id: accounts[0]?._id || "",
    partition_id: "",
    project_id: "",
    client_id: isIncome && prefillClientId ? prefillClientId : "",
    income_source_id: "",
    payment_method: "bank",
    payment_date: today(),
    expense_date: today(),
    is_personal: false,
    notes: "",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(resetForm());
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      amount: String(item.amount),
      category: item.category || defaultCategory,
      account_id: item.account_id?._id || item.account_id || "",
      partition_id:
        item.allocations?.[0]?.partition_id?._id ||
        item.allocations?.[0]?.partition_id ||
        item.partition_id?._id ||
        item.partition_id ||
        "",
      project_id: item.project_id?._id || item.project_id || "",
      client_id: item.client_id?._id || item.client_id || "",
      income_source_id: item.income_source_id?._id || item.income_source_id || "",
      payment_method: item.payment_method || "bank",
      payment_date: item.payment_date ? new Date(item.payment_date).toISOString().slice(0, 10) : today(),
      expense_date: item.expense_date ? new Date(item.expense_date).toISOString().slice(0, 10) : today(),
      is_personal: Boolean(item.is_personal),
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/v1/org/${orgId}/finance/${type}/${id}`);
      toast.success("Deleted", { theme: "dark" });
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const setPersonal = (isPersonal) => {
    const nextPartitions = partitionsForExpense(
      partitionsForAccount[form.account_id] || [],
      isPersonal
    );
    const stillValid = nextPartitions.some((p) => p._id === form.partition_id);
    setForm({
      ...form,
      is_personal: isPersonal,
      partition_id: stillValid ? form.partition_id : "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount", { theme: "dark" });
      return;
    }
    if (!form.account_id) {
      toast.error("Select an account", { theme: "dark" });
      return;
    }
    if (!form.category) {
      toast.error("Select a category", { theme: "dark" });
      return;
    }
    if (!isIncome && !form.partition_id) {
      toast.error("Select a partition", { theme: "dark" });
      return;
    }
    if (expenseOverBalance) {
      toast.error("Insufficient partition balance", { theme: "dark" });
      return;
    }

    setSubmitting(true);
    try {
      if (isIncome) {
        const payload = {
          amount: amt,
          category: form.category,
          account_id: form.account_id,
          partition_id: form.partition_id || undefined,
          project_id: form.project_id || undefined,
          client_id: form.client_id || undefined,
          income_source_id: form.income_source_id || undefined,
          payment_method: form.payment_method,
          payment_date: form.payment_date,
          notes: form.notes,
        };
        if (editingId) {
          await api.patch(`/api/v1/org/${orgId}/finance/income/${editingId}`, payload);
        } else {
          await api.post(`/api/v1/org/${orgId}/finance/income`, payload);
        }
      } else {
        const payload = {
          amount: amt,
          category: form.category,
          account_id: form.account_id,
          partition_id: form.partition_id,
          project_id: form.project_id || undefined,
          income_source_id: form.income_source_id || undefined,
          expense_date: form.expense_date,
          is_personal: form.is_personal,
          notes: form.notes,
        };
        if (editingId) {
          await api.patch(`/api/v1/org/${orgId}/finance/expense/${editingId}`, payload);
        } else {
          await api.post(`/api/v1/org/${orgId}/finance/expense`, payload);
        }
      }
      toast.success(editingId ? "Updated" : "Saved", { theme: "dark" });
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl text-left">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground capitalize">{type}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isIncome
              ? "Business partitions count toward revenue. Owner/Excluded do not."
              : "Business expenses use Business partitions; personal uses Owner/Excluded."}
          </p>
        </div>
        <div className="flex gap-2">
          {onManageCategories ? (
            <button
              type="button"
              onClick={onManageCategories}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Manage categories
            </button>
          ) : null}
          {canWrite ? (
            <button
              type="button"
              onClick={openCreate}
              disabled={!hasAccounts || typeCategories.length === 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          ) : null}
        </div>
      </div>

      {typeCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-4 mb-4">
          No {type} categories yet.{" "}
          {onManageCategories ? (
            <button type="button" onClick={onManageCategories} className="text-primary underline">
              Create categories
            </button>
          ) : null}{" "}
          before adding transactions.
        </p>
      ) : null}

      {!hasAccounts ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl px-4 py-4">
          Create an account first under the Accounts tab.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          className="py-10"
          title={`No ${type} yet`}
          description={`Add your first ${type} entry.`}
          action={
            <button type="button" onClick={openCreate} className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground">
              Add {type}
            </button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground font-normal">Date</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground font-normal">Category</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground font-normal">Project</th>
                <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground font-normal text-right">Amount</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-border/60 last:border-0 hover:bg-muted/15">
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(isIncome ? item.payment_date : item.expense_date)}
                  </td>
                  <td className="px-4 py-2.5">{categoryLabel(item.category, categories)}</td>
                  <td
                    className={cn(
                      "px-4 py-2.5 truncate max-w-[140px]",
                      item.project_id?.name ? "text-foreground" : "text-amber-500/90"
                    )}
                  >
                    {item.project_id?.name || (isIncome ? "No project" : "—")}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-mono tabular-nums font-medium",
                      isIncome ? "text-primary" : "text-destructive"
                    )}
                  >
                    {isIncome ? "+" : "−"}
                    {fmt(item.amount)}
                  </td>
                  <td className="px-2 py-1.5">
                    {canWrite ? (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={submitting}
                          className="p-2 rounded-md hover:bg-muted text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Edit ${type}` : `Add ${type}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount">
              <input
                className="ww-input ww-input-md w-full font-mono"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <SelectInput
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {typeCategories.length === 0 ? (
                  <option value="">No categories — create first</option>
                ) : (
                  typeCategories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
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
            <Field
              label="Partition"
              hint={
                isIncome
                  ? "Default = account default (usually Business)"
                  : form.is_personal
                    ? "Owner or Excluded only"
                    : "Business partitions only"
              }
            >
              <SelectInput
                required={!isIncome}
                value={form.partition_id}
                onChange={(e) => setForm({ ...form, partition_id: e.target.value })}
              >
                <option value="">{isIncome ? "Default" : "Select…"}</option>
                {eligiblePartitions.map((p) => (
                  <option key={p._id} value={p._id}>
                    {partitionOptionLabel(p, {
                      showBalance: !isIncome,
                      currency,
                      formatMoney: (v, c, compact) => formatMoneySensitive(v, c || currency, canSeeExactAmounts, compact),
                    })}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          {incomeNonBusiness ? (
            <p className="text-xs text-amber-500/90 -mt-2">
              This partition does not count toward business revenue on Overview.
            </p>
          ) : null}
          {isIncome ? (
            <Field label="Payment method">
              <SelectInput
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <LinkedEntityField
              label="Project"
              hint={
                isIncome
                  ? "Links revenue to a build on Overview"
                  : "Optional — links cost to a project"
              }
              value={form.project_id}
              onChange={(project_id) => setForm({ ...form, project_id })}
              items={projects}
              clients={clients}
              placeholder={isIncome ? "— Select project —" : "None"}
              orgId={orgId}
              entityType="project"
              onEntityCreated={onProjectCreated}
              className={cn(isIncome && !form.project_id && "ring-1 ring-amber-500/40")}
            />
            {isIncome ? (
              <LinkedEntityField
                label="Client"
                value={form.client_id}
                onChange={(client_id) => setForm({ ...form, client_id })}
                items={clients}
                placeholder="None"
                orgId={orgId}
                entityType="client"
                onEntityCreated={onClientCreated}
              />
            ) : (
              <Field label="Date">
                <input
                  type="date"
                  className="ww-input ww-input-md w-full"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                />
              </Field>
            )}
          </div>
          <LinkedEntityField
            label="Income source"
            hint="Links cash to a venture — tracks investment vs earnings"
            value={form.income_source_id}
            onChange={(income_source_id) => setForm({ ...form, income_source_id })}
            items={incomeSources}
            placeholder="None"
            orgId={orgId}
            entityType="income_source"
            onEntityCreated={onIncomeSourceCreated}
          />
          {isIncome ? (
            <Field label="Date">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              />
            </Field>
          ) : (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_personal}
                onChange={(e) => setPersonal(e.target.checked)}
              />
              Personal expense (Owner / Excluded partition)
            </label>
          )}
          <Field label="Notes">
            <input
              className="ww-input ww-input-md w-full"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          {expenseOverBalance ? (
            <p className="text-sm text-destructive">Max {fmt(expenseBalance)} in this partition</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting || expenseOverBalance || typeCategories.length === 0}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? "Save changes" : "Save"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
