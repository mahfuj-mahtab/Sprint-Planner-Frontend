import { ArrowDown } from "lucide-react";
import { HIERARCHY_LEVELS } from "@/lib/strategy";
import { cn } from "@/lib/utils";

export function GoalHierarchyVisual({ countsByLevel = {}, className }) {
  return (
    <div className={cn("ww-card-sm border-border/80 p-5", className)}>
      <h3 className="text-sm font-semibold mb-1">Execution cascade</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Vision → BHAG → Pillars → Annual → Quarterly OKRs → Initiatives → Projects (delivery)
      </p>
      <div className="flex flex-col items-stretch gap-0">
        {HIERARCHY_LEVELS.map((level, i) => {
          const count = countsByLevel[level.id] ?? 0;
          return (
            <div key={level.id} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 transition",
                  count > 0
                    ? "border-primary/30 bg-primary/10"
                    : "border-border bg-muted/20"
                )}
              >
                <span className="text-xs font-medium">{level.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{count}</span>
              </div>
              {i < HIERARCHY_LEVELS.length - 1 ? (
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50 my-0.5 shrink-0" />
              ) : null}
            </div>
          );
        })}
        <div className="flex flex-col items-center mt-0.5">
          <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50 my-0.5" />
          <div className="w-full rounded-lg border border-dashed border-[#00d4ff]/40 bg-[#00d4ff]/5 px-3 py-2.5 text-center">
            <span className="text-xs text-[#00d4ff]">Projects · Sprints · Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
