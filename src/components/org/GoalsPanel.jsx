import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, ShoppingBag, Target, Trash2, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import api from "@/ApiInception";
import { Field, SelectInput } from "@/components/org/Field";
import { EmptyState } from "@/components/org/EmptyState";
import { formatMoneySensitive, formatDateTime } from "@/lib/formatMoney";
import {
  clearStoredGoals,
  goalAllocated,
  goalId,
  goalReserved,
  goalSettled,
  normalizeGoal,
  readStoredGoals,
  reservedByPartition,
} from "@/lib/goals";
import { effectiveScope } from "@/lib/partitionScopes";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const goalTypeLabel = (type) => (type === "personal" ? "Personal" : "Company");
const GOAL_PRIORITIES = ["high", "medium", "low", "later"];
const GOAL_PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
  later: "Later",
};
const GOAL_PRIORITY_BADGE = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
  medium: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/35",
  low: "bg-amber-500/15 text-amber-200 border-amber-500/35",
  later: "bg-muted/40 text-muted-foreground border-border",
};
const goalPriorityRank = (priority) => GOAL_PRIORITIES.indexOf(priority || "medium");


export function GoalsPanel({
  orgId,
  accounts,
  currency = "BDT",
  canSeeExactAmounts = true,
  canWrite = true,
  onRefresh,
  onGoalsChange,
}) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goalForm, setGoalForm] = useState({
    title: "",
    target: "",
    type: "company",
    priority: "medium",
    expectedAt: "",
  });
  const [allocationForm, setAllocationForm] = useState({});
  const [settleForm, setSettleForm] = useState({});
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fmt = (value, cur = currency) => formatMoneySensitive(value, cur, canSeeExactAmounts);

  const scopedPartitions = useMemo(() => {
    const list = [];
    for (const account of accounts || []) {
      for (const partition of account.partitions || []) {
        list.push({
          accountId: account._id,
          accountName: account.name,
          partitionId: partition._id,
          partitionName: partition.name,
          scope: effectiveScope(partition),
          balance: Number(partition.balance || 0),
          currency: account.currency || currency,
        });
      }
    }
    return list;
  }, [accounts, currency]);

  const applyGoals = useCallback(
    (incoming) => {
      const normalized = (incoming || []).map(normalizeGoal).filter(Boolean);
      setGoals(normalized);
      onGoalsChange?.(normalized);
    },
    [onGoalsChange]
  );

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/org/${orgId}/finance/goals`);
      let incoming = (response.data.goals || []).map(normalizeGoal);
      if (!incoming.length) {
        const local = readStoredGoals(orgId);
        if (local.length && canWrite) {
          for (const g of local) {
            const created = await api.post(`/api/v1/org/${orgId}/finance/goals`, {
              title: g.title,
              target: g.target,
              type: g.type,
              priority: g.priority || "medium",
              currency: g.currency || currency,
              expected_at: g.expectedAt || undefined,
            });
            const newGoalId = created.data.goal?.id;
            if (!newGoalId) continue;
            for (const alloc of [...(g.allocations || [])].reverse()) {
              if (!alloc.partitionId || !alloc.accountId) continue;
              await api.post(`/api/v1/org/${orgId}/finance/goals/${newGoalId}/allocations`, {
                account_id: alloc.accountId,
                partition_id: alloc.partitionId,
                amount: alloc.amount,
              });
            }
          }
          clearStoredGoals(orgId);
          const again = await api.get(`/api/v1/org/${orgId}/finance/goals`);
          incoming = (again.data.goals || []).map(normalizeGoal);
          toast.info("Goals moved from browser storage to database.", { theme: "dark" });
        }
      }
      applyGoals(incoming);
    } catch {
      toast.error("Failed to load goals", { theme: "dark" });
      applyGoals([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, currency, canWrite, applyGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const reservedMap = useMemo(() => reservedByPartition(goals), [goals]);

  const addGoal = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const title = goalForm.title.trim();
    const target = Number(goalForm.target);
    if (!title || !target || target <= 0) {
      toast.error("Goal title and target amount are required.", { theme: "dark" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title,
        target,
        type: goalForm.type,
        priority: goalForm.priority || "medium",
        currency,
        expected_at: goalForm.expectedAt || undefined,
      };
      if (editingGoalId) {
        await api.patch(`/api/v1/org/${orgId}/finance/goals/${editingGoalId}`, payload);
        toast.success("Goal updated", { theme: "dark" });
        setEditingGoalId(null);
      } else {
        await api.post(`/api/v1/org/${orgId}/finance/goals`, payload);
        toast.success("Goal added", { theme: "dark" });
      }
      setGoalForm({ title: "", target: "", type: "company", priority: "medium", expectedAt: "" });
      await loadGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save goal", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const getGoalAllocated = (goal) => goalAllocated(goal);
  const getGoalSettled = (goal) => goalSettled(goal);
  const getGoalReserved = (goal) => goalReserved(goal);

  const addAllocation = async (goal, e) => {
    e.preventDefault();
    if (!canWrite) return;
    const gid = goalId(goal);
    const form = allocationForm[gid] || {};
    const amount = Number(form.amount);
    const partitionId = form.partitionId;
    if (!partitionId || !amount || amount <= 0) {
      toast.error("Pick a partition and amount.", { theme: "dark" });
      return;
    }
    const partition = scopedPartitions.find((p) => p.partitionId === partitionId);
    if (!partition) {
      toast.error("Partition not found.", { theme: "dark" });
      return;
    }
    const allowedScopes = goal.type === "personal" ? ["owner", "excluded"] : ["business"];
    if (!allowedScopes.includes(partition.scope)) {
      toast.error("This partition is not allowed for the selected goal type.", { theme: "dark" });
      return;
    }
    const alreadyReserved = Number(reservedMap[partition.partitionId] || 0);
    const available = Math.max(0, Number(partition.balance || 0) - alreadyReserved);
    if (amount > available) {
      toast.error(
        `Not enough free money in "${partition.partitionName}". Available: ${fmt(
          available,
          partition.currency
        )} (balance ${fmt(partition.balance, partition.currency)} minus already allocated ${fmt(
          alreadyReserved,
          partition.currency
        )}).`,
        { theme: "dark" }
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/finance/goals/${gid}/allocations`, {
        account_id: partition.accountId,
        partition_id: partition.partitionId,
        amount,
      });
      setAllocationForm((prev) => ({ ...prev, [gid]: { partitionId: "", amount: "" } }));
      await loadGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to allocate", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const editGoal = (goal) => {
    setEditingGoalId(goalId(goal));
    setGoalForm({
      title: goal.title,
      target: String(goal.target),
      type: goal.type,
      priority: goal.priority || "medium",
      expectedAt: goal.expectedAt || "",
    });
  };

  const deleteGoal = async (goal) => {
    if (!window.confirm(`Delete goal "${goal.title}" and all allocation logs?`)) return;
    const gid = goalId(goal);
    try {
      await api.delete(`/api/v1/org/${orgId}/finance/goals/${gid}`);
      if (editingGoalId === gid) {
        setEditingGoalId(null);
        setGoalForm({ title: "", target: "", type: "company", priority: "medium", expectedAt: "" });
      }
      await loadGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete goal", { theme: "dark" });
    }
  };

  const deleteAllocation = async (goal, allocation) => {
    if (!window.confirm("Delete this allocation log?")) return;
    try {
      await api.delete(
        `/api/v1/org/${orgId}/finance/goals/${goalId(goal)}/allocations/${allocation.id}`
      );
      await loadGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete allocation", { theme: "dark" });
    }
  };

  const settleGoal = async (goal, e) => {
    e.preventDefault();
    e.stopPropagation();
    const gid = goalId(goal);
    const form = settleForm[gid] || {};
    const amount = Number(form.amount || goal.target);
    const status = form.status || "bought";
    const reserved = getGoalReserved(goal);
    if (!amount || amount <= 0) {
      toast.error("Settlement amount must be greater than zero.", { theme: "dark" });
      return;
    }
    if (amount > reserved) {
      toast.error("Settlement amount cannot exceed reserved money.", { theme: "dark" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/api/v1/org/${orgId}/finance/goals/${gid}/settle`, {
        amount,
        status,
      });
      const applied = response.data.settledAmount ?? amount;
      setSettleForm((prev) => ({ ...prev, [gid]: { open: false, amount: "", status: "bought" } }));
      toast.success(`Settled ${fmt(applied, goal.currency)} and recorded as expense.`, { theme: "dark" });
      await loadGoals();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to settle goal", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditAllocation = (goal, allocation) => {
    setEditingAllocation({
      goalId: goalId(goal),
      allocationId: allocation.id,
      amount: String(allocation.amount),
    });
  };

  const saveAllocationEdit = async (goal, allocation) => {
    const amount = Number(editingAllocation?.amount);
    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than zero.", { theme: "dark" });
      return;
    }
    try {
      await api.patch(
        `/api/v1/org/${orgId}/finance/goals/${goalId(goal)}/allocations/${allocation.id}`,
        { amount }
      );
      setEditingAllocation(null);
      await loadGoals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update allocation", { theme: "dark" });
    }
  };

  const chartData = useMemo(
    () =>
      goals.map((goal) => ({
        name: goal.title.length > 18 ? `${goal.title.slice(0, 18)}…` : goal.title,
        target: goal.target,
        allocated: getGoalAllocated(goal),
      })),
    [goals]
  );

  const completionData = useMemo(() => {
    const completed = goals.filter((goal) => getGoalAllocated(goal) >= goal.target).length;
    const active = goals.length - completed;
    return [
      { name: "Completed", value: completed, color: "#00ff94" },
      { name: "In progress", value: active, color: "#00d4ff" },
    ];
  }, [goals]);
  const totalGoalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0),
    [goals]
  );
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const rank = goalPriorityRank(a.priority) - goalPriorityRank(b.priority);
      if (rank !== 0) return rank;
      const aExpected = a.expectedAt ? new Date(a.expectedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bExpected = b.expectedAt ? new Date(b.expectedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (aExpected !== bExpected) return aExpected - bExpected;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
  }, [goals]);

  return (
    <div className="space-y-5 text-left">
      <section className="grid sm:grid-cols-2 gap-3">
        <div className="ww-card p-4">
          <div className="text-xs text-muted-foreground">Total goal amount</div>
          <div className="text-2xl font-mono font-semibold mt-1">{fmt(totalGoalTarget, currency)}</div>
        </div>
        <div className="ww-card p-4">
          <div className="text-xs text-muted-foreground">Goals count</div>
          <div className="text-2xl font-mono font-semibold mt-1">{goals.length}</div>
        </div>
      </section>

      <section className="ww-card p-4">
        <h3 className="text-base font-semibold mb-3">{editingGoalId ? "Edit goal" : "Create goal"}</h3>
        <form onSubmit={addGoal} className="grid md:grid-cols-5 gap-3">
          <Field label="Goal name">
            <input
              className="ww-input ww-input-sm w-full"
              placeholder="Buy office workstation"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              disabled={!canWrite}
            />
          </Field>
          <Field label="Target amount">
            <input
              className="ww-input ww-input-sm w-full font-mono"
              type="number"
              min="0"
              step="0.01"
              value={goalForm.target}
              onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
              disabled={!canWrite}
            />
          </Field>
          <Field label="Goal type">
            <SelectInput
              value={goalForm.type}
              onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
              disabled={!canWrite}
            >
              <option value="company">Company</option>
              <option value="personal">Personal</option>
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput
              value={goalForm.priority}
              onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
              disabled={!canWrite}
            >
              {GOAL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {GOAL_PRIORITY_LABELS[p]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Expected to achieve">
            <input
              className="ww-input ww-input-sm w-full"
              type="date"
              value={goalForm.expectedAt}
              onChange={(e) => setGoalForm({ ...goalForm, expectedAt: e.target.value })}
              disabled={!canWrite}
            />
          </Field>
          <div className="flex items-end">
            <button type="submit" className="ww-btn-primary w-full text-sm" disabled={!canWrite}>
              <Plus className="w-4 h-4 mr-1" /> {editingGoalId ? "Save goal" : "Add goal"}
            </button>
          </div>
        </form>
        {editingGoalId ? (
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground hover:underline"
            onClick={() => {
              setEditingGoalId(null);
              setGoalForm({ title: "", target: "", type: "company", priority: "medium", expectedAt: "" });
            }}
          >
            Cancel editing
          </button>
        ) : null}
      </section>

      {goals.length > 0 ? (
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="ww-card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-2">Goal progress chart</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => fmt(value, currency)} />
                  <Bar dataKey="target" name="Target" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="allocated" name="Allocated" fill="#00ff94" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="ww-card p-4">
            <h3 className="text-sm font-semibold mb-2">Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={90}>
                    {completionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a company or personal goal, then allocate money from allowed partitions."
        />
      ) : (
        <ul className="space-y-3">
          {sortedGoals.map((goal) => {
            const allocated = getGoalAllocated(goal);
            const settled = getGoalSettled(goal);
            const reserved = getGoalReserved(goal);
            const pct = goal.target > 0 ? Math.min(100, (reserved / goal.target) * 100) : 0;
            const allowed = scopedPartitions.filter((p) =>
              goal.type === "personal"
                ? p.scope === "owner" || p.scope === "excluded"
                : p.scope === "business"
            );
            const done = allocated >= goal.target;
            const form = allocationForm[goal.id] || {};
            const settle = settleForm[goal.id] || {};

            return (
              <li key={goal.id} className="ww-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{goal.title}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-border text-muted-foreground">
                        {goalTypeLabel(goal.type)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase px-2 py-0.5 rounded border font-semibold",
                          GOAL_PRIORITY_BADGE[goal.priority || "medium"]
                        )}
                      >
                        {GOAL_PRIORITY_LABELS[goal.priority || "medium"]}
                      </span>
                      {done ? (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Target {fmt(goal.target, goal.currency)} · Reserved {fmt(reserved, goal.currency)} · Settled{" "}
                      {fmt(settled, goal.currency)}
                      {goal.expectedAt ? ` · Expected ${goal.expectedAt}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("text-sm font-mono", done ? "text-primary" : "text-[#00d4ff]")}>
                      {Math.round(pct)}%
                    </div>
                    {canWrite ? (
                      <>
                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground" onClick={() => editGoal(goal)}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded hover:bg-muted text-destructive" onClick={() => deleteGoal(goal)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", done ? "bg-primary" : "bg-[#00d4ff]")} style={{ width: `${pct}%` }} />
                </div>

                <form onSubmit={(e) => addAllocation(goal, e)} className="grid md:grid-cols-4 gap-2">
                  <Field label="From partition">
                    <SelectInput
                      value={form.partitionId || ""}
                      onChange={(e) =>
                        setAllocationForm((prev) => ({
                          ...prev,
                          [goal.id]: { ...(prev[goal.id] || {}), partitionId: e.target.value },
                        }))
                      }
                      disabled={!canWrite}
                    >
                      <option value="">Select partition</option>
                      {allowed.map((p) => (
                        <option key={p.partitionId} value={p.partitionId}>
                          {p.accountName} / {p.partitionName} (available{" "}
                          {fmt(Math.max(0, Number(p.balance || 0) - Number(reservedMap[p.partitionId] || 0)), p.currency)})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Amount">
                    <input
                      className="ww-input ww-input-sm w-full font-mono"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount || ""}
                      onChange={(e) =>
                        setAllocationForm((prev) => ({
                          ...prev,
                          [goal.id]: { ...(prev[goal.id] || {}), amount: e.target.value },
                        }))
                      }
                      disabled={!canWrite}
                    />
                  </Field>
                  <div className="md:col-span-2 flex items-end">
                    <button type="submit" className="ww-btn-outline w-full text-sm inline-flex items-center justify-center gap-1" disabled={!canWrite || submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                      Allocate
                    </button>
                  </div>
                </form>

                {done ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Goal reached. Settle it when purchase/task is done to deduct money from reserved amount.
                      </div>
                      <button
                        type="button"
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1"
                        onClick={() =>
                          setSettleForm((prev) => ({
                            ...prev,
                            [goal.id]: {
                              open: !prev[goal.id]?.open,
                              amount: prev[goal.id]?.amount || String(Math.min(goal.target, reserved)),
                              status: prev[goal.id]?.status || "bought",
                            },
                          }))
                        }
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Settle
                      </button>
                    </div>
                    {settle.open ? (
                      <form onSubmit={(e) => settleGoal(goal, e)} className="grid md:grid-cols-4 gap-2">
                        <Field label="Status">
                          <SelectInput
                            value={settle.status || "bought"}
                            onChange={(e) =>
                              setSettleForm((prev) => ({
                                ...prev,
                                [goal.id]: { ...(prev[goal.id] || {}), status: e.target.value },
                              }))
                            }
                          >
                            <option value="bought">Bought</option>
                            <option value="finished">Finished</option>
                          </SelectInput>
                        </Field>
                        <Field label="Deduct amount">
                          <input
                            className="ww-input ww-input-sm w-full font-mono"
                            type="number"
                            min="0"
                            step="0.01"
                            value={settle.amount || ""}
                            onChange={(e) =>
                              setSettleForm((prev) => ({
                                ...prev,
                                [goal.id]: { ...(prev[goal.id] || {}), amount: e.target.value },
                              }))
                            }
                          />
                        </Field>
                        <div className="md:col-span-2 flex items-end">
                          <button type="submit" className="ww-btn-outline w-full text-sm">
                            Confirm settle (deduct)
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Allocation log</h4>
                  {goal.allocations.length ? (
                    <ul className="space-y-1.5">
                      {goal.allocations.slice(0, 8).map((log) => (
                        <li key={log.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                          <span className="text-muted-foreground">
                            {log.accountName} / {log.partitionName} · {formatDateTime(log.at)}
                          </span>
                          <div className="flex items-center gap-2">
                            {editingAllocation?.goalId === goal.id && editingAllocation?.allocationId === log.id ? (
                              <>
                                <input
                                  className="ww-input ww-input-sm w-24 font-mono"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingAllocation.amount}
                                  onChange={(e) =>
                                    setEditingAllocation((prev) => ({ ...(prev || {}), amount: e.target.value }))
                                  }
                                />
                                <button type="button" className="text-primary hover:underline" onClick={() => saveAllocationEdit(goal, log)}>
                                  Save
                                </button>
                                <button type="button" className="text-muted-foreground hover:underline" onClick={() => setEditingAllocation(null)}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="font-mono text-primary">{fmt(log.amount, log.currency)}</span>
                                {canWrite ? (
                                  <>
                                    <button type="button" className="p-1 rounded hover:bg-muted text-muted-foreground" onClick={() => startEditAllocation(goal, log)}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" className="p-1 rounded hover:bg-muted text-destructive" onClick={() => deleteAllocation(goal, log)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : null}
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No allocations yet.</p>
                  )}
                </div>
                {goal.settlements?.length ? (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Settlement log</h4>
                    <ul className="space-y-1.5">
                      {goal.settlements.slice(0, 8).map((log) => (
                        <li key={log.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                          <span className="text-muted-foreground">
                            {String(log.status || "settled").toUpperCase()} · {formatDateTime(log.at)}
                          </span>
                          <span className="font-mono text-destructive">−{fmt(log.amount, goal.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
