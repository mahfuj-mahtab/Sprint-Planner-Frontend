export const INCOME_SOURCE_TYPES = [
  { value: "product", label: "Product" },
  { value: "client", label: "Client work" },
  { value: "content", label: "Content (YouTube, etc.)" },
  { value: "employment", label: "Employment" },
  { value: "other", label: "Other" },
];

export const INCOME_SOURCE_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "started", label: "Started" },
  { value: "working", label: "Working" },
  { value: "live", label: "Live" },
  { value: "hold", label: "On hold" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
];

export const INCOME_SOURCE_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "later", label: "Later" },
];

export const normalizeIncomeSourcePriority = (priority) => {
  const value = String(priority || "").toLowerCase();
  if (value === "high" || value === "medium" || value === "low" || value === "later") {
    return value;
  }
  return "medium";
};

export const priorityLabel = (priority) =>
  INCOME_SOURCE_PRIORITIES.find((p) => p.value === normalizeIncomeSourcePriority(priority))?.label || "Medium";

export const incomeSourcePriorityRank = (priority) => {
  switch (normalizeIncomeSourcePriority(priority)) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    case "later":
      return 3;
    default:
      return 1;
  }
};

export const priorityBadgeClass = (priority) => {
  switch (normalizeIncomeSourcePriority(priority)) {
    case "high":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "medium":
      return "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30";
    case "low":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "later":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30";
  }
};

export const statusLabel = (status) =>
  INCOME_SOURCE_STATUSES.find((s) => s.value === status)?.label || status;

export const typeLabel = (type) =>
  INCOME_SOURCE_TYPES.find((t) => t.value === type)?.label || type;

export const statusBadgeClass = (status) => {
  switch (status) {
    case "live":
    case "working":
      return "bg-primary/15 text-primary border-primary/30";
    case "started":
      return "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30";
    case "hold":
    case "paused":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
};

export const periodYearlyTotal = (period) => {
  const monthly = Number(period?.monthly_income);
  if (monthly > 0) return monthly * 12;
  return Number(period?.yearly_income) || 0;
};

export const formatMonthsAsDuration = (months) => {
  const m = Number(months) || 0;
  if (m === 0) return "Immediately";
  if (m % 12 === 0) {
    const y = m / 12;
    return y === 1 ? "1 year" : `${y} years`;
  }
  return `${m} months`;
};

export const emptyForecastRow = (index) => ({
  period_index: index,
  monthly_income: "",
  yearly_income: "",
});

export const EXPECTED_EARNING_PERIODS = [
  { value: "monthly", label: "Per month" },
  { value: "yearly", label: "Per year" },
];

export const normalizeExpectedFromForm = (amount, period) => {
  const amt = Number(amount);
  if (!amt || amt <= 0) return { monthly: 0, yearly: 0 };
  const p = period === "yearly" ? "yearly" : "monthly";
  const monthly = p === "yearly" ? amt / 12 : amt;
  return { monthly, yearly: monthly * 12 };
};

export const defaultForm = (defaultCurrency = "BDT") => ({
  name: "",
  description: "",
  type: "content",
  status: "idea",
  priority: "medium",
  currency: defaultCurrency,
  planned_investment: "",
  expected_earning_amount: "",
  expected_earning_period: "monthly",
  revenue_start_after_months: "24",
  started_at: new Date().toISOString().slice(0, 10),
  project_id: "",
  notes: "",
  forecast_periods: [
    { period_index: 1, monthly_income: "", yearly_income: "50" },
    { period_index: 2, monthly_income: "200", yearly_income: "" },
  ],
});
