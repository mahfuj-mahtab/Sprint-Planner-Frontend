import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Compass, Flag, GitBranch, Plus, Target } from "lucide-react";
import { ToastContainer } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ReadOnlyBanner } from "@/components/org/ReadOnlyBanner";
import { Skeleton } from "@/components/ui/Loading";
import { StrategyHelpNote } from "@/components/org/strategy/StrategyHelpNote";
import { GoalsJourneyHero } from "@/components/org/strategy/GoalsJourneyHero";
import { GoalsInsightsPanel } from "@/components/org/strategy/GoalsInsightsPanel";
import { GoalSectionHeader } from "@/components/org/strategy/GoalSectionHeader";
import { WeeklyChecklistSection } from "@/components/org/strategy/WeeklyChecklistSection";
import { GoalCascadeTree } from "@/components/org/strategy/GoalCascadeTree";
import { SimpleGoalCard } from "@/components/org/strategy/SimpleGoalCard";
import { SimpleGoalModal } from "@/components/org/strategy/SimpleGoalModal";
import { useOrgAccess } from "@/hooks/useOrgAccess";
import { useStrategyPage } from "@/hooks/useStrategyPage";
import { currentQuarter, currentYear, isLongTermGoal } from "@/lib/strategy";
import { cn } from "@/lib/utils";

const PAGE_SHELL =
  "ww-page-full max-w-none w-full min-h-[calc(100dvh-8.5rem)] pb-16 space-y-8 bg-gradient-to-b from-[#a78bfa]/[0.04] via-background to-background";

