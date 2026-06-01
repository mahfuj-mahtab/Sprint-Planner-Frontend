import { useEffect, useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import { Field, SelectInput } from "@/components/org/Field";
import { cn } from "@/lib/utils";
import { hasLongTermContent } from "@/lib/strategy";

export function LongTermSection({ strategy, canWrite, onSave, saving }) {
  const [form, setForm] = useState({
    vision_10y: "",
    bhag_title: "",
    bhag_target: "",
    bhag_target_year: "",
    long_term_completed: false,
  });

  useEffect(() => {
    if (!strategy) return;
    setForm({
      vision_10y: strategy.vision_10y || "",
      bhag_title: strategy.bhag_title || "",
      bhag_target: strategy.bhag_target || "",
      bhag_target_year: strategy.bhag_target_year ?? "",
      long_term_completed: Boolean(strategy.long_term_completed),
    });
  }, [strategy]);

  const filled = hasLongTermContent(strategy);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      vision_10y: form.vision_10y,
      bhag_title: form.bhag_title,
      bhag_target: form.bhag_target,
      bhag_target_year: form.bhag_target_year ? Number(form.bhag_target_year) : null,
      long_term_completed: form.long_term_completed,
    });
  };

  return (
    <section className="ww-card-sm border-[#a78bfa]/30 bg-gradient-to-br from-[#a78bfa]/10 via-card to-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl border border-[#a78bfa]/40 bg-[#a78bfa]/15 flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#a78bfa]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Long term goal</h2>
            <p className="text-sm text-muted-foreground">5–10 year direction for this organization</p>
          </div>
        </div>
        {filled ? (
          <span
            className={cn(
              "text-xs font-medium px-3 py-1 rounded-full border",
              form.long_term_completed
                ? "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30"
                : "bg-primary/15 text-primary border-primary/30"
            )}
          >
            {form.long_term_completed ? "Completed" : "In progress"}
          </span>
        ) : null}
      </div>

      {!filled && !canWrite ? (
        <p className="text-sm text-muted-foreground italic">No long term goal set yet.</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-5">
          <Field label="Long term vision" hint="Where is this company in 5–10 years?">
            <textarea
              className="ww-input w-full min-h-[100px]"
              value={form.vision_10y}
              onChange={(e) => setForm((f) => ({ ...f, vision_10y: e.target.value }))}
              disabled={!canWrite}
              placeholder="e.g. Become the #1 platform for freelancers in Bangladesh"
            />
          </Field>
          <div className="space-y-5">
            <Field label="Big goal (headline)">
              <input
                className="ww-input w-full"
                value={form.bhag_title}
                onChange={(e) => setForm((f) => ({ ...f, bhag_title: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. 100,000 active users"
              />
            </Field>
            <Field label="Measurable target">
              <input
                className="ww-input w-full"
                value={form.bhag_target}
                onChange={(e) => setForm((f) => ({ ...f, bhag_target: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. $1M ARR, 50k merchants"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Target year">
                <input
                  type="number"
                  className="ww-input w-full"
                  value={form.bhag_target_year}
                  onChange={(e) => setForm((f) => ({ ...f, bhag_target_year: e.target.value }))}
                  disabled={!canWrite}
                  placeholder="2030"
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={form.long_term_completed ? "completed" : "active"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      long_term_completed: e.target.value === "completed",
                    }))
                  }
                  disabled={!canWrite}
                >
                  <option value="active">In progress</option>
                  <option value="completed">Completed</option>
                </SelectInput>
              </Field>
            </div>
          </div>
          {canWrite ? (
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="ww-btn ww-btn-primary inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save long term goal
              </button>
            </div>
          ) : null}
        </form>
      )}
    </section>
  );
}
