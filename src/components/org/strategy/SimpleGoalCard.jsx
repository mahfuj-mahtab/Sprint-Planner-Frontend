import { CheckCircle2, Circle, Link2, Pencil, Trash2 } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import {
  displayProgress,
  parentLabel,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_CLASS,
  YEAR_STATUS_OPTIONS,
  GOAL_PRIORITY_LABELS,
  GOAL_PRIORITY_BADGE,
  GOAL_PRIORITY_CARD,
  GOAL_PRIORITY_OPTIONS,
} from "@/lib/strategy";
import { Field, SelectInput } from "@/components/org/Field";
import { cn } from "@/lib/utils";

export function SimpleGoalCard({
  goal,
  canWrite,
  onEdit,
  onDelete,
  onStepUpdate,
  onStatusChange,
  onPriorityChange,
  showStatus,
  compact,
}) {
  const pct = displayProgress(goal);
  const isDone = goal.status === "completed";
  const parent = parentLabel(goal);
  const priority = goal.priority || "medium";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition",
        isDone ? "border-[#00d4ff]/30 bg-[#00d4ff]/5" : GOAL_PRIORITY_CARD[priority] || GOAL_PRIORITY_CARD.medium,
        !compact && !isDone && priority !== "high" && "hover:border-primary/25"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {canWrite && onPriorityChange ? (
              <Field label="Priority" className="mb-0 min-w-[9rem]">
                <SelectInput
                  value={priority}
                  onChange={(e) => onPriorityChange(goal, e.target.value)}
                  className="ww-input-sm text-xs py-1"
                >
                  {GOAL_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                  GOAL_PRIORITY_BADGE[priority] || GOAL_PRIORITY_BADGE.medium
                )}
              >
                {GOAL_PRIORITY_LABELS[priority] || priority}
              </span>
            )}
            {showStatus ? (
              canWrite && onStatusChange ? (
                <Field label="Status" className="mb-0 min-w-[8.5rem]">
                  <SelectInput
                    value={goal.status === "completed" ? "completed" : "active"}
                    onChange={(e) => onStatusChange(goal, e.target.value)}
                    className="ww-input-sm text-xs py-1"
                  >
                    {YEAR_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                    GOAL_STATUS_CLASS[goal.status] || GOAL_STATUS_CLASS.active
                  )}
                >
                  {GOAL_STATUS_LABELS[goal.status] || goal.status}
                </span>
              )
            ) : null}
            {goal.uses_rollup ? (
              <span className="text-[10px] text-primary flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {goal.child_count} linked · rollup {pct}%
              </span>
            ) : null}
          </div>
          <h3 className={cn("font-semibold text-sm sm:text-base", isDone && "line-through text-muted-foreground")}>
            {goal.title}
          </h3>
          {goal.year && goal.level === "long_term" ? (
            <p className="text-xs text-muted-foreground mt-0.5">Target year: {goal.year}</p>
          ) : null}
          {parent ? (
            <p className="text-xs text-[#a78bfa] mt-1">Supports: {parent.replace(/^[^:]+:\s*/, "")}</p>
          ) : null}
          {goal.description ? (
            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
          ) : null}
        </div>
        {canWrite ? (
          <div className="flex gap-1 shrink-0">
            <button type="button" onClick={() => onEdit(goal)} className="p-2 rounded-lg border border-border hover:bg-muted">
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(goal)}
              className="p-2 rounded-lg border border-border hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <ProgressBar value={isDone ? 100 : pct} className="flex-1" />
        <span className="text-xs font-mono text-muted-foreground w-10 text-right">{isDone ? 100 : pct}%</span>
      </div>

      {!compact && goal.key_results?.length > 0 ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
            Checklist ·{" "}
            {goal.key_results.filter((kr) => kr.completed).length}/{goal.key_results.length} done
          </p>
          <ul className="space-y-2">
            {goal.key_results.map((kr) => {
              const target = Number(kr.target);
              const hasTarget = target > 0;
              return (
                <li
                  key={kr._id}
                  className={cn(
                    "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
                    kr.completed ? "border-primary/25 bg-primary/5" : "border-border/60"
                  )}
                >
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => onStepUpdate?.(goal._id, kr._id, { completed: !kr.completed })}
                      className="shrink-0"
                      aria-label={kr.completed ? "Mark not completed" : "Mark completed"}
                    >
                      {kr.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/50" />
                      )}
                    </button>
                  ) : kr.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={cn("text-sm flex-1 min-w-0", kr.completed && "line-through text-muted-foreground")}>
                    {kr.title}
                  </span>
                  {!hasTarget ? (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0",
                        kr.completed
                          ? "border-[#00d4ff]/40 text-[#00d4ff] bg-[#00d4ff]/10"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {kr.completed ? "Completed" : "Not completed"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
                      {canWrite ? (
                        <input
                          type="number"
                          className="ww-input ww-input-sm w-16"
                          defaultValue={kr.current ?? 0}
                          onBlur={(e) =>
                            onStepUpdate?.(goal._id, kr._id, { current: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <span>{kr.current ?? 0}</span>
                      )}
                      <span>/ {target}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
