import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, ShoppingBag, Target, Trash2, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Field, SelectInput } from "@/components/org/Field";
import { EmptyState } from "@/components/org/EmptyState";
import { formatMoneySensitive, formatDateTime } from "@/lib/formatMoney";
import { effectiveScope } from "@/lib/partitionScopes";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ww-goals-v1";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const goalTypeLabel = (type) => (type === "personal" ? "Personal" : "Company");

function readStoredGoals(orgId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed[orgId] || [];
  } catch {
    return [];
  }
}

function writeStoredGoals(orgId, goals) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[orgId] = goals;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // no-op
  }
}

export function GoalsPanel({ orgId, accounts, currency = "BDT", canSeeExactAmounts = true, canWrite = true }) {
  const [goals, setGoals] = useState(() => readStoredGoals(orgId));
  const [goalForm, setGoalForm] = useState({ title: "", target: "", type: "company" });
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

  const persist = (next) => {
    setGoals(next);
    writeStoredGoals(orgId, next);
  };

  const addGoal = (e) => {
    e.preventDefault();
    const title = goalForm.title.trim();
    const target = Number(goalForm.target);
    if (!title || !target || target <= 0) {
      toast.error("Goal title and target amount are required.", { theme: "dark" });
      return;
    }
    if (editingGoalId) {
      const nextGoals = goals.map((goal) => {
        if (goal.id !== editingGoalId) return goal;
        const allocated = getGoalAllocated(goal);
        return {
          ...goal,
          title,
          target,
          type: goalForm.type,
          completedAt: allocated >= target ? goal.completedAt || new Date().toISOString() : null,
        };
      });
      persist(nextGoals);
      setEditingGoalId(null);
    } else {
      const goal = {
        id: crypto.randomUUID(),
        title,
        target,
        type: goalForm.type,
        currency,
        createdAt: new Date().toISOString(),
        allocations: [],
      settlements: [],
        completedAt: null,
      };
      persist([goal, ...goals]);
    }
    setGoalForm({ title: "", target: "", type: "company" });
  };

  const getGoalAllocated = (goal) => goal.allocations.reduce((sum, log) => sum + Number(log.amount || 0), 0);
  const getGoalSettled = (goal) =>
    (goal.settlements || []).reduce((sum, log) => sum + Number(log.amount || 0), 0);
  const getGoalReserved = (goal) => Math.max(0, getGoalAllocated(goal) - getGoalSettled(goal));

  const addAllocation = (goal, e) => {
    e.preventDefault();
    if (!canWrite) return;
    const form = allocationForm[goal.id] || {};
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

    setSubmitting(true);
    const now = new Date().toISOString();
    const nextGoals = goals.map((item) => {
      if (item.id !== goal.id) return item;
      const nextAllocations = [
        {
          id: crypto.randomUUID(),
          amount,
          at: now,
          accountName: partition.accountName,
          partitionName: partition.partitionName,
          partitionId: partition.partitionId,
          currency: partition.currency,
        },
        ...item.allocations,
      ];
      const total = nextAllocations.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      return {
        ...item,
        allocations: nextAllocations,
        completedAt: total >= item.target ? item.completedAt || now : null,
      };
    });
    persist(nextGoals);
    setAllocationForm((prev) => ({ ...prev, [goal.id]: { partitionId: "", amount: "" } }));
    setSubmitting(false);
  };

  const editGoal = (goal) => {
    setEditingGoalId(goal.id);
    setGoalForm({
      title: goal.title,
      target: String(goal.target),
      type: goal.type,
    });
  };

  const deleteGoal = (goal) => {
    if (!window.confirm(`Delete goal "${goal.title}" and all allocation logs?`)) return;
    persist(goals.filter((g) => g.id !== goal.id));
    if (editingGoalId === goal.id) {
      setEditingGoalId(null);
      setGoalForm({ title: "", target: "", type: "company" });
    }
  };

  const deleteAllocation = (goal, allocation) => {
    if (!window.confirm("Delete this allocation log?")) return;
    const nextGoals = goals.map((g) => {
      if (g.id !== goal.id) return g;
      const allocations = g.allocations.filter((log) => log.id !== allocation.id);
      const total = allocations.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      return { ...g, allocations, completedAt: total >= g.target ? g.completedAt : null };
    });
    persist(nextGoals);
  };

  const settleGoal = (goal, e) => {
    e.preventDefault();
    const form = settleForm[goal.id] || {};
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
    const nextGoals = goals.map((g) => {
      if (g.id !== goal.id) return g;
      return {
        ...g,
        settlements: [
          {
            id: crypto.randomUUID(),
            amount,
            status,
            at: new Date().toISOString(),
          },
          ...(g.settlements || []),
        ],
      };
    });
    persist(nextGoals);
    setSettleForm((prev) => ({ ...prev, [goal.id]: { open: false, amount: "", status: "bought" } }));
  };

  const startEditAllocation = (goal, allocation) => {
    setEditingAllocation({
      goalId: goal.id,
      allocationId: allocation.id,
      amount: String(allocation.amount),
    });
  };

  const saveAllocationEdit = (goal, allocation) => {
    const amount = Number(editingAllocation?.amount);
    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than zero.", { theme: "dark" });
      return;
    }
    const nextGoals = goals.map((g) => {
      if (g.id !== goal.id) return g;
      const allocations = g.allocations.map((log) =>
        log.id === allocation.id ? { ...log, amount } : log
      );
      const total = allocations.reduce((sum, log) => sum + Number(log.amount || 0), 0);
      return {
        ...g,
        allocations,
        completedAt: total >= g.target ? g.completedAt || new Date().toISOString() : null,
      };
    });
    persist(nextGoals);
    setEditingAllocation(null);
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

  return (
    <div className="space-y-5 text-left">
      <section className="ww-card p-4">
        <h3 className="text-base font-semibold mb-3">{editingGoalId ? "Edit goal" : "Create goal"}</h3>
        <form onSubmit={addGoal} className="grid md:grid-cols-4 gap-3">
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
              setGoalForm({ title: "", target: "", type: "company" });
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

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a company or personal goal, then allocate money from allowed partitions."
        />
      ) : (
        <ul className="space-y-3">
          {goals.map((goal) => {
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
                      {done ? (
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Target {fmt(goal.target, goal.currency)} · Reserved {fmt(reserved, goal.currency)} · Settled{" "}
                      {fmt(settled, goal.currency)}
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
                          {p.accountName} / {p.partitionName} ({fmt(p.balance, p.currency)})
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
