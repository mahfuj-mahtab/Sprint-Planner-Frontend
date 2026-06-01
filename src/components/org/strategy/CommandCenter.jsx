import {
  ArrowRight,
  Calendar,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/org/StatCard";
import { ProgressRing } from "./ProgressRing";
import { OkrObjectiveCard } from "./OkrObjectiveCard";
import { KPI_CATEGORY_LABELS, kpiProgressPercent } from "@/lib/strategy";
import { cn } from "@/lib/utils";

export function CommandCenter({
  orgId,
  data,
  canWrite,
  onTabChange,
  onAddOkr,
  onEditGoal,
  onDeleteGoal,
  onKrUpdate,
  onChecklistSave,
  saving,
}) {
  const { strategy, summary, kpis, weekly_review, setup_progress } = data;
  const quarterly = (data.goals || []).filter(
    (g) =>
      g.level === "quarterly" &&
      g.year === summary.current_year &&
      g.quarter === summary.current_quarter
  );
  const topKpis = [...(kpis || [])].slice(0, 4);
  const checklist = weekly_review?.checklist || [];
  const checklistPct =
    checklist.length > 0
      ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="relative rounded-2xl border border-border/80 overflow-hidden bg-gradient-to-br from-[#0d1520] via-card to-[#0a1219]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(167,139,250,0.14),transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(0,255,148,0.08),transparent)] pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#a78bfa] font-mono mb-2">
              Q{summary.current_quarter} {summary.current_year}
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {strategy.bhag_title || "Your strategy command center"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              {strategy.vision_10y ||
                "Set your north star, run quarterly OKRs, and review progress every Monday."}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {canWrite ? (
                <button
                  type="button"
                  onClick={onAddOkr}
                  className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  <Plus className="w-4 h-4" /> New OKR
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onTabChange("okrs")}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted"
              >
                View plan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ProgressRing
            value={summary.avg_quarterly_progress}
            size={120}
            stroke={8}
            accent="violet"
            sublabel={`${quarterly.length} objective${quarterly.length !== 1 ? "s" : ""} this quarter`}
          />
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Quarter progress"
          value={`${summary.avg_quarterly_progress}%`}
          sub={`Q${summary.current_quarter} OKRs`}
          variant="balance"
        />
        <StatCard
          label="At risk"
          value={summary.at_risk_goals}
          sub="Objectives needing attention"
          variant={summary.at_risk_goals > 0 ? "expense" : "neutral"}
        />
        <StatCard
          label="Weekly rhythm"
          value={`${summary.checklist_done}/${summary.checklist_total}`}
          sub={weekly_review?.period_label || "This week"}
          variant="income"
        />
        <StatCard
          label="Metrics"
          value={summary.kpi_count}
          sub="KPIs on dashboard"
          variant="neutral"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-[#a78bfa]" />
              Active OKRs
            </h3>
            {quarterly.length > 2 ? (
              <button type="button" onClick={() => onTabChange("okrs")} className="text-xs text-primary">
                See all →
              </button>
            ) : null}
          </div>
          {quarterly.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">No OKRs for this quarter yet.</p>
              {canWrite ? (
                <button type="button" onClick={onAddOkr} className="text-sm text-primary font-medium">
                  + Create your first OKR
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {quarterly.slice(0, 2).map((g) => (
                <OkrObjectiveCard
                  key={g._id}
                  goal={g}
                  orgId={orgId}
                  canWrite={canWrite}
                  projects={data.projects}
                  onEdit={onEditGoal}
                  onDelete={onDeleteGoal}
                  onKrUpdate={onKrUpdate}
                  defaultExpanded={quarterly.length <= 2}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="ww-card-sm border-border/80 p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              Monday checklist
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <ProgressRing value={checklistPct} size={56} stroke={5} label="" />
              <p className="text-xs text-muted-foreground">{weekly_review?.period_label}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const updated = checklist.map((item, i) => ({
                  ...item,
                  done: fd.get(`check_${i}`) === "on",
                }));
                onChecklistSave(updated);
              }}
              className="space-y-2"
            >
              {checklist.map((item, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex items-start gap-2.5 text-sm rounded-lg border px-3 py-2.5 cursor-pointer transition",
                    item.done ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/30"
                  )}
                >
                  <input
                    type="checkbox"
                    name={`check_${i}`}
                    defaultChecked={item.done}
                    disabled={!canWrite}
                    className="mt-0.5 rounded"
                  />
                  <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                </label>
              ))}
              {canWrite ? (
                <button type="submit" disabled={saving} className="ww-btn ww-btn-primary w-full text-sm mt-2">
                  Save checklist
                </button>
              ) : null}
            </form>
            <button
              type="button"
              onClick={() => onTabChange("rhythm")}
              className="mt-3 text-xs text-muted-foreground hover:text-primary w-full text-left"
            >
              Full weekly review →
            </button>
          </div>

          <div className="ww-card-sm border-border/80 p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#00d4ff]" />
              Key metrics
            </h3>
            {topKpis.length === 0 ? (
              <p className="text-xs text-muted-foreground">Add metrics in the Metrics tab.</p>
            ) : (
              <ul className="space-y-3">
                {topKpis.map((k) => {
                  const pct = kpiProgressPercent(k);
                  return (
                    <li key={k._id} className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{KPI_CATEGORY_LABELS[k.category]}</p>
                        <p className="text-sm font-medium truncate">{k.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-semibold tabular-nums">
                          {k.latest_value ?? k.current_value}
                          <span className="text-xs text-muted-foreground ml-0.5">{k.unit}</span>
                        </p>
                        {pct != null ? <p className="text-[10px] text-muted-foreground">{pct}% of target</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={() => onTabChange("metrics")}
              className="mt-3 text-xs text-primary"
            >
              Open metrics dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
