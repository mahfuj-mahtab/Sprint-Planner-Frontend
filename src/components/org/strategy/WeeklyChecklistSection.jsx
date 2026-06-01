import { useEffect, useState } from "react";
import { CheckSquare, Loader2, Plus, Trash2 } from "lucide-react";
import { Field } from "@/components/org/Field";
import { toast } from "react-toastify";

export function WeeklyChecklistSection({
  weeklyReview,
  checklistTemplate,
  canWrite,
  saving,
  onSaveTemplate,
  onSaveWeek,
}) {
  const [templateItems, setTemplateItems] = useState([]);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);

  useEffect(() => {
    const source =
      checklistTemplate?.length > 0
        ? checklistTemplate
        : (weeklyReview?.checklist || []).map(({ label, category }) => ({ label, category }));
    setTemplateItems(source.length ? source.map((t) => ({ label: t.label, category: t.category || "growth" })) : []);
  }, [checklistTemplate, weeklyReview]);

  const checklist = weeklyReview?.checklist || [];

  const saveTemplate = async () => {
    const cleaned = templateItems.filter((t) => t.label.trim());
    if (!cleaned.length) {
      toast.error("Add at least one checklist item");
      return;
    }
    await onSaveTemplate(cleaned);
    setEditingTemplate(false);
  };

  const addTemplateItem = () => {
    const label = newItemLabel.trim();
    if (!label) return;
    setTemplateItems((prev) => [...prev, { label, category: "growth" }]);
    setNewItemLabel("");
  };

  const handleWeekSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = checklist.map((item, i) => ({
      ...item,
      done: fd.get(`check_${i}`) === "on",
    }));
    onSaveWeek(updated);
  };

  return (
    <section className="ww-card-sm border-border/80 p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#00d4ff]" />
          Weekly checklist
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          First set <strong className="text-foreground">your items</strong> (reused every week). Then tick them off for{" "}
          {weeklyReview?.period_label || "this week"}.
        </p>
      </div>

      {/* Template editor */}
      <div className="rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">My checklist items (every week)</h3>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setEditingTemplate(!editingTemplate)}
              className="text-xs text-primary hover:underline"
            >
              {editingTemplate ? "Done editing list" : "Edit my items"}
            </button>
          ) : null}
        </div>

        {editingTemplate && canWrite ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <Field label="New checklist item" className="flex-1 mb-0">
                <input
                  className="ww-input w-full"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="e.g. Post 2 LinkedIn updates"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTemplateItem())}
                />
              </Field>
              <button
                type="button"
                onClick={addTemplateItem}
                className="ww-btn border border-border inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <ul className="space-y-2">
              {templateItems.map((item, i) => (
                <li key={i} className="flex gap-2 items-center">
                  <Field label={`Item ${i + 1}`} className="flex-1 mb-0">
                    <input
                      className="ww-input w-full text-sm"
                      value={item.label}
                      onChange={(e) => {
                        const next = [...templateItems];
                        next[i] = { ...next[i], label: e.target.value };
                        setTemplateItems(next);
                      }}
                    />
                  </Field>
                  <button
                    type="button"
                    className="p-2 mt-5 text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => setTemplateItems((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={saving}
              onClick={saveTemplate}
              className="ww-btn ww-btn-primary inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save my checklist items
            </button>
          </div>
        ) : (
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {(templateItems.length ? templateItems : checklist).map((item, i) => (
              <li key={i} className="text-foreground">
                {item.label}
              </li>
            ))}
            {templateItems.length === 0 && checklist.length === 0 ? (
              <li className="list-none text-muted-foreground italic">No items yet — click Edit my items</li>
            ) : null}
          </ol>
        )}
      </div>

      {/* This week */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          This week ({weeklyReview?.period_label || "current"})
        </h3>
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add checklist items above, then save. They will show here every week.
          </p>
        ) : (
          <form onSubmit={handleWeekSubmit} className="space-y-3 max-w-3xl">
            {checklist.map((item, i) => (
              <label
                key={item._id || i}
                className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  name={`check_${i}`}
                  defaultChecked={item.done}
                  disabled={!canWrite}
                  className="mt-1 rounded"
                />
                <span className="text-sm flex-1">{item.label}</span>
              </label>
            ))}
            {canWrite ? (
              <button type="submit" disabled={saving} className="ww-btn ww-btn-primary">
                Save this week&apos;s ticks
              </button>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
