import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import { convertDate } from "../utils/utils";
import PriorityShow from "./PriorityShow";
import { TaskStatusSelect, patchTaskStatus } from "./TaskStatusSelect";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const toInputDate = (d) => {
  if (!d) return today();
  return new Date(d).toISOString().slice(0, 10);
};

function InlineTitleInput({ value, onChange, onCommit, placeholder, className }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        }
        if (e.key === "Escape") onCommit();
      }}
      placeholder={placeholder}
      className={cn(
        "w-full min-w-[140px] bg-transparent border-0 outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -mx-1 text-foreground",
        className
      )}
    />
  );
}

export function SprintTeamTasks({
  team,
  orgId,
  sprintId,
  sprint,
  canWrite = true,
  onRefresh,
  onEditTask,
  onDeleteTask,
  onOpenFullCreate,
}) {
  const [titleEdits, setTitleEdits] = useState({});
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tasks = team.tasks || [];
  const sprintStart = toInputDate(sprint?.startDate);
  const sprintEnd = toInputDate(sprint?.endDate);

  useEffect(() => {
    const edits = {};
    tasks.forEach((t) => {
      edits[t._id] = t.title;
    });
    setTitleEdits(edits);
  }, [team._id, tasks]);

  const taskPayloadFromExisting = (task, titleOverride) => ({
    name: (titleOverride ?? task.title).trim(),
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    startDate: toInputDate(task.startDate),
    endDate: toInputDate(task.endDate),
    team: team._id,
    members: (task.assignee || []).map((a) => a._id || a),
    featureId: task.feature_id?._id || task.feature_id || "",
  });

  const changeStatus = async (task, newStatus) => {
    try {
      await patchTaskStatus({
        orgId,
        sprintId,
        taskId: task._id,
        status: newStatus,
        blocked_reason: task.blocked_reason,
      });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status", { theme: "dark" });
    }
  };

  const saveTitle = async (task) => {
    const trimmed = (titleEdits[task._id] || "").trim();
    if (!trimmed || trimmed === task.title) return;
    try {
      await api.patch(
        `/api/v1/org/sprint/single/task/edit/org/${orgId}/sprint/${sprintId}/${task._id}`,
        taskPayloadFromExisting(task, trimmed)
      );
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update task", { theme: "dark" });
      setTitleEdits((p) => ({ ...p, [task._id]: task.title }));
    }
  };

  const createTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/team/add/task/org/${orgId}/sprint/${sprintId}`, {
        name: title,
        description: "",
        status: "Backlog",
        priority: "Medium",
        startDate: sprintStart,
        endDate: sprintEnd,
        team: team._id,
        members: [],
      });
      toast.success("Task added", { theme: "dark" });
      setNewTitle("");
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add task", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-x-auto rounded-xl border border-border bg-background/40">
      <table className="w-full text-sm text-left min-w-[720px]">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">Task</th>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">Assignee</th>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">Start</th>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">End</th>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">Status</th>
            <th className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide font-normal">Priority</th>
            <th className="px-4 py-2.5 w-24" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task._id} className="border-b border-border/60 hover:bg-muted/15 group">
              <td className="px-4 py-2.5 font-medium">
                {canWrite ? (
                  <InlineTitleInput
                    value={titleEdits[task._id] ?? task.title}
                    onChange={(v) => setTitleEdits((p) => ({ ...p, [task._id]: v }))}
                    onCommit={() => saveTitle(task)}
                    className="text-sm"
                  />
                ) : (
                  <span className="text-sm">{task.title}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                {task.assignee?.length > 0
                  ? task.assignee.map((a) => a.fullName).join(", ")
                  : "—"}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                {convertDate(task.startDate)}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                {convertDate(task.endDate)}
              </td>
              <td className="px-4 py-2.5">
                {canWrite ? (
                  <TaskStatusSelect
                    value={task.status}
                    onChange={(s) => changeStatus(task, s)}
                    className="max-w-[9rem]"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">{task.status}</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <PriorityShow status={task.priority} />
              </td>
              <td className="px-4 py-2.5">
                {canWrite ? (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTask?.(task)}
                      className="p-1.5 rounded-md border border-border hover:bg-muted text-[#00d4ff]"
                      title="Full edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask?.(task._id, team._id)}
                      className="p-1.5 rounded-md border border-border hover:bg-destructive/10 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
          {canWrite ? (
          <tr className="bg-primary/[0.04] border-t border-dashed border-primary/30">
            <td className="px-4 py-2.5" colSpan={5}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary shrink-0" />
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !submitting && createTask()}
                  placeholder="Type task title and press Enter…"
                  disabled={submitting}
                  className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/70"
                />
              </div>
            </td>
            <td className="px-4 py-2.5 text-xs text-muted-foreground" colSpan={2}>
              <button
                type="button"
                onClick={onOpenFullCreate}
                className="text-primary hover:underline whitespace-nowrap"
              >
                Full form…
              </button>
            </td>
          </tr>
          ) : null}
        </tbody>
      </table>
      {canWrite && tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border/40">
          Click the row above to add your first task for this team.
        </p>
      ) : null}
    </div>
  );
}

export default SprintTeamTasks;
