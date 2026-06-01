import { cn } from "@/lib/utils";

export function GoalSectionHeader({ icon: Icon, title, description, actions, accent = "default" }) {
  const iconClass =
    accent === "violet"
      ? "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10"
      : accent === "amber"
        ? "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10"
        : accent === "cyan"
          ? "text-[#00d4ff] border-[#00d4ff]/30 bg-[#00d4ff]/10"
          : "text-primary border-primary/30 bg-primary/10";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex gap-3 min-w-0">
        {Icon ? (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", iconClass)}>
            <Icon className="w-5 h-5" />
          </div>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
