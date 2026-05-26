import { STATUS_META, normalizeTaskStatus } from "@/lib/taskWorkflow";
import { cn } from "@/lib/utils";

export function TaskStatusBadge({ status, className }) {
  const key = normalizeTaskStatus(status);
  const meta = STATUS_META[key] || STATUS_META.Backlog;
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded border whitespace-nowrap",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export default TaskStatusBadge;
