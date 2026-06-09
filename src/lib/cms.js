export const CONTENT_PRIORITIES = ["low", "medium", "high", "urgent"];

export const CONTENT_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const CONTENT_PRIORITY_CLASS = {
  low: "bg-muted/40 text-muted-foreground border-border",
  medium: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  high: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};

export const formatCmsDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const formatCmsDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatNumber = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

export const statusBadgeStyle = (color) => ({
  borderColor: `${color}55`,
  backgroundColor: `${color}18`,
  color: color || "#94a3b8",
});
