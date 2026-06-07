export const LEARNING_TOPIC_STATUSES = [
  "pending",
  "learning",
  "on_hold",
  "review",
  "completed",
  "archived",
];

export const LEARNING_BOARD_COLUMNS = [
  "pending",
  "learning",
  "on_hold",
  "review",
  "completed",
];

export const LEARNING_TOPIC_STATUS_LABELS = {
  pending: "Pending",
  learning: "Learning",
  on_hold: "On hold",
  review: "Review",
  completed: "Completed",
  archived: "Archived",
  draft: "Pending",
  active: "Learning",
};

export const LEARNING_TOPIC_STATUS_CLASS = {
  pending: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  learning: "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]",
  on_hold: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  review: "border-primary/40 bg-primary/10 text-primary",
  completed: "border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]",
  archived: "border-border bg-muted/30 text-muted-foreground",
  draft: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  active: "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd]",
};

export const LEGACY_LEARNING_STATUS_MAP = {
  draft: "pending",
  active: "learning",
  archived: "archived",
};

export function normalizeLearningTopicStatus(status) {
  if (!status) return "pending";
  if (LEGACY_LEARNING_STATUS_MAP[status]) return LEGACY_LEARNING_STATUS_MAP[status];
  if (LEARNING_TOPIC_STATUSES.includes(status)) return status;
  return "pending";
}

export function formatLearningDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
