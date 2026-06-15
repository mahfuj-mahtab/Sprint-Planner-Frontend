import { useMemo, useState } from "react";
import { Plus, Trash2, Edit3, Loader2, Target, CheckCircle2, Archive, Trophy } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { formatCmsDate, formatNumber } from "@/lib/cms";

const METRIC_OPTIONS = [
  { value: "followers", label: "Followers" },
  { value: "subscribers", label: "Subscribers" },
  { value: "views", label: "Views" },
  { value: "posts_published", label: "Posts published" },
  { value: "engagement_rate", label: "Engagement rate (%)" },
];

const emptyGoal = {
  title: "",
  description: "",
  metric: "followers",
  platform_id: "",
  start_value: 0,
  target_value: 1000,
  target_date: "",
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function metricLabel(metric) {
  return METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric;
}

export function CmsGoals({ orgId, platforms = [], goals = [], onChange }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const platformById = useMemo(() => {
    const m = new Map();
    for (const p of platforms) m.set(p._id, p);
    return m;
  }, [platforms]);

  const visible = useMemo(() => {
    return goals.filter((g) => (showArchived ? true : !g.is_archived));
  }, [goals, showArchived]);

  const openCreate = () => {
    setModal({
      goal: null,
      draft: { ...emptyGoal, platform_id: platforms[0]?._id || "" },
    });
  };

  const openEdit = (g) => {
    setModal({
      goal: g,
      draft: {
        title: g.title || "",
        description: g.description || "",
        metric: g.metric || "followers",
        platform_id: g.platform_id?._id || g.platform_id || "",
        start_value: g.start_value ?? 0,
        target_value: g.target_value ?? 0,
        target_date: g.target_date ? new Date(g.target_date).toISOString().slice(0, 10) : "",
      },
    });
  };

  const close = () => setModal(null);

  const save = async () => {
    if (!modal) return;
    const { goal, draft } = modal;
    if (!draft.title.trim()) {
      toast.error("Goal title is required", { theme: "dark" });
      return;
    }
    if (!draft.target_value || Number(draft.target_value) <= 0) {
      toast.error("Target value must be positive", { theme: "dark" });
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description?.trim() || "",
      metric: draft.metric,
      platform_id: draft.platform_id || null,
      start_value: Number(draft.start_value) || 0,
      target_value: Number(draft.target_value) || 0,
      target_date: draft.target_date || null,
    };
    setSaving(true);
    try {
      if (goal) {
        await api.patch(`/api/v1/org/${orgId}/cms/goals/${goal._id}`, payload);
        toast.success("Goal updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/cms/goals`, payload);
        toast.success("Goal created", { theme: "dark" });
      }
      close();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (g) => {
    if (!window.confirm(`Delete goal "${g.title}"?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/goals/${g._id}`);
      toast.success("Goal deleted", { theme: "dark" });
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  const archive = async (g) => {
    try {
      await api.patch(`/api/v1/org/${orgId}/cms/goals/${g._id}`, { is_archived: !g.is_archived });
      toast.success(g.is_archived ? "Goal restored" : "Goal archived", { theme: "dark" });
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed", { theme: "dark" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Growth Goals</h2>
          <p className="text-xs text-muted-foreground">
            Set measurable targets for each platform and track progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show archived
          </label>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> New goal
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          No goals yet. Create one to start tracking growth.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {visible.map((g) => {
            const platform = g.platform_id?._id
              ? platformById.get(g.platform_id._id)
              : platformById.get(g.platform_id);
            const start = Number(g.start_value) || 0;
            const target = Number(g.target_value) || 1;
            // We don't have current_value; estimate from dashboard data passed in would require a fetch.
            // Use a placeholder current = start so bar shows start baseline; parent can compute current separately.
            const current = start;
            const span = Math.max(target - start, 1);
            const progress = Math.min(100, Math.max(0, ((current - start) / span) * 100));
            const achieved = !!g.achieved_at;
            const days = daysUntil(g.target_date);
            return (
              <div
                key={g._id}
                className={cn(
                  "rounded-xl border p-4 space-y-3 bg-card",
                  achieved ? "border-emerald-500/40" : g.is_archived ? "border-border opacity-60" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {achieved ? (
                        <Trophy className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Target className="w-4 h-4 text-primary" />
                      )}
                      <h3 className="text-sm font-semibold">{g.title}</h3>
                    </div>
                    {g.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {g.description}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded border border-border">
                        {metricLabel(g.metric)}
                      </span>
                      {platform ? (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: platform.color || "#94a3b8" }}
                          />
                          {platform.name}
                        </span>
                      ) : (
                        <span>Org-wide</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded border border-border hover:border-primary/40"
                      aria-label="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => archive(g)}
                      className="p-1.5 rounded border border-border hover:border-amber-500/40"
                      aria-label={g.is_archived ? "Restore" : "Archive"}
                      title={g.is_archived ? "Restore" : "Archive"}
                    >
                      {g.is_archived ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(g)}
                      className="p-1.5 rounded border border-border hover:border-destructive/60 text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatNumber(start)} → {formatNumber(target)}</span>
                    {achieved ? (
                      <span className="text-emerald-300">Achieved {formatCmsDate(g.achieved_at)}</span>
                    ) : g.target_date ? (
                      <span>
                        {days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                      </span>
                    ) : (
                      <span>No deadline</span>
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={cn("h-full", achieved ? "bg-emerald-500" : "bg-primary")}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.goal ? "Edit goal" : "New growth goal"}
        size="md"
      >
        {modal ? (
          <div className="space-y-3">
            <Field label="Title">
              <input
                className="ww-input w-full"
                value={modal.draft.title}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, title: e.target.value } })}
                placeholder="e.g. Reach 10k followers on Instagram"
              />
            </Field>
            <Field label="Description">
              <textarea
                className="ww-input w-full min-h-[60px]"
                value={modal.draft.description}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, description: e.target.value } })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Metric">
                <SelectInput
                  value={modal.draft.metric}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, metric: e.target.value } })}
                >
                  {METRIC_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Platform" hint="Optional for org-wide goals">
                <SelectInput
                  value={modal.draft.platform_id}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, platform_id: e.target.value } })}
                >
                  <option value="">Org-wide</option>
                  {platforms.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Start">
                <input
                  type="number"
                  className="ww-input w-full"
                  value={modal.draft.start_value}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, start_value: e.target.value } })}
                />
              </Field>
              <Field label="Target">
                <input
                  type="number"
                  className="ww-input w-full"
                  value={modal.draft.target_value}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, target_value: e.target.value } })}
                />
              </Field>
              <Field label="Target date">
                <input
                  type="date"
                  className="ww-input w-full"
                  value={modal.draft.target_date}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, target_date: e.target.value } })}
                />
              </Field>
            </div>
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
                {modal.goal ? "Save changes" : "Create goal"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
