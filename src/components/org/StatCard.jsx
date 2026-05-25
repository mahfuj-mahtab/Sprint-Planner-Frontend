import { cn } from "@/lib/utils";

const BOX = {
  income: "from-primary/15 to-transparent border-primary/25",
  expense: "from-destructive/15 to-transparent border-destructive/25",
  neutral: "from-muted/40 to-transparent border-border",
  balance: "from-[#00d4ff]/15 to-transparent border-[#00d4ff]/25",
};

const VALUE = {
  income: "text-primary",
  expense: "text-destructive",
  neutral: "text-foreground",
  balance: "text-[#00d4ff]",
};

export function StatCard({ label, value, sub, variant = "neutral", className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-left",
        BOX[variant] || BOX.neutral,
        className
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-mono">{label}</div>
      <div className={cn("font-mono text-xl mt-1.5 font-semibold tabular-nums", VALUE[variant] || VALUE.neutral)}>
        {value}
      </div>
      {sub ? <div className="text-xs text-muted-foreground mt-1.5">{sub}</div> : null}
    </div>
  );
}
