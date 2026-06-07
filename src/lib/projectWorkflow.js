/** Full project lifecycle statuses. */
export const PROJECT_STATUSES = [
  "backlog",
  "planning",
  "pending",
  "in_progress",
  "review",
  "on_hold",
  "completed",
  "delivered",
  "billed",
  "cancelled",
];

export const PROJECT_BOARD_COLUMNS = [
  "backlog",
  "planning",
  "pending",
  "in_progress",
  "review",
  "on_hold",
  "completed",
  "delivered",
  "billed",
];

export const PROJECT_STATUS_LABELS = {
  backlog: "Backlog",
  planning: "Planning",
  pending: "Pending",
  in_progress: "In progress",
  review: "In review",
  on_hold: "On hold",
  completed: "Completed",
  delivered: "Delivered",
  billed: "Billed",
  cancelled: "Cancelled",
  active: "In progress",
  paused: "On hold",
};

export const PROJECT_STATUS_CLASS = {
  backlog: "border-slate-600/40 bg-slate-600/10 text-slate-400",
  planning: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  pending: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  in_progress: "border-primary/40 bg-primary/10 text-primary",
  review: "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]",
  on_hold: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  completed: "border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]",
  delivered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  billed: "border-emerald-600/50 bg-emerald-600/15 text-emerald-200",
  cancelled: "border-border bg-muted/30 text-muted-foreground",
};

export const PROJECT_TYPE_LABELS = {
  product: "Product",
  client_work: "Client work",
  internal: "Internal",
};

export const PROJECT_PRIORITIES = ["high", "medium", "low"];

export const PROJECT_PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PROJECT_PRIORITY_BADGE = {
  high: "bg-red-500/15 text-red-300 border-red-500/35",
  medium: "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/35",
  low: "bg-muted/40 text-muted-foreground border-border",
};

export const PROJECT_PRIORITY_CARD_RING = {
  high: "ring-2 ring-red-500/50 border-red-500/30",
  medium: "ring-1 ring-[#ff6b35]/40 border-border",
  low: "border-border",
};

export const LEGACY_PROJECT_STATUS_MAP = {
  active: "in_progress",
  paused: "on_hold",
  completed: "completed",
};

export const PROJECT_PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function normalizeProjectStatus(status) {
  if (!status) return "pending";
  if (LEGACY_PROJECT_STATUS_MAP[status]) return LEGACY_PROJECT_STATUS_MAP[status];
  if (PROJECT_STATUSES.includes(status)) return status;
  return "pending";
}

export function projectPriorityRank(priority) {
  return PROJECT_PRIORITY_RANK[priority] ?? 1;
}

export function sortProjectsByPriority(projects) {
  return [...projects].sort((a, b) => {
    const pr = projectPriorityRank(a.priority) - projectPriorityRank(b.priority);
    if (pr !== 0) return pr;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

export function formatProjectDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
