import { useMemo, useState } from "react";
import { ChevronRight, Flag, Plus, Target, Zap } from "lucide-react";
import { EmptyState } from "@/components/org/EmptyState";
import { StrategyPeriodBar } from "./StrategyPeriodBar";
import { OkrObjectiveCard } from "./OkrObjectiveCard";
import { currentYear, currentQuarter } from "@/lib/strategy";
import { cn } from "@/lib/utils";

export function OkrBoard({
  orgId,
  goals,
  year: initialYear,
  quarter: initialQuarter,
  canWrite,
  projects,
  onAddOkr,
  onAddAnnual,
  onAddInitiative,
  onEditGoal,
  onDeleteGoal,
  onKrUpdate,
  onOpenNorthStar,
}) {
  const [year, setYear] = useState(initialYear ?? currentYear());
  const [quarter, setQuarter] = useState(initialQuarter ?? currentQuarter());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const quarterly = useMemo(
    () =>
      goals.filter((g) => g.level === "quarterly" && g.year === year && g.quarter === quarter),
    [goals, year, quarter]
  );

  const annual = useMemo(
    () => goals.filter((g) => g.level === "annual" && g.year === year),
    [goals, year]
  );

  const initiatives = useMemo(
    () => goals.filter((g) => g.level === "initiative" && (!g.year || g.year === year)),
    [goals, year]
  );

  const other = useMemo(
    () =>
      goals.filter(
        (g) =>
          !["quarterly", "annual", "initiative"].includes(g.level) &&
          (!g.year || g.year === year)
      ),
    [goals, year]
  );

  return (
    <div className="space-y-6">
      <StrategyPeriodBar year={year} quarter={quarter} onYearChange={setYear} onQuarterChange={setQuarter} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Q{quarter} {year} objectives</h2>
          <p className="text-sm text-muted-foreground">Objectives and key results — update progress inline</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => onAddOkr({ year, quarter })}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Add objective
          </button>
        ) : null}
      </div>

      {annual.length > 0 ? (
        <div className="rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-[#f59e0b]" />
            <h3 className="text-sm font-semibold">Annual priorities ({year})</h3>
          </div>
          <ul className="space-y-2">
            {annual.map((g) => (
              <li
                key={g._id}
                className="flex items-center justify-between gap-2 text-sm rounded-lg border border-border/60 bg-card/80 px-3 py-2"
              >
                <span className="font-medium">{g.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{g.progress_percent}%</span>
              </li>
            ))}
          </ul>
          {canWrite ? (
            <button type="button" onClick={onAddAnnual} className="mt-2 text-xs text-[#f59e0b]">
              + Add annual goal
            </button>
          ) : null}
        </div>
      ) : canWrite ? (
        <button
          type="button"
          onClick={onAddAnnual}
          className="text-xs text-muted-foreground hover:text-[#f59e0b] border border-dashed border-border rounded-lg px-3 py-2 w-full text-left"
        >
          + Set annual goals for {year}
        </button>
      ) : null}

      {quarterly.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No objectives this quarter"
          description="Add one objective with 2–5 measurable key results. Industry standard: 3–5 OKRs per quarter."
          action={
            canWrite ? (
              <button type="button" onClick={() => onAddOkr({ year, quarter })} className="ww-btn ww-btn-primary text-sm">
                Create Q{quarter} OKR
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {quarterly.map((g) => (
            <OkrObjectiveCard
              key={g._id}
              goal={g}
              orgId={orgId}
              canWrite={canWrite}
              projects={projects}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
              onKrUpdate={onKrUpdate}
            />
          ))}
        </div>
      )}

      {initiatives.length > 0 || canWrite ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Strategic initiatives</h3>
            {canWrite ? (
              <button type="button" onClick={onAddInitiative} className="text-xs text-primary ml-auto">
                + Add initiative
              </button>
            ) : null}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {initiatives.map((g) => (
              <div
                key={g._id}
                className="rounded-xl border border-border p-4 hover:border-primary/30 cursor-pointer"
                onClick={() => onEditGoal(g)}
                onKeyDown={(e) => e.key === "Enter" && onEditGoal(g)}
                role="button"
                tabIndex={0}
              >
                <p className="font-medium text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{g.progress_percent}% complete</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("w-4 h-4 transition", showAdvanced && "rotate-90")} />
        North star & advanced goals
      </button>
      {showAdvanced ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenNorthStar}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            Edit vision, BHAG & pillars →
          </button>
          {other.map((g) => (
            <div key={g._id} className="text-sm border border-border rounded-lg px-3 py-2 flex justify-between">
              <span>{g.title}</span>
              <button type="button" onClick={() => onEditGoal(g)} className="text-xs text-primary">
                Edit
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
