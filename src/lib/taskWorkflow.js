export const TASK_STATUSES = [
  "Backlog",
  "In Progress",
  "In Review",
  "Blocked",
  "Done",
  "Cancelled",
];

export const KANBAN_COLUMNS = ["Backlog", "In Progress", "In Review", "Blocked", "Done"];

export const TASK_TYPES = [
  { value: "feature", label: "Feature" },
  { value: "bug", label: "Bug" },
  { value: "chore", label: "Chore" },
  { value: "spike", label: "Spike" },
];

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];

export const LEGACY_STATUS_MAP = {
  Pending: "Backlog",
  "Work In Progress": "In Progress",
  Hold: "Blocked",
  Completed: "Done",
};

export const TASK_TRANSITIONS = {
  Backlog: ["In Progress", "Cancelled"],
  "In Progress": ["In Review", "Blocked", "Backlog", "Cancelled"],
  "In Review": ["Done", "In Progress", "Blocked"],
  Blocked: ["In Progress", "Backlog", "Cancelled"],
  Done: ["In Progress", "Backlog"],
  Cancelled: ["Backlog"],
};

export const STATUS_META = {
  Backlog: {
    label: "Backlog",
    className: "bg-muted/80 text-muted-foreground border-border",
    dot: "#94a3b8",
  },
  "In Progress": {
    label: "In progress",
    className: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30",
    dot: "#00d4ff",
  },
  "In Review": {
    label: "In review",
    className: "bg-[#a78bfa]/15 text-[#a78bfa] border-[#a78bfa]/30",
    dot: "#a78bfa",
  },
  Blocked: {
    label: "Blocked",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "#f87171",
  },
  Done: {
    label: "Done",
    className: "bg-primary/15 text-primary border-primary/30",
    dot: "#00ff94",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-muted/50 text-muted-foreground border-border",
    dot: "#64748b",
  },
};

export const normalizeTaskStatus = (status) => {
  if (!status) return "Backlog";
  if (LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status];
  if (TASK_STATUSES.includes(status)) return status;
  return "Backlog";
};

export const canTransition = (from, to) => {
  const f = normalizeTaskStatus(from);
  const t = normalizeTaskStatus(to);
  if (f === t) return true;
  return (TASK_TRANSITIONS[f] || []).includes(t);
};

export const nextStatuses = (from) => {
  const f = normalizeTaskStatus(from);
  return TASK_TRANSITIONS[f] || [];
};

export const isTaskDone = (status) => normalizeTaskStatus(status) === "Done";

export const taskTypeLabel = (type) =>
  TASK_TYPES.find((t) => t.value === type)?.label || "Feature";
