import { SelectInput } from "@/components/org/Field";
import { categoriesForType } from "@/lib/financeCategories";

const defaultFilters = () => ({
  date_from: "",
  date_to: "",
  project_id: "",
  income_source_id: "",
  category: "",
  account_id: "",
  q: "",
  is_personal: "",
});

export function emptyTransactionFilters() {
  return defaultFilters();
}

export function FinanceTransactionFilters({
  type,
  filters,
  onChange,
  onApply,
  onClear,
  projects = [],
  incomeSources = [],
  categories = [],
  accounts = [],
  loading = false,
}) {
  const isIncome = type === "income";
  const typeCategories = categoriesForType(categories, type);

  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="rounded-xl border border-border bg-muted/15 p-3 space-y-3 mb-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">From</span>
          <input
            type="date"
            className="ww-input ww-input-md w-full"
            value={filters.date_from}
            onChange={(e) => set({ date_from: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">To</span>
          <input
            type="date"
            className="ww-input ww-input-md w-full"
            value={filters.date_to}
            onChange={(e) => set({ date_to: e.target.value })}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Project</span>
          <SelectInput value={filters.project_id} onChange={(e) => set({ project_id: e.target.value })}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Income source</span>
          <SelectInput
            value={filters.income_source_id}
            onChange={(e) => set({ income_source_id: e.target.value })}
          >
            <option value="">All sources</option>
            {incomeSources.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Category</span>
          <SelectInput value={filters.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All categories</option>
            {typeCategories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </SelectInput>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Account</span>
          <SelectInput value={filters.account_id} onChange={(e) => set({ account_id: e.target.value })}>
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </SelectInput>
        </label>
        {!isIncome ? (
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Personal</span>
            <SelectInput value={filters.is_personal} onChange={(e) => set({ is_personal: e.target.value })}>
              <option value="">All</option>
              <option value="false">Business only</option>
              <option value="true">Personal only</option>
            </SelectInput>
          </label>
        ) : null}
        <label className="space-y-1 sm:col-span-2">
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Search notes</span>
          <input
            className="ww-input ww-input-md w-full"
            placeholder="Notes…"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onApply}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          Apply filters
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onClear}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
