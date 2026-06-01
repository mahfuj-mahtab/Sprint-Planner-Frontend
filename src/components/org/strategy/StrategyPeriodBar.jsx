import { cn } from "@/lib/utils";

export function StrategyPeriodBar({ year, quarter, onYearChange, onQuarterChange, className }) {
  const quarters = [1, 2, 3, 4];
  const years = [year - 1, year, year + 1];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition",
              y === year
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="h-6 w-px bg-border hidden sm:block" />
      <div className="flex items-center gap-1">
        {quarters.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQuarterChange(q)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition min-w-[3rem]",
              q === quarter
                ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40"
                : "text-muted-foreground hover:bg-muted border border-transparent"
            )}
          >
            Q{q}
          </button>
        ))}
      </div>
    </div>
  );
}
