export const STRATEGY_HELP = {
  title: "How goals connect",
  items: [
    {
      term: "Long term goal",
      meaning: "Big 3–10 year direction. You can add many.",
    },
    {
      term: "Year goal",
      meaning: "Link each year goal to a long term goal — completing years moves you toward that dream.",
    },
    {
      term: "Quarter goal",
      meaning:
        "Link to a year goal. Break it into checklist items (completed / not completed, like project features). Optional numbers if you need a target count.",
    },
    {
      term: "Progress %",
      meaning: "If a goal has linked children, its % is the average of those children (you are going the right way).",
    },
  ],
};

export const LONG_TERM_LEVELS = ["long_term", "bhag", "vision"];

export const YEAR_STATUS_OPTIONS = [
  { value: "active", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const GOAL_STATUS_LABELS = {
  draft: "Draft",
  active: "In progress",
  at_risk: "At risk",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const GOAL_STATUS_CLASS = {
  active: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30",
  at_risk: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  draft: "bg-muted/40 text-muted-foreground border-border",
  cancelled: "bg-muted/30 text-muted-foreground border-border",
};

export function isLongTermGoal(goal) {
  return LONG_TERM_LEVELS.includes(goal.level);
}

export function displayProgress(goal) {
  if (goal.uses_rollup && goal.rollup_progress != null) return goal.rollup_progress;
  return goal.progress_percent ?? 0;
}

export function goalProgress(goal) {
  if (goal.status === "completed") return 100;
  const krs = goal.key_results || [];
  if (krs.length > 0) {
    const withTarget = krs.filter((kr) => kr.target != null && kr.target > 0);
    if (withTarget.length > 0) {
      const pct =
        withTarget.reduce((sum, kr) => {
          const t = Number(kr.target) || 1;
          const c = Math.min(Number(kr.current) || 0, t);
          return sum + (c / t) * 100;
        }, 0) / withTarget.length;
      return Math.round(Math.min(100, pct));
    }
    const done = krs.filter((kr) => kr.completed).length;
    return Math.round((done / krs.length) * 100);
  }
  return goal.progress_percent ?? 0;
}

export function parentLabel(goal) {
  const p = goal.parent_id;
  if (!p || typeof p !== "object") return null;
  if (p.level === "annual") return `Year: ${p.title}`;
  if (LONG_TERM_LEVELS.includes(p.level)) return `Long term: ${p.title}`;
  return p.title;
}

export function buildProgressChartData(goals, year, weeklyReview) {
  const yearGoals = goals.filter((g) => g.level === "annual" && g.year === year);
  const quarterGoals = goals.filter((g) => g.level === "quarterly" && g.year === year);
  const longTerm = goals.filter((g) => isLongTermGoal(g));

  const yearDone = yearGoals.filter((g) => g.status === "completed").length;
  const yearTotal = yearGoals.length;
  const yearPct = yearTotal ? Math.round((yearDone / yearTotal) * 100) : 0;

  const longPct =
    longTerm.length > 0
      ? Math.round(longTerm.reduce((s, g) => s + displayProgress(g), 0) / longTerm.length)
      : 0;

  const byQuarter = [1, 2, 3, 4].map((q) => {
    const list = quarterGoals.filter((g) => g.quarter === q);
    const avg =
      list.length > 0
        ? Math.round(list.reduce((s, g) => s + displayProgress(g), 0) / list.length)
        : 0;
    return { name: `Q${q}`, progress: avg, count: list.length };
  });

  const checklist = weeklyReview?.checklist || [];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistPct = checklist.length
    ? Math.round((checklistDone / checklist.length) * 100)
    : 0;

  const quarterAvg =
    byQuarter.some((q) => q.count > 0)
      ? Math.round(
          byQuarter.filter((q) => q.count > 0).reduce((s, q) => s + q.progress, 0) /
            byQuarter.filter((q) => q.count > 0).length
        )
      : 0;

  return {
    yearDone,
    yearTotal,
    yearPct,
    longPct,
    longTotal: longTerm.length,
    byQuarter,
    checklistPct,
    checklistDone,
    checklistTotal: checklist.length,
    overallPct: Math.round((yearPct + longPct + quarterAvg + checklistPct) / 4) || 0,
  };
}

export function currentQuarter() {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

export function currentYear() {
  return new Date().getFullYear();
}

/** Journey narrative: where you are vs where you're going */
export function buildJourneyInsights(goals, year, quarter, weeklyReview) {
  const stats = buildProgressChartData(goals, year, weeklyReview);
  const longTerms = goals.filter((g) => isLongTermGoal(g));
  const yearGoals = goals.filter((g) => g.level === "annual" && g.year === year);
  const currentQGoals = goals.filter(
    (g) => g.level === "quarterly" && g.year === year && g.quarter === quarter
  );

  const currentQuarterPct =
    currentQGoals.length > 0
      ? Math.round(currentQGoals.reduce((s, g) => s + displayProgress(g), 0) / currentQGoals.length)
      : 0;

  const funnel = [
    {
      id: "week",
      label: "This week",
      sub: weeklyReview?.period_label || "Weekly rhythm",
      pct: stats.checklistPct,
      color: "#00ff94",
    },
    {
      id: "quarter",
      label: `Q${quarter}`,
      sub: `${currentQGoals.length} goal(s) · ${year}`,
      pct: currentQuarterPct,
      color: "#00d4ff",
    },
    {
      id: "year",
      label: `${year}`,
      sub: `${stats.yearDone} of ${stats.yearTotal} year goals done`,
      pct: stats.yearPct,
      color: "#f59e0b",
    },
    {
      id: "long",
      label: "Long term",
      sub: `${stats.longTotal} north star goal(s)`,
      pct: stats.longPct,
      color: "#a78bfa",
    },
  ];

  const yearPie = [
    {
      name: "Completed",
      value: yearGoals.filter((g) => g.status === "completed").length,
      fill: "#00d4ff",
    },
    {
      name: "In progress",
      value: yearGoals.filter((g) => g.status !== "completed").length,
      fill: "#00ff94",
    },
  ].filter((s) => s.value > 0);

  const momentumLabel =
    stats.overallPct >= 70
      ? "Strong momentum — you're on track"
      : stats.overallPct >= 40
        ? "Gaining ground — keep pushing"
        : "Early journey — every step counts";

  const destinations = longTerms.map((g) => ({
    _id: g._id,
    title: g.title,
    pct: displayProgress(g),
    targetYear: g.year,
    status: g.status,
  }));

  const activeYearFocus =
    yearGoals.find((g) => g.status !== "completed") || yearGoals[0] || null;

  const linkedCount = yearGoals.filter((g) => g.parent_id).length;
  const linkPct = yearGoals.length ? Math.round((linkedCount / yearGoals.length) * 100) : 0;

  return {
    stats,
    funnel,
    yearPie,
    momentumLabel,
    destinations,
    activeYearFocus,
    focusNow: {
      quarter: currentQuarterPct,
      quarterGoals: currentQGoals.length,
      yearCompleted: stats.yearDone,
      yearTotal: stats.yearTotal,
      weekPct: stats.checklistPct,
      linkPct,
    },
    currentQuarterPct,
  };
}
