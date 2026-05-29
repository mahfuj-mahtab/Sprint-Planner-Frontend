import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Loader2,
  Plus,
  Scale,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "react-toastify";
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
  Legend,
} from "recharts";
import api from "@/ApiInception";
import { Field, SelectInput } from "@/components/org/Field";
import { Modal } from "@/components/org/Modal";
import { StatCard } from "@/components/org/StatCard";
import { formatMoneySensitive } from "@/lib/formatMoney";
import { effectiveScope, scopeLabel } from "@/lib/partitionScopes";
import { reservedByPartition } from "@/lib/goals";
import { debtPrincipalLabel, isDebtLent } from "@/lib/debt";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const today = () => new Date().toISOString().slice(0, 10);

const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  if (!key) return "";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
};

function DebtRecordCard({ debt, fmt, canWrite, submitting, onRepay, onDelete, onDeleteRepayment }) {
  const lent = isDebtLent(debt);
  const pct =
    debt.principal > 0
      ? Math.min(100, ((debt.principal - debt.outstanding) / debt.principal) * 100)
      : 100;

  return (
    <li className="rounded-xl border border-border bg-card/80 p-4 space-y-3 hover:border-border/80 transition">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{debt.counterpartyName}</span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0",
                debt.status === "open"
                  ? "bg-muted/40 text-muted-foreground border-border"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              )}
            >
              {debt.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {debt.accountName} · {debt.partitionName} · {debt.lentAt}
          </p>
          {debt.notes ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{debt.notes}</p>
          ) : null}
          <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", lent ? "bg-violet-500" : "bg-amber-400")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(pct)}% repaid</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p
            className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              lent ? "text-violet-400" : "text-amber-300"
            )}
          >
            {fmt(debt.outstanding)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            of {fmt(debt.principal)} {debtPrincipalLabel(debt.direction)}
          </p>
        </div>
      </div>

      {(debt.repayments || []).length > 0 && (
        <ul className="border-t border-border pt-2 space-y-1 max-h-28 overflow-y-auto">
          {debt.repayments.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-xs gap-2">
              <span className="text-muted-foreground truncate">
                {r.repaidAt} {r.notes ? `· ${r.notes}` : ""}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span
                  className={cn("font-mono tabular-nums", lent ? "text-emerald-400" : "text-destructive")}
                >
                  {lent ? "+" : "−"}
                  {fmt(r.amount)}
                </span>
                {canWrite && (
                  <button
                    type="button"
                    title="Undo repayment"
                    disabled={submitting}
                    onClick={() => onDeleteRepayment(debt, r)}
                    className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="flex flex-wrap gap-2 pt-1">
          {debt.status === "open" && debt.outstanding > 0 && (
            <button
              type="button"
              onClick={() => onRepay(debt)}
              disabled={submitting}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-lg border",
                lent
                  ? "border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
                  : "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
              )}
            >
              {lent ? "They repaid me" : "I repaid them"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(debt)}
            disabled={submitting}
            className="text-xs px-2.5 py-1 rounded-lg text-destructive hover:bg-destructive/10 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      )}
    </li>
  );
}

function DebtDirectionColumn({
  direction,
  debts,
  fmt,
  canWrite,
  hasAccounts,
  submitting,
  onAdd,
  onRepay,
  onDelete,
  onDeleteRepayment,
}) {
  const lent = direction === "lent";
  const openCount = debts.filter((d) => d.status === "open").length;
  const outstanding = debts.reduce((s, d) => s + Number(d.outstanding || 0), 0);
  const principal = debts.reduce((s, d) => s + Number(d.principal || 0), 0);

  return (
    <section
      className={cn(
        "flex flex-col min-h-[420px] rounded-2xl border bg-gradient-to-b p-5",
        lent
          ? "from-violet-500/8 to-transparent border-violet-500/25"
          : "from-amber-500/8 to-transparent border-amber-500/35"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {lent ? (
              <ArrowUpRight className="w-5 h-5 text-violet-400" />
            ) : (
              <ArrowDownLeft className="w-5 h-5 text-amber-300" />
            )}
            <h3 className="text-base font-semibold">{lent ? "I lent" : "I borrowed"}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            {lent
              ? "Money you gave — they owe you. Cash left the partition until repaid."
              : "Money you received — you owe them. Cash entered the partition until you repay."}
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => onAdd(direction)}
            disabled={!hasAccounts}
            className={cn(
              "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50",
              lent
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "border border-amber-500/50 text-amber-100 hover:bg-amber-500/15"
            )}
          >
            <Plus className="w-3.5 h-3.5" /> {lent ? "Lend" : "Borrow"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-background/40 border border-border/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Open</p>
          <p className="font-mono font-semibold tabular-nums">{openCount}</p>
        </div>
        <div className="rounded-lg bg-background/40 border border-border/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Outstanding</p>
          <p
            className={cn(
              "font-mono text-sm font-semibold tabular-nums truncate",
              lent ? "text-violet-400" : "text-amber-300"
            )}
          >
            {fmt(outstanding)}
          </p>
        </div>
        <div className="rounded-lg bg-background/40 border border-border/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ever total</p>
          <p className="font-mono text-sm font-semibold tabular-nums truncate">{fmt(principal)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[min(60vh,640px)] pr-1 -mr-1">
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground">No {lent ? "loans given" : "loans taken"} yet</p>
            {canWrite && hasAccounts && (
              <button
                type="button"
                onClick={() => onAdd(direction)}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Add first record
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {debts.map((debt) => (
              <DebtRecordCard
                key={debt.id}
                debt={debt}
                fmt={fmt}
                canWrite={canWrite}
                submitting={submitting}
                onRepay={onRepay}
                onDelete={onDelete}
                onDeleteRepayment={onDeleteRepayment}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function DebtPanel({
  orgId,
  accounts = [],
  goals = [],
  currency = "BDT",
  canSeeExactAmounts = true,
  canWrite = true,
  accessRole = "",
  hasAccounts = false,
  onRefresh,
}) {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({
    totalReceivable: 0,
    totalPayable: 0,
    openCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [repayDebt, setRepayDebt] = useState(null);
  const [createForm, setCreateForm] = useState({
    direction: "lent",
    account_id: "",
    partition_id: "",
    counterparty_name: "",
    amount: "",
    lent_at: today(),
    notes: "",
  });
  const [repayForm, setRepayForm] = useState({ amount: "", repaid_at: today(), notes: "" });

  const fmt = (value, cur = currency) => formatMoneySensitive(value, cur, canSeeExactAmounts);

  const goalReservedMap = useMemo(() => reservedByPartition(goals), [goals]);

  const allPartitions = useMemo(() => {
    const list = [];
    for (const account of accounts) {
      for (const partition of account.partitions || []) {
        const scope = effectiveScope(partition);
        const partitionId = partition._id;
        const reserved = Number(goalReservedMap[partitionId] || 0);
        const balance = Number(partition.balance || 0);
        const available = Math.max(0, balance - reserved);
        list.push({
          accountId: account._id,
          accountName: account.name,
          partitionId,
          partitionName: partition.name,
          scope,
          scopeLabel: scopeLabel(scope),
          balance,
          reserved,
          available,
          currency: account.currency || currency,
        });
      }
    }
    return list;
  }, [accounts, currency, goalReservedMap]);

  const lentDebts = useMemo(() => debts.filter((d) => isDebtLent(d)), [debts]);
  const borrowedDebts = useMemo(() => debts.filter((d) => !isDebtLent(d)), [debts]);

  const analytics = useMemo(() => {
    const totalReceivable = summary.totalReceivable || 0;
    const totalPayable = summary.totalPayable || 0;
    const netPosition = totalReceivable - totalPayable;
    const settledCount = debts.filter((d) => d.status === "settled").length;
    const openLent = lentDebts.filter((d) => d.status === "open").length;
    const openBorrowed = borrowedDebts.filter((d) => d.status === "open").length;
    const principalLent = lentDebts.reduce((s, d) => s + Number(d.principal || 0), 0);
    const principalBorrowed = borrowedDebts.reduce((s, d) => s + Number(d.principal || 0), 0);
    const repaidLent = lentDebts.reduce((s, d) => s + Number(d.repaid || 0), 0);
    const repaidBorrowed = borrowedDebts.reduce((s, d) => s + Number(d.repaid || 0), 0);

    const balancePie =
      totalReceivable + totalPayable > 0
        ? [
            { name: "They owe you", value: totalReceivable, color: "#a78bfa" },
            { name: "You owe", value: totalPayable, color: "#fbbf24" },
          ]
        : [{ name: "No open balance", value: 1, color: "#334155" }];

    const topOutstanding = [...debts]
      .filter((d) => d.status === "open" && Number(d.outstanding) > 0)
      .sort((a, b) => Number(b.outstanding) - Number(a.outstanding))
      .slice(0, 8)
      .map((d) => ({
        name:
          d.counterpartyName.length > 14
            ? `${d.counterpartyName.slice(0, 14)}…`
            : d.counterpartyName,
        outstanding: Number(d.outstanding),
        fill: isDebtLent(d) ? "#a78bfa" : "#fbbf24",
      }));

    const compareBar = [
      { name: "Lent (given)", principal: principalLent, repaid: repaidLent, outstanding: totalReceivable },
      { name: "Borrowed (taken)", principal: principalBorrowed, repaid: repaidBorrowed, outstanding: totalPayable },
    ];

    const monthMap = {};
    for (const debt of debts) {
      for (const r of debt.repayments || []) {
        const key = monthKey(r.repaid_at || r.repaidAt);
        if (!key) continue;
        if (!monthMap[key]) monthMap[key] = { month: key, lent: 0, borrowed: 0 };
        const amt = Number(r.amount || 0);
        if (isDebtLent(debt)) monthMap[key].lent += amt;
        else monthMap[key].borrowed += amt;
      }
    }
    const repaymentTrend = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-8)
      .map((row) => ({
        ...row,
        label: monthLabel(row.month),
      }));

    const recentRepayments = [];
    for (const debt of debts) {
      for (const r of debt.repayments || []) {
        recentRepayments.push({
          id: `${debt.id}-${r.id}`,
          counterparty: debt.counterpartyName,
          direction: debt.direction,
          amount: r.amount,
          date: r.repaid_at || r.repaidAt,
        });
      }
    }
    recentRepayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      netPosition,
      settledCount,
      openLent,
      openBorrowed,
      principalLent,
      principalBorrowed,
      repaidLent,
      repaidBorrowed,
      balancePie,
      topOutstanding,
      compareBar,
      repaymentTrend,
      recentRepayments: recentRepayments.slice(0, 6),
    };
  }, [debts, lentDebts, borrowedDebts, summary]);

  const selectedCreatePartition = useMemo(
    () => allPartitions.find((p) => p.partitionId === createForm.partition_id),
    [allPartitions, createForm.partition_id]
  );

  const repayPartitionAvailable = useMemo(() => {
    if (!repayDebt || isDebtLent(repayDebt)) return null;
    const p = allPartitions.find((x) => x.partitionId === repayDebt.partitionId);
    return p?.available ?? null;
  }, [repayDebt, allPartitions]);

  const loadDebts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/org/${orgId}/finance/debts`);
      setDebts(res.data.debts || []);
      setSummary({
        totalReceivable: res.data.totalReceivable || 0,
        totalPayable: res.data.totalPayable || 0,
        openCount: res.data.openCount || 0,
      });
    } catch {
      toast.error("Failed to load debts", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const openCreate = (direction) => {
    const first = allPartitions[0];
    setCreateForm({
      direction,
      account_id: first?.accountId || "",
      partition_id: first?.partitionId || "",
      counterparty_name: "",
      amount: "",
      lent_at: today(),
      notes: "",
    });
    setCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const amt = Number(createForm.amount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/api/v1/org/${orgId}/finance/debts`, {
        direction: createForm.direction,
        account_id: createForm.account_id,
        partition_id: createForm.partition_id,
        counterparty_name: createForm.counterparty_name,
        amount: amt,
        lent_at: createForm.lent_at,
        notes: createForm.notes,
      });
      toast.success(r.data.message, { theme: "dark" });
      setCreateModal(false);
      await loadDebts();
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    if (!repayDebt) return;
    const amt = Number(repayForm.amount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/api/v1/org/${orgId}/finance/debts/${repayDebt.id}/repayments`, {
        amount: amt,
        repaid_at: repayForm.repaid_at,
        notes: repayForm.notes,
      });
      toast.success(r.data.message, { theme: "dark" });
      setRepayDebt(null);
      await loadDebts();
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (debt) => {
    const lent = isDebtLent(debt);
    const balanceHint =
      debt.outstanding > 0
        ? lent
          ? `Outstanding ${fmt(debt.outstanding)} will return to the partition.`
          : `Outstanding ${fmt(debt.outstanding)} will be removed from the partition.`
        : "";
    if (!window.confirm(`Remove record for ${debt.counterpartyName}? ${balanceHint}`.trim())) {
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.delete(`/api/v1/org/${orgId}/finance/debts/${debt.id}`);
      toast.success(r.data.message, { theme: "dark" });
      await loadDebts();
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRepayment = async (debt, repayment) => {
    if (!window.confirm(`Undo repayment of ${fmt(repayment.amount)}?`)) return;
    setSubmitting(true);
    try {
      const r = await api.delete(
        `/api/v1/org/${orgId}/finance/debts/${debt.id}/repayments/${repayment.id}`
      );
      toast.success(r.data.message, { theme: "dark" });
      await loadDebts();
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const openRepay = (debt) => {
    setRepayForm({
      amount: String(debt.outstanding || ""),
      repaid_at: today(),
      notes: "",
    });
    setRepayDebt(debt);
  };

  const isLentForm = createForm.direction === "lent";

  if (loading) {
    return (
      <div className="flex justify-center py-24 w-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const netVariant =
    analytics.netPosition > 0 ? "income" : analytics.netPosition < 0 ? "expense" : "neutral";

  return (
    <div className="space-y-6 text-left w-full">
      {!canSeeExactAmounts && canWrite && accessRole === "editor" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Editor role: you can add and edit debt records, but exact amounts are hidden (shown as —).
          Only owners and admins see dollar figures.
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-violet-400" />
            Debt dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Track money you lent and borrowed across business or personal partitions. Not income or
            expense — only partition balances change.
          </p>
        </div>
        {canWrite && hasAccounts && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openCreate("lent")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white inline-flex items-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> I lent
            </button>
            <button
              type="button"
              onClick={() => openCreate("borrowed")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/50 text-amber-100 hover:bg-amber-500/15 inline-flex items-center gap-1"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> I borrowed
            </button>
          </div>
        )}
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label="They owe you"
          value={fmt(summary.totalReceivable)}
          sub={`${analytics.openLent} open loan${analytics.openLent === 1 ? "" : "s"}`}
          variant="income"
          className="border-violet-500/25 from-violet-500/15"
        />
        <StatCard
          label="You owe others"
          value={fmt(summary.totalPayable)}
          sub={`${analytics.openBorrowed} open borrow${analytics.openBorrowed === 1 ? "" : "s"}`}
          variant="expense"
          className="border-amber-500/30 from-amber-500/15"
        />
        <StatCard
          label="Net position"
          value={fmt(analytics.netPosition)}
          sub="Receivable minus payable"
          variant={netVariant}
        />
        <StatCard
          label="Total ever lent"
          value={fmt(analytics.principalLent)}
          sub={`${fmt(analytics.repaidLent)} repaid`}
          variant="neutral"
        />
        <StatCard
          label="Total ever borrowed"
          value={fmt(analytics.principalBorrowed)}
          sub={`${fmt(analytics.repaidBorrowed)} repaid`}
          variant="neutral"
        />
        <StatCard
          label="Settled records"
          value={analytics.settledCount}
          sub={`${summary.openCount} still open`}
          variant="balance"
        />
      </section>

      {debts.length > 0 && (
        <section className="grid lg:grid-cols-12 gap-4">
          <div className="ww-card p-4 lg:col-span-3">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-muted-foreground" />
              Open balances
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Who owes whom right now</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.balancePie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {analytics.balancePie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => fmt(value, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {analytics.balancePie.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.name}
                  </span>
                  <span className="font-mono tabular-nums">{fmt(row.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="ww-card p-4 lg:col-span-5">
            <h3 className="text-sm font-semibold mb-1">Lent vs borrowed</h3>
            <p className="text-xs text-muted-foreground mb-3">Principal, repaid, and still outstanding</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.compareBar} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => fmt(value, currency)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="principal" name="Principal" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="repaid" name="Repaid" fill="#00ff94" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ww-card p-4 lg:col-span-4">
            <h3 className="text-sm font-semibold mb-1">Top open balances</h3>
            <p className="text-xs text-muted-foreground mb-3">By counterparty</p>
            {analytics.topOutstanding.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">All settled</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={analytics.topOutstanding}
                    margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => fmt(value, currency)} />
                    <Bar dataKey="outstanding" name="Outstanding" radius={[0, 4, 4, 0]}>
                      {analytics.topOutstanding.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {analytics.repaymentTrend.length > 0 && (
            <div className="ww-card p-4 lg:col-span-8">
              <h3 className="text-sm font-semibold mb-1">Repayments over time</h3>
              <p className="text-xs text-muted-foreground mb-3">Monthly cash returned or paid back</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.repaymentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => fmt(value, currency)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="lent" name="Received (they paid you)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="borrowed" name="Paid (you repaid)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {analytics.recentRepayments.length > 0 && (
            <div className="ww-card p-4 lg:col-span-4">
              <h3 className="text-sm font-semibold mb-3">Recent repayments</h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {analytics.recentRepayments.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 text-xs border-b border-border/60 pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.counterparty}</p>
                      <p className="text-muted-foreground">{row.date?.slice?.(0, 10) || row.date}</p>
                    </div>
                    <span
                      className={cn(
                        "font-mono tabular-nums shrink-0",
                        isDebtLent(row) ? "text-emerald-400" : "text-destructive"
                      )}
                    >
                      {isDebtLent(row) ? "+" : "−"}
                      {fmt(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="grid xl:grid-cols-2 gap-6">
        <DebtDirectionColumn
          direction="lent"
          debts={lentDebts}
          fmt={fmt}
          canWrite={canWrite}
          hasAccounts={hasAccounts}
          submitting={submitting}
          onAdd={openCreate}
          onRepay={openRepay}
          onDelete={handleDeleteDebt}
          onDeleteRepayment={handleDeleteRepayment}
        />
        <DebtDirectionColumn
          direction="borrowed"
          debts={borrowedDebts}
          fmt={fmt}
          canWrite={canWrite}
          hasAccounts={hasAccounts}
          submitting={submitting}
          onAdd={openCreate}
          onRepay={openRepay}
          onDelete={handleDeleteDebt}
          onDeleteRepayment={handleDeleteRepayment}
        />
      </section>

      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title={isLentForm ? "I lent money" : "I borrowed money"}
        description={
          isLentForm
            ? "Cash leaves this partition until they repay you. Goal-reserved money cannot be lent."
            : "Cash enters this partition. You repay from the same partition later."
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Counterparty">
            <input
              className="ww-input w-full"
              required
              placeholder={isLentForm ? "Who owes you?" : "Who lent you?"}
              value={createForm.counterparty_name}
              onChange={(e) => setCreateForm({ ...createForm, counterparty_name: e.target.value })}
            />
          </Field>
          <Field label="Account">
            <SelectInput
              required
              value={createForm.account_id}
              onChange={(e) => {
                const accountId = e.target.value;
                const firstPart = allPartitions.find((p) => p.accountId === accountId);
                setCreateForm({
                  ...createForm,
                  account_id: accountId,
                  partition_id: firstPart?.partitionId || "",
                });
              }}
            >
              <option value="">Select…</option>
              {[...new Set(allPartitions.map((p) => p.accountId))].map((accountId) => {
                const acc = accounts.find((a) => a._id === accountId);
                return (
                  <option key={accountId} value={accountId}>
                    {acc?.name}
                  </option>
                );
              })}
            </SelectInput>
          </Field>
          <Field label="Partition">
            <SelectInput
              required
              value={createForm.partition_id}
              onChange={(e) => setCreateForm({ ...createForm, partition_id: e.target.value })}
            >
              <option value="">Select…</option>
              {allPartitions
                .filter((p) => p.accountId === createForm.account_id)
                .map((p) => (
                  <option key={p.partitionId} value={p.partitionId}>
                    {p.partitionName} ({p.scopeLabel})
                    {isLentForm ? ` — free ${fmt(p.available, p.currency)}` : ""}
                  </option>
                ))}
            </SelectInput>
          </Field>
          {isLentForm && selectedCreatePartition && (
            <p className="text-xs text-muted-foreground -mt-2">
              Balance {fmt(selectedCreatePartition.balance)} · goal reserved{" "}
              {fmt(selectedCreatePartition.reserved)} · available{" "}
              <span className="text-foreground font-medium">
                {fmt(selectedCreatePartition.available)}
              </span>
            </p>
          )}
          <Field label="Amount">
            <input
              className="ww-input w-full font-mono"
              type="number"
              step="0.01"
              min="0"
              max={isLentForm ? selectedCreatePartition?.available : undefined}
              required
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              className="ww-input w-full"
              type="date"
              required
              value={createForm.lent_at}
              onChange={(e) => setCreateForm({ ...createForm, lent_at: e.target.value })}
            />
          </Field>
          <Field label="Notes (optional)">
            <input
              className="ww-input w-full"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : isLentForm ? (
              "Record loan given"
            ) : (
              "Record money borrowed"
            )}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!repayDebt}
        onClose={() => setRepayDebt(null)}
        title={
          repayDebt
            ? isDebtLent(repayDebt)
              ? `Repayment from ${repayDebt.counterpartyName}`
              : `Repayment to ${repayDebt.counterpartyName}`
            : ""
        }
        description="Same account and partition as the original record."
      >
        <form onSubmit={handleRepay} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Outstanding:{" "}
            <span
              className={cn(
                "font-mono",
                isDebtLent(repayDebt) ? "text-violet-400" : "text-amber-300"
              )}
            >
              {fmt(repayDebt?.outstanding)}
            </span>
          </p>
          {!isDebtLent(repayDebt) && repayPartitionAvailable != null && (
            <p className="text-xs text-muted-foreground">
              Free in partition:{" "}
              <span className="font-mono text-foreground">{fmt(repayPartitionAvailable)}</span>
            </p>
          )}
          <Field label={isDebtLent(repayDebt) ? "Amount received" : "Amount paid back"}>
            <input
              className="ww-input w-full font-mono"
              type="number"
              step="0.01"
              min="0"
              max={
                !isDebtLent(repayDebt) && repayPartitionAvailable != null
                  ? Math.min(repayDebt?.outstanding ?? 0, repayPartitionAvailable)
                  : repayDebt?.outstanding
              }
              required
              value={repayForm.amount}
              onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              className="ww-input w-full"
              type="date"
              required
              value={repayForm.repaid_at}
              onChange={(e) => setRepayForm({ ...repayForm, repaid_at: e.target.value })}
            />
          </Field>
          <Field label="Notes (optional)">
            <input
              className="ww-input w-full"
              value={repayForm.notes}
              onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Record repayment"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