function OrgStrategy() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { access: hookAccess, loading: accessLoading } = useOrgAccess(orgId);
  const { data, loading, load, patchProfile, saveGoal, deleteGoal, updateKeyResult, saveReview } =
    useStrategyPage(orgId);

  const [year, setYear] = useState(currentYear());
  const [quarter, setQuarter] = useState(currentQuarter());
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!accessLoading && hookAccess?.role === "viewer") {
      navigate(`/user/profile/org/${orgId}`);
    }
  }, [accessLoading, hookAccess, navigate, orgId]);

  const canWrite = data?.access?.canWrite ?? hookAccess?.canWrite ?? false;
  const allGoals = data?.goals || [];

  const longTermGoals = useMemo(() => allGoals.filter((g) => isLongTermGoal(g)), [allGoals]);

  const yearGoals = useMemo(
    () => allGoals.filter((g) => g.level === "annual" && g.year === year),
    [allGoals, year]
  );

  const quarterGoals = useMemo(
    () => allGoals.filter((g) => g.level === "quarterly" && g.year === year && g.quarter === quarter),
    [allGoals, year, quarter]
  );

  const openAddLong = () => setModal({ mode: "long_term" });
  const openAddYear = () => setModal({ mode: "year" });
  const openAddQuarter = () => setModal({ mode: "quarter" });

  const openEdit = (goal) => {
    if (isLongTermGoal(goal)) setModal({ mode: "long_term", initial: goal });
    else if (goal.level === "annual") setModal({ mode: "year", initial: goal });
    else setModal({ mode: "quarter", initial: goal });
  };

  const handleSave = async (body) => {
    setSaving(true);
    try {
      const projectIds = body.project_ids?.filter(Boolean) || [];
      await saveGoal(modal?.initial?._id, {
        ...body,
        project_ids: projectIds.length ? projectIds : [],
      });
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleGoalStatus = async (goal, status) => {
    await saveGoal(goal._id, {
      title: goal.title,
      level: goal.level,
      year: goal.year,
      quarter: goal.quarter,
      status,
      description: goal.description,
      parent_id: goal.parent_id?._id || goal.parent_id || null,
    });
  };

  const saveWeekChecklist = async (checklist) => {
    const wr = data?.weekly_review;
    setSaving(true);
    try {
      await saveReview({
        review_type: "weekly",
        year: wr.year,
        period: wr.period,
        period_label: wr.period_label,
        checklist,
      });
    } finally {
      setSaving(false);
    }
  };

  const saveChecklistTemplate = async (items) => {
    setSaving(true);
    try {
      await patchProfile({ weekly_checklist_template: items });
      const wr = data?.weekly_review;
      if (wr) {
        await saveReview({
          review_type: "weekly",
          year: wr.year,
          period: wr.period,
          period_label: wr.period_label,
          checklist: items.map((t) => ({ ...t, done: false })),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className={PAGE_SHELL}>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="ww-page-full py-10 text-center text-muted-foreground">Could not load goals.</div>
      </DashboardLayout>
    );
  }

  const years = [year - 1, year, year + 1];

  return (
    <DashboardLayout>
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className={`${PAGE_SHELL} py-4 flex items-center gap-3 !pb-4 !min-h-0`}>
          <button
            type="button"
            onClick={() => navigate(`/user/profile/org/${orgId}`)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Flag className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Goals</h1>
            <p className="text-xs text-muted-foreground">Long term → Year → Quarter (linked)</p>
          </div>
        </div>
      </div>

      <div className={PAGE_SHELL}>
        {!canWrite ? <ReadOnlyBanner /> : null}

        <StrategyHelpNote />

        <GoalsJourneyHero goals={allGoals} year={year} quarter={quarter} weeklyReview={data.weekly_review} />

        <GoalsInsightsPanel goals={allGoals} year={year} quarter={quarter} weeklyReview={data.weekly_review} />

        {/* Long term goals */}
        <section className="ww-card-sm border-[#a78bfa]/30 bg-gradient-to-br from-[#a78bfa]/8 via-card to-card p-6 sm:p-8 space-y-5">
          <GoalSectionHeader
            icon={Compass}
            accent="violet"
            title="Long term goals"
            description="Your destinations. Link each year goal to one of these so progress rolls upward."
            actions={
              canWrite ? (
                <button
                  type="button"
                  onClick={openAddLong}
                  className="inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-[#a78bfa] text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add long term goal
                </button>
              ) : null
            }
          />

          {longTermGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#a78bfa]/40 px-4 py-10 text-center text-sm text-muted-foreground">
              No long term goals yet.
              {canWrite ? (
                <button type="button" onClick={openAddLong} className="block mx-auto mt-2 text-[#a78bfa] font-medium">
                  + Add your first long term goal
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {longTermGoals.map((g) => (
                <SimpleGoalCard
                  key={g._id}
                  goal={g}
                  canWrite={canWrite}
                  onEdit={openEdit}
                  onDelete={deleteGoal}
                  onStatusChange={handleGoalStatus}
                  showStatus
                  compact
                />
              ))}
            </div>
          )}
        </section>

        {/* Year goals */}
        <section className="ww-card-sm border-border/80 p-6 sm:p-8 space-y-5">
          <GoalSectionHeader
            icon={Calendar}
            accent="amber"
            title={`Year goals — ${year}`}
            description="Milestones for this year. Mark Completed when done — it feeds your long term progress."
            actions={
              <>
                <span className="text-sm text-muted-foreground self-center">Year:</span>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition",
                      y === year
                        ? "bg-[#f59e0b] text-black border-[#f59e0b]"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {y}
                  </button>
                ))}
                {canWrite ? (
                  <button
                    type="button"
                    onClick={openAddYear}
                    className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    Add year goal
                  </button>
                ) : null}
              </>
            }
          />

          {yearGoals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No year goals for {year}.
              {canWrite ? (
                <button type="button" onClick={openAddYear} className="block mx-auto mt-2 text-primary font-medium">
                  + Add year goal
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {yearGoals.map((g) => (
                <SimpleGoalCard
                  key={g._id}
                  goal={g}
                  canWrite={canWrite}
                  onEdit={openEdit}
                  onDelete={deleteGoal}
                  onStatusChange={handleGoalStatus}
                  showStatus
                  compact
                />
              ))}
            </div>
          )}
        </section>

        {/* Quarter goals */}
        <section className="ww-card-sm border-border/80 p-6 sm:p-8 space-y-5">
          <GoalSectionHeader
            icon={Target}
            accent="cyan"
            title={`Quarter goals — ${year}`}
            description="What you execute this quarter. Add checklist items (done / not done) or optional numbers. Link to a year goal."
          />
          <div className="flex gap-2 max-w-md">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuarter(q)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium border",
                  q === quarter
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "border-border text-muted-foreground"
                )}
              >
                Q{q}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">
              Q{quarter} · {quarterGoals.length} goal(s)
            </p>
            {canWrite ? (
              <button
                type="button"
                onClick={openAddQuarter}
                className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-primary text-primary"
              >
                <Plus className="w-4 h-4" /> Add quarter goal
              </button>
            ) : null}
          </div>
          {quarterGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">
              No quarter goals for Q{quarter}.{" "}
              {canWrite ? (
                <button type="button" onClick={openAddQuarter} className="text-primary font-medium">
                  Add one
                </button>
              ) : null}
            </p>
          ) : (
            <div className="space-y-4">
              {quarterGoals.map((g) => (
                <SimpleGoalCard
                  key={g._id}
                  goal={g}
                  canWrite={canWrite}
                  onEdit={openEdit}
                  onDelete={deleteGoal}
                  onStatusChange={handleGoalStatus}
                  showStatus
                  onStepUpdate={(goalId, krId, patch) => updateKeyResult(goalId, krId, patch)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Connected tree */}
        <section className="ww-card-sm border-border/80 p-6 sm:p-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-primary" />
            How your goals connect ({year})
          </h2>
          <GoalCascadeTree goals={allGoals} year={year} />
        </section>

        <WeeklyChecklistSection
          weeklyReview={data.weekly_review}
          checklistTemplate={data.strategy?.weekly_checklist_template}
          canWrite={canWrite}
          saving={saving}
          onSaveTemplate={saveChecklistTemplate}
          onSaveWeek={saveWeekChecklist}
        />

      </div>

      <SimpleGoalModal
        open={!!modal}
        onClose={() => setModal(null)}
        mode={modal?.mode || "quarter"}
        year={year}
        quarter={quarter}
        initial={modal?.initial}
        projects={data.projects}
        longTermGoals={longTermGoals}
        yearGoals={yearGoals}
        onSubmit={handleSave}
        saving={saving}
      />

      <ToastContainer position="top-right" theme="dark" />
    </DashboardLayout>
  );
}

export default OrgStrategy;
