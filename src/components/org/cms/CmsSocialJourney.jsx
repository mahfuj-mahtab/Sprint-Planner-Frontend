import { ExternalLink, TrendingDown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  getPlatformIcon,
  PLATFORM_TYPE_LABEL,
} from "@/lib/cms";

export function CmsSocialJourney({ journey = [], onSelectPlatform }) {
  if (!journey.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Add your first channel — YouTube, Instagram, LinkedIn — to start tracking your social
          journey.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Your channels</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Follower growth, engagement, and publishing cadence per platform
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {journey.map((p) => {
          const Icon = getPlatformIcon(p.icon);
          const color = p.color || "#a78bfa";
          const growing = (p.follower_growth || 0) >= 0;
          return (
            <button
              key={p.platform_id}
              type="button"
              onClick={() => onSelectPlatform?.(p.platform_id)}
              className={cn(
                "shrink-0 w-[min(100%,220px)] rounded-xl border bg-gradient-to-br p-4 text-left transition",
                "from-muted/30 to-transparent hover:border-primary/40 border-border"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}28`, color }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {PLATFORM_TYPE_LABEL[p.platform_type] || p.platform_type}
                    {p.account_handle ? ` · @${p.account_handle}` : ""}
                  </p>
                </div>
                {p.account_url ? (
                  <a
                    href={p.account_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
                  <div className="text-[9px] uppercase text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> Followers
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatNumber(p.current_followers || 0)}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] flex items-center gap-0.5",
                      growing ? "text-primary" : "text-destructive"
                    )}
                  >
                    {growing ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {growing ? "+" : ""}
                    {formatNumber(p.follower_growth || 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
                  <div className="text-[9px] uppercase text-muted-foreground">Engagement</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {(p.engagement_rate || 0).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {p.published_this_month || 0} pub / mo
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-muted-foreground">
                {p.total_content || 0} in pipeline
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
