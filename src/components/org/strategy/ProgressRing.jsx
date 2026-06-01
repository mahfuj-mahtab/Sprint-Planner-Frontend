import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 88,
  stroke = 7,
  className,
  label,
  sublabel,
  accent = "primary",
}) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  const strokeColor =
    accent === "cyan"
      ? "#00d4ff"
      : accent === "violet"
        ? "#a78bfa"
        : "var(--primary)";

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-bold tabular-nums">{pct}%</span>
        {label ? <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span> : null}
      </div>
      {sublabel ? <p className="text-xs text-muted-foreground mt-2 text-center max-w-[120px]">{sublabel}</p> : null}
    </div>
  );
}
