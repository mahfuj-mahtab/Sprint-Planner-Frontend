import { useEffect, useState } from "react";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { GOAL_TYPE_PRESETS, GOAL_STATUS_LABELS } from "@/lib/strategy";
import { cn } from "@/lib/utils";
import { Flag, Target, Zap } from "lucide-react";

const ICONS = { target: Target, flag: Flag, zap: Zap };

export function GoalFormModal({
  open = false,
  onClose,
  initial,
  pillars,
  projects,
  enums,
  filterYear,
  onSubmit,
  saving,
}) {
  const preset = GOAL_TYPE_PRESETS.find((p) => p.level === initial?.level) || GOAL_TYPE_PRESETS[0];
  const [type, setType] = useState(preset.id);

  useEffect(() => {
    if (!open) return;
    const p = GOAL_TYPE_PRESETS.find((x) => x.level === initial?.level) || GOAL_TYPE_PRESETS[0];
    setType(p.id);
    setKrs(
      initial?.key_results?.length
        ? initial.key_results.map((kr) => ({
            title: kr.title || "",
            target: kr.target ?? "",
            current: kr.current ?? 0,
            unit: kr.unit || "",
            completed: kr.completed || false,
          }))
        : [
            { title: "", target: "", current: 0, unit: "" },
            { title: "", target: "", current: 0, unit: "" },
          ]
    );
  }, [open, initial]);
  const [krs, setKrs] = useState(
    () =>
      initial?.key_results?.length
        ? initial.key_results.map((kr) => ({
            title: kr.title || "",
            target: kr.target ?? "",
            current: kr.current ?? 0,
            unit: kr.unit || "",
            completed: kr.completed || false,
          }))
        : [{ title: "", target: "", current: 0, unit: "" }, { title: "", target: "", current: 0, unit: "" }]
  );

  const selectedPreset = GOAL_TYPE_PRESETS.find((p) => p.id === type) || GOAL_TYPE_PRESETS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const key_results = krs
      .filter((kr) => kr.title.trim())
      .map((kr) => ({
        title: kr.title.trim(),
        target: kr.target !== "" ? Number(kr.target) : null,
        current: Number(kr.current) || 0,
        unit: kr.unit,
        completed: kr.completed,
      }));

    onSubmit({
      title: fd.get("title"),
      level: selectedPreset.level,
      description: fd.get("description"),
      status: fd.get("status"),
      year: fd.get("year") ? Number(fd.get("year")) : null,
      quarter: selectedPreset.level === "quarterly" && fd.get("quarter") ? Number(fd.get("quarter")) : null,
      month: fd.get("month") ? Number(fd.get("month")) : null,
      pillar_id: fd.get("pillar_id") || null,
      project_ids: fd.getAll("project_ids"),
      key_results,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?._id ? "Edit objective" : "New objective"}
      description="Objectives are qualitative; key results are measurable"
      size="lg"
    >
      {!initial?._id ? (
        <div className="grid sm:grid-cols-3 gap-2 mb-5">
          {GOAL_TYPE_PRESETS.map((p) => {
            const Icon = ICONS[p.icon] || Target;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setType(p.id)}
                className={cn(
                  "text-left rounded-xl border p-3 transition",
                  type === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
              >
                <Icon className={cn("w-4 h-4 mb-2", type === p.id ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
              </button>
            );
          })}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Objective title">
          <input
            name="title"
            className="ww-input w-full"
            defaultValue={initial?.title}
            required
            placeholder="e.g. Win our first 25 paying customers"
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            name="description"
            className="ww-input w-full min-h-[56px]"
            defaultValue={initial?.description}
            placeholder="Why this matters this quarter"
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Year">
            <input
              name="year"
              type="number"
              className="ww-input w-full"
              defaultValue={initial?.year ?? filterYear}
            />
          </Field>
          {selectedPreset.level === "quarterly" ? (
            <Field label="Quarter">
              <SelectInput name="quarter" defaultValue={initial?.quarter ?? 1}>
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
          <Field label="Status">
            <SelectInput name="status" defaultValue={initial?.status || "active"}>
              {(enums?.goal_statuses || ["active", "at_risk", "completed"]).map((s) => (
                <option key={s} value={s}>
                  {GOAL_STATUS_LABELS[s]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Strategic pillar">
          <SelectInput name="pillar_id" defaultValue={initial?.pillar_id?._id || initial?.pillar_id || ""}>
            <option value="">None</option>
            {pillars.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        {selectedPreset.level !== "annual" ? (
          <Field label="Linked projects (execution)">
            <select
              name="project_ids"
              multiple
              className="ww-input w-full min-h-[72px]"
              defaultValue={initial?.project_ids?.map((p) => p._id || p) || []}
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {(selectedPreset.level === "quarterly" || selectedPreset.level === "initiative") && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Key results</p>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => setKrs((prev) => [...prev, { title: "", target: "", current: 0, unit: "" }])}
              >
                + Add KR
              </button>
            </div>
            <div className="space-y-2">
              {krs.map((kr, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="ww-input col-span-5 text-sm"
                    placeholder="Measurable result"
                    value={kr.title}
                    onChange={(e) => {
                      const next = [...krs];
                      next[i] = { ...next[i], title: e.target.value };
                      setKrs(next);
                    }}
                  />
                  <input
                    type="number"
                    className="ww-input col-span-2 text-sm"
                    placeholder="Target"
                    value={kr.target}
                    onChange={(e) => {
                      const next = [...krs];
                      next[i] = { ...next[i], target: e.target.value };
                      setKrs(next);
                    }}
                  />
                  <input
                    type="number"
                    className="ww-input col-span-2 text-sm"
                    placeholder="Now"
                    value={kr.current}
                    onChange={(e) => {
                      const next = [...krs];
                      next[i] = { ...next[i], current: e.target.value };
                      setKrs(next);
                    }}
                  />
                  <input
                    className="ww-input col-span-2 text-sm"
                    placeholder="Unit"
                    value={kr.unit}
                    onChange={(e) => {
                      const next = [...krs];
                      next[i] = { ...next[i], unit: e.target.value };
                      setKrs(next);
                    }}
                  />
                  {krs.length > 1 ? (
                    <button
                      type="button"
                      className="col-span-1 text-muted-foreground text-xs"
                      onClick={() => setKrs((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  ) : (
                    <span className="col-span-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="ww-btn ww-btn-primary w-full">
          {saving ? "Saving…" : initial?._id ? "Update objective" : "Create objective"}
        </button>
      </form>
    </Modal>
  );
}
