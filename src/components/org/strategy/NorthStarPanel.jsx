import { useState } from "react";
import { Compass, Layers, Plus } from "lucide-react";
import { Field } from "@/components/org/Field";
import { cn } from "@/lib/utils";

export function NorthStarPanel({ strategy, pillars, canWrite, onSaveProfile, onEditPillar, saving }) {
  const [values, setValues] = useState(() => ({
    vision_10y: strategy?.vision_10y || "",
    mission: strategy?.mission || "",
    core_values: (strategy?.core_values || []).join("\n"),
    bhag_title: strategy?.bhag_title || "",
    bhag_description: strategy?.bhag_description || "",
    bhag_target: strategy?.bhag_target || "",
    bhag_target_year: strategy?.bhag_target_year ?? "",
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({
      vision_10y: values.vision_10y,
      mission: values.mission,
      core_values: values.core_values
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      bhag_title: values.bhag_title,
      bhag_description: values.bhag_description,
      bhag_target: values.bhag_target,
      bhag_target_year: values.bhag_target_year ? Number(values.bhag_target_year) : null,
    });
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-3 ww-card-sm border-border/80 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">North star</h2>
            <p className="text-xs text-muted-foreground">Rarely changes — revisit yearly</p>
          </div>
        </div>

        <Field label="10-year vision">
          <textarea
            className="ww-input w-full min-h-[88px]"
            value={values.vision_10y}
            onChange={(e) => setValues((v) => ({ ...v, vision_10y: e.target.value }))}
            disabled={!canWrite}
            placeholder="Where is this company in 10 years?"
          />
        </Field>
        <Field label="Mission (why we exist today)">
          <textarea
            className="ww-input w-full min-h-[64px]"
            value={values.mission}
            onChange={(e) => setValues((v) => ({ ...v, mission: e.target.value }))}
            disabled={!canWrite}
          />
        </Field>
        <Field label="Core values (one per line)">
          <textarea
            className="ww-input w-full min-h-[72px]"
            value={values.core_values}
            onChange={(e) => setValues((v) => ({ ...v, core_values: e.target.value }))}
            disabled={!canWrite}
            placeholder="Customer obsession&#10;Ship fast&#10;Own outcomes"
          />
        </Field>

        <div className="rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wider">BHAG · 3–5 years</p>
          <Field label="Big goal">
            <input
              className="ww-input w-full"
              value={values.bhag_title}
              onChange={(e) => setValues((v) => ({ ...v, bhag_title: e.target.value }))}
              disabled={!canWrite}
              placeholder="e.g. 5,000 paying merchants"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Measurable target">
              <input
                className="ww-input w-full"
                value={values.bhag_target}
                onChange={(e) => setValues((v) => ({ ...v, bhag_target: e.target.value }))}
                disabled={!canWrite}
              />
            </Field>
            <Field label="By year">
              <input
                type="number"
                className="ww-input w-full"
                value={values.bhag_target_year}
                onChange={(e) => setValues((v) => ({ ...v, bhag_target_year: e.target.value }))}
                disabled={!canWrite}
              />
            </Field>
          </div>
        </div>

        {canWrite ? (
          <button type="submit" disabled={saving} className="ww-btn ww-btn-primary">
            {saving ? "Saving…" : "Save north star"}
          </button>
        ) : null}
      </form>

      <div className="lg:col-span-2 ww-card-sm border-border/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            Strategic pillars
          </h3>
          {canWrite ? (
            <button
              type="button"
              onClick={() => onEditPillar(null)}
              className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Organize OKRs by focus area: Growth, Product, Operations…
        </p>
        {pillars.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No pillars yet.</p>
        ) : (
          <ul className="space-y-2">
            {pillars.map((p) => (
              <li
                key={p._id}
                className={cn(
                  "rounded-lg border border-border px-3 py-3 flex items-center gap-3",
                  "hover:border-primary/30 transition cursor-pointer"
                )}
                onClick={() => canWrite && onEditPillar(p)}
                onKeyDown={(e) => e.key === "Enter" && canWrite && onEditPillar(p)}
                role="button"
                tabIndex={0}
              >
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.description ? <p className="text-xs text-muted-foreground truncate">{p.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
