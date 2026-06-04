import { useMemo, useState } from "react";
import { Pencil, GripVertical } from "lucide-react";
import { toast } from "react-toastify";
import PriorityShow from "./PriorityShow";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskWorkflowGuide } from "./TaskWorkflowGuide";
import {
  KANBAN_COLUMNS,
  normalizeTaskStatus,
  canTransition,
  taskTypeLabel,
} from "@/lib/taskWorkflow";
import { patchTaskStatus } from "./TaskStatusSelect";
import { cn } from "@/lib/utils";

function KanbanCard({ task, teamName, onEdit, onDragStart, readOnly }) {
  const projectName = task.project?.name || task.project_id?.name;
  return (
    <article
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : (e) => onDragStart(e, task)}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary/30 transition group",
        readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
            {!readOnly ? (
              <button
                type="button"
                onClick={() => onEdit?.(task)}
                className="p-1 rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground shrink-0"
                title="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
              {taskTypeLabel(task.task_type)}
            </span>
            <PriorityShow status={task.priority} />
          </div>
          {task.blocked_reason ? (
            <p className="text-[11px] text-destructive/90 mt-2 line-clamp-2">{task.blocked_reason}</p>
          ) : null}
          <p className="text-[10px] text-muted-foreground mt-2 truncate">
            {projectName ? `${projectName} / ` : ""}{teamName}
          </p>
          {task.assignee?.length > 0 ? (
            <p className="text-[10px] text-muted-foreground truncate">
              {task.assignee.map((a) => a.fullName).join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SprintKanban({ teams, orgId, sprintId, onRefresh, onEditTask, readOnly = false }) {
  const [dragTask, setDragTask] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const tasksByColumn = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c, []]));
    for (const team of teams || []) {
      for (const task of team.tasks || []) {
        const col = normalizeTaskStatus(task.status);
        if (map[col]) map[col].push({ ...task, teamName: team.name, teamId: team._id });
        else if (col === "Cancelled") {
          /* skip cancelled on board */
        }
      }
    }
    return map;
  }, [teams]);

  const moveTask = async (task, column) => {
    if (!canTransition(task.status, column)) {
      toast.error(`Cannot move to ${column} from current status`, { theme: "dark" });
      return;
    }
    try {
      await patchTaskStatus({
        orgId,
        sprintId,
        taskId: task._id,
        status: column,
        blocked_reason: task.blocked_reason,
      });
      toast.success("Moved", { theme: "dark" });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Move failed", { theme: "dark" });
    }
  };

  const handleDrop = (e, column) => {
    e.preventDefault();
    setOverColumn(null);
    if (dragTask) moveTask(dragTask, column);
    setDragTask(null);
  };

  return (
    <div className="space-y-4">
      <TaskWorkflowGuide />

      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)]">
        {KANBAN_COLUMNS.map((column) => {
          const items = tasksByColumn[column] || [];
          return (
            <div
              key={column}
              onDragOver={
                readOnly
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      setOverColumn(column);
                    }
              }
              onDragLeave={readOnly ? undefined : () => setOverColumn(null)}
              onDrop={readOnly ? undefined : (e) => handleDrop(e, column)}
              className={cn(
                "flex flex-col w-[min(100%,280px)] shrink-0 rounded-xl border bg-muted/20",
                overColumn === column ? "border-primary/50 bg-primary/5" : "border-border/80"
              )}
            >
              <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between gap-2 sticky top-0 bg-muted/30 backdrop-blur rounded-t-xl">
                <TaskStatusBadge status={column} />
                <span className="text-xs font-mono text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-14rem)]">
                {items.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
                    Drop tasks here
                  </p>
                ) : (
                  items.map((task) => (
                    <KanbanCard
                      key={task._id}
                      task={task}
                      teamName={task.teamName}
                      readOnly={readOnly}
                      onEdit={onEditTask}
                      onDragStart={(_e, t) => setDragTask(t)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SprintKanban;
