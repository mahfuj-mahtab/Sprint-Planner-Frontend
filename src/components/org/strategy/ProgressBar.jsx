import { cn } from "@/lib/utils";

export function ProgressBar({ value, size = "md", className, accent }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={cn("w-full rounded-full bg-muted/80 overflow-hidden", h, className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          accent === "cyan"
            ? pct >= 100
              ? "bg-[#00d4ff]"
              : "bg-[#00d4ff]/80"
            : pct >= 100
              ? "bg-primary"
              : pct > 0
                ? "bg-[#a78bfa]"
                : "bg-transparent"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
