import { toast } from "react-toastify";
import api from "../ApiInception";
import { nextStatuses, normalizeTaskStatus } from "@/lib/taskWorkflow";
import { cn } from "@/lib/utils";

export function TaskStatusSelect({
  value,
  onChange,
  disabled,
  className,
  showAll = false,
}) {
  const current = normalizeTaskStatus(value);
  const options = showAll
    ? ["Pending", "Backlog", "In Progress", "In Review", "Blocked", "Done", "Cancelled"]
    : [current, ...nextStatuses(current)].filter((s, i, arr) => arr.indexOf(s) === i);

  return (
    <select
      value={current}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "text-xs rounded-md border border-border bg-card px-2 py-1 focus:ring-1 focus:ring-primary/40 outline-none",
        className
      )}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export async function patchTaskStatus({ orgId, sprintId, taskId, status, blocked_reason }) {
  if (normalizeTaskStatus(status) === "Blocked" && !blocked_reason?.trim()) {
    const reason = window.prompt("Why is this blocked? (optional but recommended)");
    blocked_reason = reason || "";
  }
  return api.patch(
    `/api/v1/org/sprint/single/task/status/org/${orgId}/sprint/${sprintId}/${taskId}`,
    { status, blocked_reason }
  );
}

export function useTaskStatusChange({ orgId, sprintId, onSuccess }) {
  return async (task, newStatus) => {
    try {
      await patchTaskStatus({
        orgId,
        sprintId,
        taskId: task._id,
        status: newStatus,
        blocked_reason: task.blocked_reason,
      });
      toast.success("Status updated", { theme: "dark" });
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update status", { theme: "dark" });
    }
  };
}
