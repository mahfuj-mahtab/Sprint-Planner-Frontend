export const GOALS_STORAGE_KEY = "ww-goals-v1";

export function goalId(goal) {
  return String(goal?.id || goal?._id || "");
}

export function allocationId(log) {
  return String(log?.id || log?._id || "");
}

export function allocationPartitionId(log) {
  return String(log?.partitionId || log?.partition_id || "");
}

export function normalizeGoal(raw) {
  if (!raw) return null;
  return {
    id: goalId(raw),
    _id: raw._id || raw.id,
    title: raw.title,
    target: Number(raw.target || 0),
    type: raw.type || "company",
    priority: raw.priority || "medium",
    currency: raw.currency || "BDT",
    expectedAt: raw.expectedAt || (raw.expected_at ? new Date(raw.expected_at).toISOString().slice(0, 10) : ""),
    expected_at: raw.expected_at,
    createdAt: raw.createdAt,
    completedAt: raw.completedAt || raw.completed_at || null,
    completed_at: raw.completed_at,
    allocations: (raw.allocations || []).map((log) => ({
      id: allocationId(log),
      _id: log._id || log.id,
      amount: Number(log.amount || 0),
      accountId: String(log.accountId || log.account_id || ""),
      account_id: log.account_id,
      accountName: log.accountName || log.account_name || "",
      account_name: log.account_name,
      partitionId: allocationPartitionId(log),
      partition_id: log.partition_id,
      partitionName: log.partitionName || log.partition_name || "",
      partition_name: log.partition_name,
      currency: log.currency,
      at: log.at,
    })),
    settlements: (raw.settlements || []).map((log) => ({
      id: String(log.id || log._id || ""),
      amount: Number(log.amount || 0),
      status: log.status,
      at: log.at,
    })),
  };
}

/** @deprecated localStorage — used only for one-time migration */
export function readStoredGoals(orgId) {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.[orgId]) ? parsed[orgId] : [];
    return list.map(normalizeGoal).filter(Boolean);
  } catch {
    return [];
  }
}

export function clearStoredGoals(orgId) {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    delete parsed[orgId];
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // no-op
  }
}

export function goalAllocated(goal) {
  return (goal?.allocations || []).reduce((sum, log) => sum + Number(log.amount || 0), 0);
}

export function goalSettled(goal) {
  return (goal?.settlements || []).reduce((sum, log) => sum + Number(log.amount || 0), 0);
}

export function goalReserved(goal) {
  return Math.max(0, goalAllocated(goal) - goalSettled(goal));
}

export function goalRemainingAllocationSlices(goal) {
  const allocations = [...(goal?.allocations || [])].reverse();
  let settledRemaining = goalSettled(goal);
  const remaining = [];
  for (const log of allocations) {
    const amount = Number(log?.amount || 0);
    const partitionId = allocationPartitionId(log);
    if (!partitionId || amount <= 0) continue;
    const consumed = Math.min(settledRemaining, amount);
    settledRemaining -= consumed;
    const available = amount - consumed;
    if (available <= 0) continue;
    remaining.push({
      allocationId: allocationId(log),
      accountId: log.accountId || null,
      partitionId,
      amount: available,
      currency: log.currency,
      accountName: log.accountName,
      partitionName: log.partitionName,
    });
  }
  return remaining;
}

export function reservedByPartition(goals, opts = {}) {
  const { excludeGoalId, excludeAllocationId } = opts;
  const totals = {};
  for (const goal of goals || []) {
    const gid = goalId(goal);
    if (excludeGoalId && gid === excludeGoalId) continue;
    const allocations = (goal.allocations || []).filter(
      (log) =>
        allocationPartitionId(log) &&
        (!excludeAllocationId || allocationId(log) !== excludeAllocationId)
    );
    let settledRemaining = goalSettled(goal);
    for (let i = allocations.length - 1; i >= 0; i -= 1) {
      const log = allocations[i];
      const amount = Number(log.amount || 0);
      if (amount <= 0) continue;
      const settledHere = Math.min(settledRemaining, amount);
      settledRemaining -= settledHere;
      const reservedAmount = amount - settledHere;
      if (reservedAmount <= 0) continue;
      const key = allocationPartitionId(log);
      totals[key] = (totals[key] || 0) + reservedAmount;
    }
  }
  return totals;
}
