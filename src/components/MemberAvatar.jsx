import { cn } from "@/lib/utils";

export function memberInitials(name) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")).toUpperCase().slice(0, 2);
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function MemberAvatar({ name, size = "md", className, accent = "default" }) {
  const accentRing =
    accent === "cyan"
      ? "border-[#00d4ff]/40 bg-[#00d4ff]/15 text-[#00d4ff]"
      : accent === "primary"
        ? "border-primary/40 bg-primary/15 text-primary"
        : "border-border bg-muted/60 text-foreground";

  return (
    <div
      className={cn(
        "shrink-0 rounded-full border font-semibold font-mono flex items-center justify-center",
        SIZES[size],
        accentRing,
        className
      )}
      aria-hidden
    >
      {memberInitials(name)}
    </div>
  );
}
