import { ArrowDown, Link2 } from "lucide-react";
import { displayProgress, isLongTermGoal, parentLabel } from "@/lib/strategy";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

function Node({ goal, indent = 0 }) {
  const pct = displayProgress(goal);
  const parent = parentLabel(goal);

  return (
    <div
      className={cn("rounded-lg border border-border/80 bg-background/50 p-3", indent > 0 && "ml-4 sm:ml-8")}
      style={{ marginLeft: indent ? indent * 12 : 0 }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-[10px] uppercase font-mono text-muted-foreground">
          {goal.level === "annual" ? `Year ${goal.year}` : goal.level === "quarterly" ? `Q${goal.quarter}` : "Long term"}
        </span>
        {goal.status === "completed" ? (
          <span className="text-[10px] text-[#00d4ff]">Completed</span>
        ) : null}
        {goal.uses_rollup ? (
          <span className="text-[10px] text-primary flex items-center gap-0.5">
            <Link2 className="w-3 h-3" /> from linked goals
          </span>
        ) : null}
      </div>
      <p className="font-medium text-sm">{goal.title}</p>
      {parent ? <p className="text-xs text-[#a78bfa] mt-0.5">↑ supports {parent}</p> : null}
      <div className="flex items-center gap-2 mt-2">
        <ProgressBar value={pct} className="flex-1" size="sm" />
        <span className="text-xs font-mono tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

export function GoalCascadeTree({ goals, year }) {
  const longTerms = goals.filter((g) => isLongTermGoal(g));
  const annual = goals.filter((g) => g.level === "annual" && g.year === year);
  const quarterly = goals.filter((g) => g.level === "quarterly" && g.year === year);

  const quartersOfYear = (yearGoalId) =>
    quarterly.filter((g) => (g.parent_id?._id || g.parent_id)?.toString() === yearGoalId?.toString());

  const yearsOfLong = (ltId) =>
    annual.filter((g) => (g.parent_id?._id || g.parent_id)?.toString() === ltId?.toString());

  const unlinkedYear = annual.filter((g) => !g.parent_id);
  const unlinkedQuarter = quarterly.filter((g) => !g.parent_id);

  if (!longTerms.length && !annual.length && !quarterly.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Add long term and year goals, then link them to see the chain.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <ArrowDown className="w-4 h-4" /> Progress flows upward when child goals are completed
      </p>

      {longTerms.map((lt) => (
        <div key={lt._id} className="space-y-2">
          <Node goal={lt} />
          {yearsOfLong(lt._id).map((yg) => (
            <div key={yg._id} className="ml-4 sm:ml-6 space-y-2 border-l-2 border-[#f59e0b]/30 pl-4">
              <Node goal={yg} />
              {quartersOfYear(yg._id).map((qg) => (
                <div key={qg._id} className="ml-4 border-l-2 border-primary/30 pl-4">
                  <Node goal={qg} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {unlinkedYear.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-dashed border-border">
          <p className="text-xs text-muted-foreground">Year goals not linked to long term</p>
          {unlinkedYear.map((g) => (
            <Node key={g._id} goal={g} />
          ))}
        </div>
      ) : null}

      {unlinkedQuarter.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quarter goals not linked to a year goal</p>
          {unlinkedQuarter.map((g) => (
            <Node key={g._id} goal={g} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
