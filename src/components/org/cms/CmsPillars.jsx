import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";

const PILLAR_PRESETS = [
  "#ec4899", "#f97316", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

const emptyPillar = {
  name: "",
  description: "",
  color: PILLAR_PRESETS[0],
  platform_id: "",
  target_share: 25,
};

export function CmsPillars({ orgId, platforms = [], pillars = [], content = [], onChange }) {
  const [pillarModal, setPillarModal] = useState(null); // { pillar?, draft }
  const [saving, setSaving] = useState(false);

  const platformById = useMemo(() => {
    const m = new Map();
    for (const p of platforms) m.set(p._id, p);
    return m;
  }, [platforms]);

  // Current distribution (count of content items per pillar)
  const contentByPillar = useMemo(() => {
    const m = new Map();
    for (const c of content) {
      if (!c.pillar_id) continue;
      m.set(c.pillar_id, (m.get(c.pillar_id) || 0) + 1);
    }
    return m;
  }, [content]);

  const totalAssigned = useMemo(() => {
    let t = 0;
    for (const v of contentByPillar.values()) t += v;
    return t;
  }, [contentByPillar]);

  const openCreate = () => {
    setPillarModal({
      pillar: null,
      draft: {
        ...emptyPillar,
        platform_id: platforms[0]?._id || "",
      },
    });
  };

  const openEdit = (pillar) => {
    setPillarModal({
      pillar,
      draft: {
        name: pillar.name || "",
        description: pillar.description || "",
        color: pillar.color || PILLAR_PRESETS[0],
        platform_id: pillar.platform_id?._id || pillar.platform_id || "",
        target_share: pillar.target_share ?? 25,
      },
    });
  };

  const close = () => setPillarModal(null);

  const save = async () => {
    if (!pillarModal) return;
    const { pillar, draft } = pillarModal;
    if (!draft.name.trim()) {
      toast.error("Pillar name is required", { theme: "dark" });
      return;
    }
    if (!draft.platform_id) {
      toast.error("Platform is required", { theme: "dark" });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description?.trim() || "",
      color: draft.color,
      platform_id: draft.platform_id,
      target_share: Number(draft.target_share) || 0,
    };
    setSaving(true);
    try {
      if (pillar) {
        await api.patch(`/api/v1/org/${orgId}/cms/pillars/${pillar._id}`, payload);
        toast.success("Pillar updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/cms/pillars`, payload);
        toast.success("Pillar created", { theme: "dark" });
      }
      close();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pillar) => {
    if (!window.confirm(`Delete pillar "${pillar.name}"?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/pillars/${pillar._id}`);
      toast.success("Pillar deleted", { theme: "dark" });
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  // Group pillars by platform
  const grouped = useMemo(() => {
    const m = new Map();
    for (const p of platforms) m.set(p._id, []);
    for (const pil of pillars) {
      const key = pil.platform_id?._id || pil.platform_id;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(pil);
    }
    return m;
  }, [platforms, pillars]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Pillars</h2>
          <p className="text-xs text-muted-foreground">
            Define the themes that structure your content mix for each platform.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!platforms.length}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> New pillar
        </button>
      </div>

      {!platforms.length ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          Create a platform first, then add pillars to it.
        </div>
      ) : null}

      {[...grouped.entries()].map(([platformId, list]) => {
        const platform = platformById.get(platformId);
        if (!platform) return null;
        return (
          <div key={platformId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: platform.color || "#94a3b8" }}
              />
              <h3 className="text-sm font-semibold">{platform.name}</h3>
              <span className="text-xs text-muted-foreground">
                {list.length} pillar{list.length === 1 ? "" : "s"}
              </span>
            </div>

            {list.length === 0 ? (
              <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 text-center">
                No pillars yet for this platform.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((pil) => {
                  const count = contentByPillar.get(pil._id) || 0;
                  const actualPct = totalAssigned ? Math.round((count / totalAssigned) * 100) : 0;
                  const target = pil.target_share ?? 0;
                  return (
                    <div
                      key={pil._id}
                      className="rounded-lg border border-border p-3 space-y-2"
                      style={{ borderLeft: `4px solid ${pil.color || "#94a3b8"}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{pil.name}</div>
                          {pil.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {pil.description}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(pil)}
                            className="p-1.5 rounded border border-border hover:border-primary/40"
                            aria-label="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(pil)}
                            className="p-1.5 rounded border border-border hover:border-destructive/60 text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Target {target}%</span>
                          <span>Actual {actualPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full" style={{ width: `${Math.min(actualPct, 100)}%`, backgroundColor: pil.color || "#94a3b8" }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {count} item{count === 1 ? "" : "s"} assigned
                          {target > 0 && Math.abs(actualPct - target) > 10 ? (
                            <span className="ml-1 text-amber-300">
                              <Sparkles className="inline w-3 h-3 mr-0.5" />
                              {actualPct > target ? "over" : "under"} target
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <Modal
        open={!!pillarModal}
        onClose={close}
        title={pillarModal?.pillar ? "Edit pillar" : "New content pillar"}
        description="Pillars help you keep a balanced content mix."
        size="md"
      >
        {pillarModal ? (
          <div className="space-y-3">
            <Field label="Name">
              <input
                className="ww-input w-full"
                value={pillarModal.draft.name}
                onChange={(e) =>
                  setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, name: e.target.value } })
                }
                placeholder="e.g. Behind the scenes"
              />
            </Field>
            <Field label="Description">
              <textarea
                className="ww-input w-full min-h-[80px]"
                value={pillarModal.draft.description}
                onChange={(e) =>
                  setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, description: e.target.value } })
                }
                placeholder="What is this pillar about?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Platform">
                <SelectInput
                  value={pillarModal.draft.platform_id}
                  onChange={(e) =>
                    setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, platform_id: e.target.value } })
                  }
                >
                  <option value="">Select…</option>
                  {platforms.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Target share (%)" hint="0–100">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="ww-input w-full"
                  value={pillarModal.draft.target_share}
                  onChange={(e) =>
                    setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, target_share: e.target.value } })
                  }
                />
              </Field>
            </div>
            <Field label="Color">
              <div className="flex items-center gap-2 flex-wrap">
                {PILLAR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, color: c } })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2",
                      pillarModal.draft.color === c ? "border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={pillarModal.draft.color}
                  onChange={(e) =>
                    setPillarModal({ ...pillarModal, draft: { ...pillarModal.draft, color: e.target.value } })
                  }
                  className="w-8 h-8 rounded border border-border bg-transparent"
                />
              </div>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="px-3 py-1.5 text-sm rounded-lg border border-border">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {pillarModal.pillar ? "Save changes" : "Create pillar"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
