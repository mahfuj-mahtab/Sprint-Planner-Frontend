import { useMemo, useState } from "react";
import { Plus, Trash2, Edit3, Loader2, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import {
  CONTENT_PRIORITIES,
  CONTENT_PRIORITY_LABELS,
  CONTENT_PRIORITY_CLASS,
} from "@/lib/cms";

const emptyTemplate = {
  name: "",
  description: "",
  platform_id: "",
  title_template: "",
  body_template: "",
  default_tags: "",
  priority: "medium",
};

function tagsToString(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}
function stringToTags(s) {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function CmsTemplates({ orgId, platforms = [], templates = [], onChange }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const platformById = useMemo(() => {
    const m = new Map();
    for (const p of platforms) m.set(p._id, p);
    return m;
  }, [platforms]);

  const grouped = useMemo(() => {
    const m = new Map();
    for (const p of platforms) m.set(p._id, []);
    const unfiled = [];
    for (const t of templates) {
      const key = t.platform_id?._id || t.platform_id;
      if (key && m.has(key)) m.get(key).push(t);
      else unfiled.push(t);
    }
    if (unfiled.length) m.set("__unfiled__", unfiled);
    return m;
  }, [platforms, templates]);

  const openCreate = () => {
    setModal({
      template: null,
      draft: { ...emptyTemplate, platform_id: platforms[0]?._id || "" },
    });
  };

  const openEdit = (tpl) => {
    setModal({
      template: tpl,
      draft: {
        name: tpl.name || "",
        description: tpl.description || "",
        platform_id: tpl.platform_id?._id || tpl.platform_id || "",
        title_template: tpl.title_template || "",
        body_template: tpl.body_template || "",
        default_tags: tagsToString(tpl.default_tags),
        priority: tpl.priority || "medium",
      },
    });
  };

  const close = () => setModal(null);

  const save = async () => {
    if (!modal) return;
    const { template, draft } = modal;
    if (!draft.name.trim()) {
      toast.error("Template name is required", { theme: "dark" });
      return;
    }
    if (!draft.platform_id) {
      toast.error("Platform is required", { theme: "dark" });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description?.trim() || "",
      platform_id: draft.platform_id,
      title_template: draft.title_template || "",
      body_template: draft.body_template || "",
      default_tags: stringToTags(draft.default_tags),
      priority: draft.priority,
    };
    setSaving(true);
    try {
      if (template) {
        await api.patch(`/api/v1/org/${orgId}/cms/templates/${template._id}`, payload);
        toast.success("Template updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/cms/templates`, payload);
        toast.success("Template created", { theme: "dark" });
      }
      close();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tpl) => {
    if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/templates/${tpl._id}`);
      toast.success("Template deleted", { theme: "dark" });
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Templates</h2>
          <p className="text-xs text-muted-foreground">
            Reusable blueprints for posts. Pick a template to spin up new content quickly.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!platforms.length}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> New template
        </button>
      </div>

      {!platforms.length ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          Create a platform first, then add templates.
        </div>
      ) : null}

      {[...grouped.entries()].map(([platformId, list]) => {
        if (!list.length) return null;
        const platform = platformId === "__unfiled__" ? null : platformById.get(platformId);
        return (
          <div key={platformId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              {platform ? (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: platform.color || "#94a3b8" }}
                />
              ) : (
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <h3 className="text-sm font-semibold">
                {platform ? platform.name : "Unfiled templates"}
              </h3>
              <span className="text-xs text-muted-foreground">
                {list.length} template{list.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {list.map((tpl) => (
                <div key={tpl._id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{tpl.name}</div>
                      {tpl.description ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {tpl.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(tpl)}
                        className="p-1.5 rounded border border-border hover:border-primary/40"
                        aria-label="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(tpl)}
                        className="p-1.5 rounded border border-border hover:border-destructive/60 text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tpl.title_template ? (
                    <div className="text-xs rounded bg-muted/30 px-2 py-1">
                      <span className="text-muted-foreground mr-1">Title:</span>
                      {tpl.title_template}
                    </div>
                  ) : null}
                  {tpl.body_template ? (
                    <div className="text-xs rounded bg-muted/30 px-2 py-1.5 whitespace-pre-wrap line-clamp-3">
                      <span className="text-muted-foreground mr-1">Body:</span>
                      {tpl.body_template}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border",
                        CONTENT_PRIORITY_CLASS[tpl.priority] || CONTENT_PRIORITY_CLASS.medium
                      )}
                    >
                      {CONTENT_PRIORITY_LABELS[tpl.priority] || tpl.priority}
                    </span>
                    {Array.isArray(tpl.default_tags) && tpl.default_tags.length
                      ? tpl.default_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/20"
                          >
                            #{tag}
                          </span>
                        ))
                      : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.template ? "Edit template" : "New content template"}
        size="lg"
      >
        {modal ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  className="ww-input w-full"
                  value={modal.draft.name}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, name: e.target.value } })}
                />
              </Field>
              <Field label="Platform">
                <SelectInput
                  value={modal.draft.platform_id}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, platform_id: e.target.value } })}
                >
                  <option value="">Select…</option>
                  {platforms.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <Field label="Description">
              <input
                className="ww-input w-full"
                value={modal.draft.description}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, description: e.target.value } })}
                placeholder="Short description"
              />
            </Field>
            <Field label="Title template" hint="Use {placeholders} if you need variables later.">
              <input
                className="ww-input w-full"
                value={modal.draft.title_template}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, title_template: e.target.value } })}
              />
            </Field>
            <Field label="Body template">
              <textarea
                className="ww-input w-full min-h-[120px]"
                value={modal.draft.body_template}
                onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, body_template: e.target.value } })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Default tags" hint="Comma separated">
                <input
                  className="ww-input w-full"
                  value={modal.draft.default_tags}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, default_tags: e.target.value } })}
                />
              </Field>
              <Field label="Priority">
                <SelectInput
                  value={modal.draft.priority}
                  onChange={(e) => setModal({ ...modal, draft: { ...modal.draft, priority: e.target.value } })}
                >
                  {CONTENT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{CONTENT_PRIORITY_LABELS[p]}</option>
                  ))}
                </SelectInput>
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
                {modal.template ? "Save changes" : "Create template"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
