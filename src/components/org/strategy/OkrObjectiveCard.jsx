import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { ProgressBar } from "./ProgressBar";
import {
  GOAL_STATUS_LABELS,
  goalHealth,
  HEALTH_STYLES,
  formatGoalPeriod,
} from "@/lib/strategy";
import { cn } from "@/lib/utils";

function KeyResultRow({ kr, canWrite, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(kr.current ?? 0);
  const target = Number(kr.target);
  const pct =
    target > 0 ? Math.round(Math.min(100, ((Number(kr.current) || 0) / target) * 100)) : kr.completed ? 100 : 0;

  const commit = () => {
    onUpdate(kr._id, { current: Number(val), completed: target > 0 && Number(val) >= target });
    setEditing(false);
  };

  return (
    <li className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={!canWrite}
          onClick={() => onUpdate(kr._id, { completed: !kr.completed })}
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition",
            kr.completed
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          )}
          aria-label="Toggle key result"
        >
          {kr.completed ? <span className="text-[10px]">✓</span> : null}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", kr.completed && "line-through text-muted-foreground")}>
            {kr.title}
          </p>
          {target > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              {canWrite && editing ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="number"
                    className="ww-input ww-input-sm w-24"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commit()}
                  />
                  <button type="button" className="text-xs text-primary" onClick={commit}>
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canWrite}
                  onClick={() => canWrite && setEditing(true)}
                  className="text-xs font-mono text-muted-foreground hover:text-foreground tabular-nums"
                >
                  {kr.current ?? 0} / {target} {kr.unit}
                </button>
              )}
              <ProgressBar value={pct} size="sm" className="flex-1 max-w-[120px]" />
            </div>
          ) : null}
        </div>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">{pct}%</span>
      </div>
    </li>
  );
}

export function OkrObjectiveCard({
  goal,
  orgId,
  canWrite,
  projects,
  onEdit,
  onDelete,
  onKrUpdate,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const health = goalHealth(goal.progress_percent, goal.status);
  const period = formatGoalPeriod(goal);

  return (
    <article className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:border-primary/20 transition">
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <ProgressRing value={goal.progress_percent} size={72} stroke={6} accent="violet" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {period ? (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00d4ff]">{period}</span>
              ) : null}
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", HEALTH_STYLES[health.tone])}>
                {health.label}
              </span>
              {goal.status !== "active" ? (
                <span className="text-[10px] text-muted-foreground">{GOAL_STATUS_LABELS[goal.status]}</span>
              ) : null}
            </div>
            <h3 className="text-base sm:text-lg font-semibold leading-snug pr-8">{goal.title}</h3>
            {goal.description ? (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
            ) : null}
            {goal.pillar_id?.name ? (
              <span
                className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: `${goal.pillar_id.color}55`,
                  backgroundColor: `${goal.pillar_id.color}15`,
                  color: goal.pillar_id.color,
                }}
              >
                {goal.pillar_id.name}
              </span>
            ) : null}
          </div>
          {canWrite ? (
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(goal)}
                className="p-2 rounded-lg border border-border hover:bg-muted"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(goal)}
                className="p-2 rounded-lg border border-border hover:bg-destructive/10 text-destructive"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>

        {goal.project_ids?.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
            {goal.project_ids.map((p) => {
              const proj = typeof p === "object" ? p : projects?.find((x) => x._id === p);
              if (!proj) return null;
              return (
                <Link
                  key={proj._id}
                  to={`/user/profile/org/${orgId}/project/${proj._id}/dashboard`}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 no-underline"
                >
                  {proj.name} →
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {goal.key_results?.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>{goal.key_results.length} key results</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded ? (
            <ul className="px-5 pb-5 space-y-2">
              {goal.key_results.map((kr) => (
                <KeyResultRow
                  key={kr._id}
                  kr={kr}
                  canWrite={canWrite}
                  onUpdate={(krId, patch) => onKrUpdate(goal._id, krId, patch)}
                />
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="px-5 pb-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground py-3">Add key results to measure this objective.</p>
        </div>
      )}
    </article>
  );
}
