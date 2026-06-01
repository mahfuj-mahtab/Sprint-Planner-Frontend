import { MapPin, Navigation, Sparkles, TrendingUp } from "lucide-react";
import { buildJourneyInsights } from "@/lib/strategy";
import { ProgressRing } from "./ProgressRing";
import { cn } from "@/lib/utils";

function StatPill({ label, value, sub, accent }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 min-w-[7rem]",
        accent === "cyan"
          ? "border-[#00d4ff]/30 bg-[#00d4ff]/8"
          : accent === "amber"
            ? "border-[#f59e0b]/30 bg-[#f59e0b]/8"
            : accent === "violet"
              ? "border-[#a78bfa]/30 bg-[#a78bfa]/8"
              : "border-primary/30 bg-primary/8"
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</p>
      <p className="text-2xl font-bold font-mono tabular-nums mt-0.5">{value}</p>
      {sub ? <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p> : null}
    </div>
  );
}

export function GoalsJourneyHero({ goals, year, quarter, weeklyReview }) {
  const j = buildJourneyInsights(goals, year, quarter, weeklyReview);

  return (
    <section className="relative rounded-2xl border border-border/80 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1520] via-[#0a1219] to-[#080c10]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(167,139,250,0.18),transparent),radial-gradient(ellipse_60%_50%_at_90%_80%,rgba(0,255,148,0.1),transparent)] pointer-events-none" />
      <div className="absolute inset-0 ww-dot-bg opacity-40 pointer-events-none" />

      <div className="relative p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="ww-tag border-primary/30 bg-primary/10 text-primary text-[10px]">Goal journey</span>
          <span className="text-xs text-muted-foreground">{year} · Q{quarter}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Where you are */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-[#00d4ff]">
              <MapPin className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-foreground">Where you are</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Today&apos;s execution layer — this week, this quarter, and how much of {year} is already done.
            </p>
            <div className="flex flex-wrap gap-2">
              <StatPill
                label={`Q${quarter} progress`}
                value={`${j.focusNow.quarter}%`}
                sub={`${j.focusNow.quarterGoals} active goal(s)`}
                accent="cyan"
              />
              <StatPill
                label="Year done"
                value={`${j.focusNow.yearCompleted}/${j.focusNow.yearTotal}`}
                sub="Completed year goals"
                accent="amber"
              />
              <StatPill
                label="This week"
                value={`${j.focusNow.weekPct}%`}
                sub="Checklist"
                accent="primary"
              />
            </div>
          </div>

          {/* Momentum center */}
          <div className="lg:col-span-4 flex flex-col items-center text-center py-4">
            <ProgressRing value={j.stats.overallPct} size={140} stroke={10} accent="primary" />
            <p className="mt-4 text-sm font-medium flex items-center gap-1.5 justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
              Momentum score
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{j.momentumLabel}</p>
            {j.focusNow.linkPct > 0 ? (
              <p className="text-[11px] text-[#a78bfa] mt-3">{j.focusNow.linkPct}% of year goals linked to long term</p>
            ) : null}
          </div>

          {/* Where you're going */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-[#a78bfa]">
              <Navigation className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-foreground">Where you&apos;re going</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your north star — long term direction that year and quarter goals should move toward.
            </p>
            {j.destinations.length === 0 ? (
              <p className="text-sm italic text-muted-foreground rounded-xl border border-dashed border-[#a78bfa]/40 px-4 py-6">
                Add a long term goal to define your destination.
              </p>
            ) : (
              <ul className="space-y-2">
                {j.destinations.slice(0, 4).map((d) => (
                  <li
                    key={d._id}
                    className="rounded-xl border border-[#a78bfa]/25 bg-[#a78bfa]/5 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      {d.targetYear ? (
                        <p className="text-[10px] text-muted-foreground">By {d.targetYear}</p>
                      ) : null}
                    </div>
                    <span className="font-mono text-sm text-[#a78bfa] shrink-0">{d.pct}%</span>
                  </li>
                ))}
              </ul>
            )}
            {j.activeYearFocus ? (
              <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-3 py-2 text-left">
                <p className="text-[10px] uppercase text-[#f59e0b] font-mono mb-0.5">Focus this year</p>
                <p className="text-sm font-medium">{j.activeYearFocus.title}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Roadmap strip */}
        <div className="mt-10 pt-8 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Path · week → quarter → year → long term
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {j.funnel.map((step, i) => (
              <div key={step.id} className="relative">
                {i < j.funnel.length - 1 ? (
                  <div className="hidden lg:block absolute top-1/2 -right-1.5 w-3 h-px bg-border z-10" />
                ) : null}
                <div className="rounded-xl border border-border/80 bg-card/60 p-4 h-full">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold" style={{ color: step.color }}>
                      {step.label}
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums">{step.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/80 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${step.pct}%`, backgroundColor: step.color }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
