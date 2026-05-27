export const GOALS_STORAGE_KEY = "ww-goals-v1";

export function readStoredGoals(orgId) {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.[orgId]) ? parsed[orgId] : [];
  } catch {
    return [];
  }
}

export function writeStoredGoals(orgId, goals) {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[orgId] = goals;
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
    if (!log?.partitionId || amount <= 0) continue;
    const consumed = Math.min(settledRemaining, amount);
    settledRemaining -= consumed;
    const available = amount - consumed;
    if (available <= 0) continue;
    remaining.push({
      allocationId: log.id,
      accountId: log.accountId || null,
      partitionId: log.partitionId,
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
    if (excludeGoalId && goal.id === excludeGoalId) continue;
    const allocations = (goal.allocations || []).filter(
      (log) => log?.partitionId && (!excludeAllocationId || log.id !== excludeAllocationId)
    );
    let settledRemaining = goalSettled(goal);
    // Consume settlements from oldest allocations first, then keep the unconsumed part reserved.
    for (let i = allocations.length - 1; i >= 0; i -= 1) {
      const log = allocations[i];
      const amount = Number(log.amount || 0);
      if (amount <= 0) continue;
      const settledHere = Math.min(settledRemaining, amount);
      settledRemaining -= settledHere;
      const reservedAmount = amount - settledHere;
      if (reservedAmount <= 0) continue;
      const key = String(log.partitionId);
      totals[key] = (totals[key] || 0) + reservedAmount;
    }
  }
  return totals;
}
