import { useEffect, useState } from "react";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { YEAR_STATUS_OPTIONS } from "@/lib/strategy";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimpleGoalModal({
  open,
  onClose,
  mode,
  year,
  quarter,
  initial,
  projects,
  longTermGoals,
  yearGoals,
  onSubmit,
  saving,
}) {
  const isLong = mode === "long_term";
  const isYear = mode === "year";
  const emptyStep = () => ({
    title: "",
    completed: false,
    target: "",
    current: "0",
    useNumbers: false,
  });

  const [steps, setSteps] = useState([emptyStep(), emptyStep()]);

  useEffect(() => {
    if (!open) return;
    if (initial?.key_results?.length) {
      setSteps(
        initial.key_results.map((kr) => ({
          title: kr.title || "",
          completed: Boolean(kr.completed),
          target: kr.target ?? "",
          current: String(kr.current ?? 0),
          useNumbers: kr.target != null && kr.target > 0,
        }))
      );
    } else if (!isYear && !isLong) {
      setSteps([emptyStep(), emptyStep()]);
    } else {
      setSteps([]);
    }
  }, [open, initial, isYear, isLong]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const status = fd.get("status") || "active";
    const key_results = isYear || isLong
      ? []
      : steps
          .filter((s) => s.title.trim())
          .map((s) => {
            const useNumbers = s.useNumbers && s.target !== "";
            return {
              title: s.title.trim(),
              target: useNumbers ? Number(s.target) : null,
              current: useNumbers ? Number(s.current) || 0 : 0,
              unit: "",
              completed: useNumbers
                ? Number(s.current) >= Number(s.target)
                : Boolean(s.completed),
            };
          });

    let level = "quarterly";
    if (isLong) level = "long_term";
    else if (isYear) level = "annual";

    const parentRaw = fd.get("parent_id");
    const parent_id = parentRaw ? String(parentRaw) : null;

    onSubmit({
      title: fd.get("title"),
      description: fd.get("description") || "",
      level,
      year: isLong ? (fd.get("target_year") ? Number(fd.get("target_year")) : null) : Number(year),
      quarter: isYear || isLong ? null : Number(quarter),
      status,
      parent_id: isLong ? null : parent_id,
      project_ids: isYear || isLong
        ? []
        : (() => {
            const pid = fd.get("project_id");
            return pid ? [pid] : [];
          })(),
      key_results,
    });
  };

  const title = initial?._id
    ? isLong
      ? "Edit long term goal"
      : isYear
        ? "Edit year goal"
        : `Edit Q${quarter} goal`
    : isLong
      ? "Add long term goal"
      : isYear
        ? `Add year goal — ${year}`
        : `Add quarter goal — Q${quarter} ${year}`;

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Goal name" hint="What you want to achieve">
          <input
            name="title"
            className="ww-input w-full"
            defaultValue={initial?.title}
            required
            placeholder={
              isLong
                ? "e.g. Become #1 edtech in Bangladesh"
                : isYear
                  ? "e.g. 100 paying customers"
                  : "e.g. Ship referral program v1"
            }
          />
        </Field>

        <Field
          label="Goal status"
          hint={!isYear && !isLong ? "Whole objective done, or track via checklist items below" : "Mark Completed when this goal is done"}
        >
          <SelectInput
            name="status"
            defaultValue={initial?.status === "completed" ? "completed" : "active"}
          >
            {YEAR_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        {isLong ? (
          <Field label="Target year (optional)" hint="When you want to reach this long term goal">
            <input
              name="target_year"
              type="number"
              className="ww-input w-full"
              defaultValue={initial?.year ?? ""}
              placeholder="2030"
            />
          </Field>
        ) : null}

        {isYear && longTermGoals?.length > 0 ? (
          <Field label="Link to long term goal" hint="Connects this year to your big direction">
            <SelectInput
              name="parent_id"
              defaultValue={initial?.parent_id?._id || initial?.parent_id || ""}
            >
              <option value="">— Select long term goal —</option>
              {longTermGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}

        {!isYear && !isLong && yearGoals?.length > 0 ? (
          <Field label="Link to year goal" hint={`Must be a ${year} year goal`}>
            <SelectInput
              name="parent_id"
              defaultValue={initial?.parent_id?._id || initial?.parent_id || ""}
            >
              <option value="">— Select year goal —</option>
              {yearGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}

        <Field label="Notes (optional)">
          <textarea
            name="description"
            className="ww-input w-full min-h-[56px]"
            defaultValue={initial?.description}
          />
        </Field>

        {!isYear && !isLong ? (
          <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="ww-label mb-0">Checklist items</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Like project features — mark each item completed or not. Numbers are optional.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-primary inline-flex items-center gap-1 shrink-0"
                  onClick={() => setSteps((s) => [...s, emptyStep()])}
                >
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-3 space-y-2",
                      step.completed ? "border-primary/30 bg-primary/5" : "border-border bg-card/50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...steps];
                          next[i] = { ...next[i], completed: !next[i].completed };
                          setSteps(next);
                        }}
                        className="mt-1 shrink-0"
                        aria-label={step.completed ? "Mark not completed" : "Mark completed"}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </button>
                      <Field label={`Item ${i + 1}`} className="flex-1 mb-0">
                        <input
                          className="ww-input w-full text-sm"
                          value={step.title}
                          placeholder="e.g. Launch landing page"
                          onChange={(e) => {
                            const next = [...steps];
                            next[i] = { ...next[i], title: e.target.value };
                            setSteps(next);
                          }}
                        />
                      </Field>
                      {steps.length > 1 ? (
                        <button
                          type="button"
                          className="p-2 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => setSteps((s) => s.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        checked={step.useNumbers}
                        onChange={(e) => {
                          const next = [...steps];
                          next[i] = { ...next[i], useNumbers: e.target.checked };
                          setSteps(next);
                        }}
                      />
                      Track with numbers (target & current)
                    </label>
                    {step.useNumbers ? (
                      <div className="grid grid-cols-2 gap-2 ml-7">
                        <Field label="Target number" className="mb-0">
                          <input
                            type="number"
                            className="ww-input w-full text-sm"
                            value={step.target}
                            onChange={(e) => {
                              const next = [...steps];
                              next[i] = { ...next[i], target: e.target.value };
                              setSteps(next);
                            }}
                          />
                        </Field>
                        <Field label="Current number" className="mb-0">
                          <input
                            type="number"
                            className="ww-input w-full text-sm"
                            value={step.current}
                            onChange={(e) => {
                              const next = [...steps];
                              next[i] = { ...next[i], current: e.target.value };
                              setSteps(next);
                            }}
                          />
                        </Field>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            {projects?.length > 0 ? (
              <Field label="Linked project (optional)">
                <SelectInput
                  name="project_id"
                  defaultValue={initial?.project_ids?.[0]?._id || initial?.project_ids?.[0] || ""}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : null}
          </>
        ) : null}

        <button type="submit" disabled={saving} className="ww-btn ww-btn-primary w-full">
          {saving ? "Saving…" : initial?._id ? "Save changes" : "Add goal"}
        </button>
      </form>
    </Modal>
  );
}
