import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrgSubnav({
  orgId,
  eyebrow,
  title,
  icon: Icon,
  accent = "primary",
  backLabel = "Organization",
  links = [],
  actions,
  tabs,
  activeTab,
  onTabChange,
}) {
  const navigate = useNavigate();
  const accentStyles =
    accent === "cyan"
      ? {
          ring: "shadow-[0_0_24px_rgba(0,212,255,0.15)] border-[#00d4ff]/30",
          icon: "text-[#00d4ff]",
          tag: "border-[#00d4ff]/25 bg-[#00d4ff]/10 text-[#00d4ff]",
        }
      : {
          ring: "shadow-[0_0_24px_rgba(0,255,148,0.12)] border-primary/30",
          icon: "text-primary",
          tag: "border-primary/20 bg-primary/10 text-primary",
        };

  return (
    <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30">
      <div className="ww-dot-bg">
        <div className="ww-page-full max-w-none py-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/user/profile/org/${orgId}`)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card",
                accentStyles.ring
              )}
            >
              {Icon ? <Icon className={cn("w-4 h-4", accentStyles.icon)} /> : null}
            </div>
            <div className="min-w-0">
              <div className={cn("ww-tag mb-1 text-[10px]", accentStyles.tag)}>
                {eyebrow}
              </div>
              <h1 className="ww-heading text-lg truncate">{title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "text-sm px-3 py-2 rounded-lg border transition inline-flex items-center gap-1.5",
                  l.active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {l.icon ? <l.icon className="w-4 h-4" /> : null}
                {l.label}
              </Link>
            ))}
            {actions}
          </div>
        </div>

        {tabs?.length > 0 && (
          <div className="ww-page-full max-w-none pb-2 flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition",
                  activeTab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t.icon ? <t.icon className="w-3.5 h-3.5" /> : null}
                {t.label}
                {t.badge != null ? (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                      activeTab === t.id ? "bg-primary-foreground/20" : "bg-background/80"
                    )}
                  >
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
