import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  BarChart3,
  Columns3,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Settings2,
  Trash2,
  Video,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { OrgSubnav } from "@/components/org/OrgSubnav";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { Skeleton } from "@/components/ui/Loading";
import { useBlockClientOrgRoutes } from "@/hooks/useBlockClientOrgRoutes";
import { ContentBoard } from "@/components/org/cms/ContentBoard";
import { CmsDashboardPanel } from "@/components/org/cms/CmsDashboardPanel";
import {
  CONTENT_PRIORITIES,
  CONTENT_PRIORITY_LABELS,
  formatCmsDateTime,
  formatNumber,
  statusBadgeStyle,
} from "@/lib/cms";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "board", label: "Content board", icon: Columns3 },
  { id: "platforms", label: "Platforms", icon: Layers },
];

const emptyPlatformForm = { name: "", description: "", color: "#ec4899" };
const emptyStatusForm = {
  name: "",
  color: "#94a3b8",
  is_scheduled_stage: false,
  is_published_stage: false,
};
const emptyContentForm = {
  title: "",
  description: "",
  notes: "",
  priority: "medium",
  status_id: "",
  scheduled_at: "",
  published_at: "",
  tags: "",
};
const emptyAnalyticsForm = {
  recorded_at: "",
  views: "",
  likes: "",
  comments: "",
  shares: "",
  clicks: "",
  watch_time_minutes: "",
  subscribers_gained: "",
  notes: "",
};

export default function OrgCms() {
  useBlockClientOrgRoutes();
  const { orgId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const platformParam = searchParams.get("platform");

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [canWrite, setCanWrite] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const [platformModal, setPlatformModal] = useState(null);
  const [platformForm, setPlatformForm] = useState(emptyPlatformForm);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState(emptyStatusForm);
  const [statusBulkList, setStatusBulkList] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [contentModal, setContentModal] = useState(null);
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [analyticsModal, setAnalyticsModal] = useState(null);
  const [analyticsForm, setAnalyticsForm] = useState(emptyAnalyticsForm);
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  const activePlatform = useMemo(() => {
    if (!platforms.length) return null;
    if (platformParam) {
      return platforms.find((p) => p._id === platformParam) || platforms[0];
    }
    return platforms[0];
  }, [platforms, platformParam]);

  const loadOverview = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await api.get(`/api/v1/org/${orgId}/cms/overview`);
      setPlatforms(r.data?.platforms || []);
      setCanWrite(Boolean(r.data?.can_write));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load CMS", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const loadDashboard = useCallback(async () => {
    if (!orgId) return;
    setDashboardLoading(true);
    try {
      const r = await api.get(`/api/v1/org/${orgId}/cms/dashboard`);
      setDashboard(r.data?.dashboard || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load dashboard", { theme: "dark" });
    } finally {
      setDashboardLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadOverview();
    loadDashboard();
  }, [loadOverview, loadDashboard]);

  const refreshAll = async () => {
    await Promise.all([loadOverview(), loadDashboard()]);
  };

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    setSearchParams(next);
  };

  const setActivePlatformId = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("platform", id);
    if (!next.get("tab")) next.set("tab", "board");
    setSearchParams(next);
  };

  const openPlatformCreate = () => {
    setPlatformForm(emptyPlatformForm);
    setPlatformModal({ mode: "create" });
  };

  const openPlatformEdit = (platform) => {
    setPlatformForm({
      name: platform.name,
      description: platform.description || "",
      color: platform.color || "#ec4899",
    });
    setPlatformModal({ mode: "edit", platform });
  };

  const savePlatform = async () => {
    if (!platformForm.name.trim()) {
      toast.error("Platform name is required", { theme: "dark" });
      return;
    }
    setSaving(true);
    try {
      if (platformModal?.mode === "edit") {
        await api.patch(`/api/v1/org/${orgId}/cms/platforms/${platformModal.platform._id}`, platformForm);
        toast.success("Platform updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/cms/platforms`, platformForm);
        toast.success("Platform created with default statuses", { theme: "dark" });
      }
      setPlatformModal(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const deletePlatform = async (platform) => {
    if (!window.confirm(`Delete "${platform.name}" and all its content?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/platforms/${platform._id}`);
      toast.success("Platform deleted", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  const openStatusCreate = (platform) => {
    setStatusForm(emptyStatusForm);
    setStatusModal({ mode: "create", platform });
  };

  const openStatusBulkEdit = (platform) => {
    const sorted = [...(platform.statuses || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setStatusBulkList(
      sorted.map((s) => ({
        _id: s._id,
        name: s.name,
        color: s.color || "#94a3b8",
        is_scheduled_stage: Boolean(s.is_scheduled_stage),
        is_published_stage: Boolean(s.is_published_stage),
        selected: false,
      }))
    );
    setStatusModal({ mode: "bulk", platform });
  };

  const saveBulkStatuses = async () => {
    if (!statusModal?.platform) return;
    setBulkSaving(true);
    try {
      const original = statusModal.platform.statuses || [];
      const patches = [];
      for (const s of statusBulkList) {
        const orig = original.find((o) => o._id === s._id) || {};
        const changed =
          s.name !== orig.name || s.color !== orig.color || s.is_scheduled_stage !== Boolean(orig.is_scheduled_stage) || s.is_published_stage !== Boolean(orig.is_published_stage);
        if (s.selected && changed) {
          patches.push(api.patch(`/api/v1/org/${orgId}/cms/statuses/${s._id}`, {
            name: s.name,
            color: s.color,
            is_scheduled_stage: s.is_scheduled_stage,
            is_published_stage: s.is_published_stage,
          }));
        } else if (s.selected && !changed) {
          // still include to mark selection intention? skip
        }
      }
      await Promise.all(patches);
      toast.success("Bulk update applied", { theme: "dark" });
      setStatusModal(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk update failed", { theme: "dark" });
    } finally {
      setBulkSaving(false);
    }
  };

  const openStatusEdit = (platform, status) => {
    setStatusForm({
      name: status.name,
      color: status.color || "#94a3b8",
      is_scheduled_stage: Boolean(status.is_scheduled_stage),
      is_published_stage: Boolean(status.is_published_stage),
    });
    setStatusModal({ mode: "edit", platform, status });
  };

  const saveStatus = async () => {
    if (!statusForm.name.trim()) {
      toast.error("Status name is required", { theme: "dark" });
      return;
    }
    setSaving(true);
    try {
      if (statusModal?.mode === "edit") {
        await api.patch(`/api/v1/org/${orgId}/cms/statuses/${statusModal.status._id}`, statusForm);
        toast.success("Status updated", { theme: "dark" });
      } else {
        await api.post(
          `/api/v1/org/${orgId}/cms/platforms/${statusModal.platform._id}/statuses`,
          statusForm
        );
        toast.success("Status created", { theme: "dark" });
      }
      setStatusModal(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const deleteStatus = async (status) => {
    if (!window.confirm(`Delete status "${status.name}"? Content in this column will move elsewhere.`)) return;
    try {
      const r = await api.delete(`/api/v1/org/${orgId}/cms/statuses/${status._id}`);
      toast.success(r.data?.message || "Status deleted", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  const handleStatusDragStart = (e, platformId, index, statusId) => {
    try {
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ platformId, index, statusId })
      );
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // ignore
    }
  };

  const handleStatusDrop = async (e, platform, targetIndex) => {
    e.preventDefault();
    let payload = null;
    try {
      const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain") || "{}";
      payload = JSON.parse(raw);
    } catch (err) {
      return;
    }
    if (!payload || payload.platformId !== platform._id) return;
    const fromIndex = typeof payload.index === "number" ? payload.index : -1;
    if (fromIndex === -1 || fromIndex === targetIndex) return;

    const sorted = [...(platform.statuses || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const moving = sorted.splice(fromIndex, 1)[0];
    const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    sorted.splice(insertIndex, 0, moving);

    // Optimistically update UI
    setPlatforms((prev) =>
      prev.map((p) => {
        if (p._id !== platform._id) return p;
        return { ...p, statuses: sorted.map((s, i) => ({ ...s, sort_order: i })) };
      })
    );

    try {
      // Only patch statuses whose sort_order changed
      const patches = [];
      sorted.forEach((s, i) => {
        const old = (platform.statuses || []).find((x) => x._id === s._id);
        if (!old || (old.sort_order ?? 0) !== i) {
          patches.push(api.patch(`/api/v1/org/${orgId}/cms/statuses/${s._id}`, { sort_order: i }));
        }
      });
      await Promise.all(patches);
      toast.success("Statuses reordered", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reorder failed", { theme: "dark" });
      await refreshAll();
    }
  };

  const openContentCreate = (platform) => {
    const firstStatus = [...(platform.statuses || [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )[0];
    setContentForm({
      ...emptyContentForm,
      status_id: firstStatus?._id || "",
    });
    setContentModal({ mode: "create", platform });
  };

  const openContentEdit = (platform, content) => {
    setContentForm({
      title: content.title,
      description: content.description || "",
      notes: content.notes || "",
      priority: content.priority || "medium",
      status_id: content.status_id?._id || content.status_id || "",
      scheduled_at: content.scheduled_at ? content.scheduled_at.slice(0, 16) : "",
      published_at: content.published_at ? content.published_at.slice(0, 16) : "",
      tags: (content.tags || []).join(", "),
    });
    setContentModal({ mode: "edit", platform, content });
  };

  const saveContent = async () => {
    if (!contentForm.title.trim()) {
      toast.error("Title is required", { theme: "dark" });
      return;
    }
    setSaving(true);
    const payload = {
      title: contentForm.title.trim(),
      description: contentForm.description,
      notes: contentForm.notes,
      priority: contentForm.priority,
      status_id: contentForm.status_id,
      scheduled_at: contentForm.scheduled_at || null,
      published_at: contentForm.published_at || null,
      tags: contentForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (contentModal?.mode === "edit") {
        await api.patch(`/api/v1/org/${orgId}/cms/content/${contentModal.content._id}`, payload);
        toast.success("Content updated", { theme: "dark" });
      } else {
        await api.post(`/api/v1/org/${orgId}/cms/content`, {
          ...payload,
          platform_id: contentModal.platform._id,
        });
        toast.success("Content created", { theme: "dark" });
      }
      setContentModal(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async (content) => {
    if (!window.confirm(`Delete "${content.title}"?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/content/${content._id}`);
      toast.success("Content deleted", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  const openAnalytics = async (content) => {
    setAnalyticsForm(emptyAnalyticsForm);
    setAnalyticsModal({ content });
    try {
      const r = await api.get(`/api/v1/org/${orgId}/cms/content/${content._id}/analytics`);
      setAnalyticsHistory(r.data?.snapshots || []);
    } catch {
      setAnalyticsHistory([]);
    }
  };

  const saveAnalytics = async () => {
    setSaving(true);
    try {
      await api.post(`/api/v1/org/${orgId}/cms/content/${analyticsModal.content._id}/analytics`, {
        recorded_at: analyticsForm.recorded_at || undefined,
        views: analyticsForm.views,
        likes: analyticsForm.likes,
        comments: analyticsForm.comments,
        shares: analyticsForm.shares,
        clicks: analyticsForm.clicks,
        watch_time_minutes: analyticsForm.watch_time_minutes,
        subscribers_gained: analyticsForm.subscribers_gained,
        notes: analyticsForm.notes,
      });
      toast.success("Analytics saved", { theme: "dark" });
      const r = await api.get(
        `/api/v1/org/${orgId}/cms/content/${analyticsModal.content._id}/analytics`
      );
      setAnalyticsHistory(r.data?.snapshots || []);
      setAnalyticsForm(emptyAnalyticsForm);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const deleteAnalytics = async (snapshot) => {
    if (!window.confirm("Delete this analytics snapshot?")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/analytics/${snapshot._id}`);
      toast.success("Snapshot deleted", { theme: "dark" });
      const r = await api.get(
        `/api/v1/org/${orgId}/cms/content/${analyticsModal.content._id}/analytics`
      );
      setAnalyticsHistory(r.data?.snapshots || []);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer position="bottom-right" theme="dark" />
      <OrgSubnav
        orgId={orgId}
        eyebrow="Organization"
        title="Content management"
        icon={Video}
        accent="cyan"
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={openPlatformCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ec4899]/40 bg-[#ec4899]/10 px-3 py-2 text-sm text-[#f472b6] hover:bg-[#ec4899]/20"
            >
              <Plus className="w-4 h-4" />
              New platform
            </button>
          ) : null
        }
      />

      <div className="ww-page-full max-w-none py-6 space-y-6">
        {loading && tab !== "dashboard" ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : null}

        {tab === "dashboard" ? (
          <CmsDashboardPanel dashboard={dashboard} loading={dashboardLoading} />
        ) : null}

        {tab === "board" ? (
          <div className="space-y-4">
            {platforms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground mb-4">Create a platform (YouTube, LinkedIn, etc.) to plan content.</p>
                {canWrite ? (
                  <button
                    type="button"
                    onClick={openPlatformCreate}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#ec4899]/40 bg-[#ec4899]/10 px-4 py-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add platform
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setActivePlatformId(p._id)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition",
                        activePlatform?._id === p._id
                          ? "border-[#ec4899]/50 bg-[#ec4899]/15 text-[#f472b6]"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        activePlatform?._id === p._id
                          ? { borderColor: `${p.color}66`, color: p.color }
                          : undefined
                      }
                    >
                      {p.name}
                    </button>
                  ))}
                  {canWrite && activePlatform ? (
                    <button
                      type="button"
                      onClick={() => openContentCreate(activePlatform)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary"
                    >
                      <Plus className="w-4 h-4" />
                      New content
                    </button>
                  ) : null}
                </div>

                {activePlatform ? (
                  <ContentBoard
                    orgId={orgId}
                    platform={activePlatform}
                    statuses={activePlatform.statuses}
                    content={activePlatform.content}
                    canWrite={canWrite}
                    onRefresh={refreshAll}
                    onEdit={(item) => openContentEdit(activePlatform, item)}
                    onDelete={deleteContent}
                    onAnalytics={openAnalytics}
                  />
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {tab === "platforms" ? (
          <div className="space-y-4">
            {platforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platforms yet.</p>
            ) : (
              platforms.map((platform) => (
                <section
                  key={platform._id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platform.color || "#ec4899" }}
                      />
                      <div>
                        <h3 className="font-semibold">{platform.name}</h3>
                        {platform.description ? (
                          <p className="text-sm text-muted-foreground">{platform.description}</p>
                        ) : null}
                      </div>
                    </div>
                    {canWrite ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openStatusCreate(platform)}
                          className="text-xs px-2 py-1 rounded border border-border hover:border-[#ec4899]/40"
                        >
                          Add status
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatusBulkEdit(platform)}
                          className="text-xs px-2 py-1 rounded border border-border"
                        >
                          Bulk edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openPlatformEdit(platform)}
                          className="text-xs px-2 py-1 rounded border border-border"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePlatform(platform)}
                          className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5" />
                      Workflow statuses (drag board columns)
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const sorted = [...(platform.statuses || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                        handleStatusDrop(e, platform, sorted.length);
                      }}
                    >
                      {(() => {
                        const sorted = [...(platform.statuses || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                        return sorted.map((status, idx) => {
                          const badge = statusBadgeStyle(status.color);
                          return (
                            <div
                              key={status._id}
                              draggable={canWrite}
                              onDragStart={(e) => handleStatusDragStart(e, platform._id, idx, status._id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleStatusDrop(e, platform, idx)}
                              className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs"
                              style={badge}
                            >
                              <GripVertical className="w-3 h-3 opacity-50" />
                              <span>{status.name}</span>
                              {status.is_scheduled_stage ? (
                                <span className="opacity-70">· scheduled</span>
                              ) : null}
                              {status.is_published_stage ? (
                                <span className="opacity-70">· published</span>
                              ) : null}
                              {canWrite ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openStatusEdit(platform, status)}
                                    className="opacity-70 hover:opacity-100"
                                  >
                                    edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteStatus(status)}
                                    className="opacity-70 hover:opacity-100 text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3">
                      {(platform.content || []).length} content piece
                      {(platform.content || []).length === 1 ? "" : "s"}
                    </p>
                  </div>
                </section>
              ))
            )}
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(platformModal)}
        onClose={() => setPlatformModal(null)}
        title={platformModal?.mode === "edit" ? "Edit platform" : "New platform"}
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              className="ww-input ww-input-md w-full"
              value={platformForm.name}
              onChange={(e) => setPlatformForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="YouTube, LinkedIn, TikTok…"
            />
          </Field>
          <Field label="Description">
            <input
              className="ww-input ww-input-md w-full"
              value={platformForm.description}
              onChange={(e) => setPlatformForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="Color">
            <input
              type="color"
              className="ww-input h-10 w-full"
              value={platformForm.color}
              onChange={(e) => setPlatformForm((f) => ({ ...f, color: e.target.value }))}
            />
          </Field>
          <button
            type="button"
            disabled={saving}
            onClick={savePlatform}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save platform"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(statusModal)}
        onClose={() => setStatusModal(null)}
        title={statusModal?.mode === "bulk" ? "Bulk edit statuses" : statusModal?.mode === "edit" ? "Edit status" : "New status"}
      >
        {statusModal?.mode === "bulk" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Edit multiple statuses</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusBulkList((s) => s.map((x) => ({ ...x, selected: true })))}
                  className="text-xs px-2 py-1 rounded border"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setStatusBulkList((s) => s.map((x) => ({ ...x, selected: false })))}
                  className="text-xs px-2 py-1 rounded border"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {statusBulkList.map((s, i) => (
                <div key={s._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.selected}
                    onChange={(e) =>
                      setStatusBulkList((list) => list.map((x) => (x._id === s._id ? { ...x, selected: e.target.checked } : x)))
                    }
                  />
                  <input
                    className="ww-input ww-input-sm w-40"
                    value={s.name}
                    onChange={(e) =>
                      setStatusBulkList((list) => list.map((x) => (x._id === s._id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) =>
                      setStatusBulkList((list) => list.map((x) => (x._id === s._id ? { ...x, color: e.target.value } : x)))
                    }
                    className="w-10 h-8 p-0 border rounded"
                  />
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={s.is_scheduled_stage}
                      onChange={(e) =>
                        setStatusBulkList((list) => list.map((x) => (x._id === s._id ? { ...x, is_scheduled_stage: e.target.checked } : x)))
                      }
                    />
                    Scheduled
                  </label>
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={s.is_published_stage}
                      onChange={(e) =>
                        setStatusBulkList((list) => list.map((x) => (x._id === s._id ? { ...x, is_published_stage: e.target.checked } : x)))
                      }
                    />
                    Published
                  </label>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                disabled={bulkSaving}
                onClick={saveBulkStatuses}
                className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium"
              >
                {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Apply to selected"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Name">
              <input
                className="ww-input ww-input-md w-full"
                value={statusForm.name}
                onChange={(e) => setStatusForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Draft, Script, Recording…"
              />
            </Field>
            <Field label="Color">
              <input
                type="color"
                className="ww-input h-10 w-full"
                value={statusForm.color}
                onChange={(e) => setStatusForm((f) => ({ ...f, color: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={statusForm.is_scheduled_stage}
                onChange={(e) =>
                  setStatusForm((f) => ({ ...f, is_scheduled_stage: e.target.checked }))
                }
              />
              Marks scheduled stage (dashboard)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={statusForm.is_published_stage}
                onChange={(e) =>
                  setStatusForm((f) => ({ ...f, is_published_stage: e.target.checked }))
                }
              />
              Marks published / live stage
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={saveStatus}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save status"}
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(contentModal)}
        onClose={() => setContentModal(null)}
        title={contentModal?.mode === "edit" ? "Edit content" : "New content"}
        size="lg"
      >
        <div className="space-y-4">
          <Field label="Title">
            <input
              className="ww-input ww-input-md w-full"
              value={contentForm.title}
              onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="ww-input w-full min-h-[80px]"
              rows={3}
              value={contentForm.description}
              onChange={(e) => setContentForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <SelectInput
                value={contentForm.status_id}
                onChange={(e) => setContentForm((f) => ({ ...f, status_id: e.target.value }))}
              >
                {(contentModal?.platform?.statuses || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <SelectInput
                value={contentForm.priority}
                onChange={(e) => setContentForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {CONTENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {CONTENT_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Scheduled at">
              <input
                type="datetime-local"
                className="ww-input ww-input-md w-full"
                value={contentForm.scheduled_at}
                onChange={(e) => setContentForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              />
            </Field>
            <Field label="Published at">
              <input
                type="datetime-local"
                className="ww-input ww-input-md w-full"
                value={contentForm.published_at}
                onChange={(e) => setContentForm((f) => ({ ...f, published_at: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Tags (comma-separated)">
            <input
              className="ww-input ww-input-md w-full"
              value={contentForm.tags}
              onChange={(e) => setContentForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="ww-input w-full min-h-[60px]"
              rows={2}
              value={contentForm.notes}
              onChange={(e) => setContentForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <button
            type="button"
            disabled={saving}
            onClick={saveContent}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save content"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(analyticsModal)}
        onClose={() => setAnalyticsModal(null)}
        title={`Analytics — ${analyticsModal?.content?.title || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add performance snapshots to track progress over time. Latest values appear on the board
            and dashboard.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              ["views", "Views"],
              ["likes", "Likes"],
              ["comments", "Comments"],
              ["shares", "Shares"],
              ["clicks", "Clicks"],
              ["watch_time_minutes", "Watch time (min)"],
              ["subscribers_gained", "Subscribers gained"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  min={0}
                  className="ww-input ww-input-md w-full"
                  value={analyticsForm[key]}
                  onChange={(e) => setAnalyticsForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <Field label="Recorded at">
            <input
              type="datetime-local"
              className="ww-input ww-input-md w-full"
              value={analyticsForm.recorded_at}
              onChange={(e) => setAnalyticsForm((f) => ({ ...f, recorded_at: e.target.value }))}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="ww-input w-full min-h-[60px]"
              rows={2}
              value={analyticsForm.notes}
              onChange={(e) => setAnalyticsForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Field>
          <button
            type="button"
            disabled={saving}
            onClick={saveAnalytics}
            className="w-full rounded-lg bg-[#ec4899]/20 border border-[#ec4899]/40 text-[#f472b6] py-2 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save snapshot"}
          </button>

          {analyticsHistory.length > 0 ? (
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-2">History</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {analyticsHistory.map((snap) => (
                  <li
                    key={snap._id}
                    className="flex items-center justify-between gap-2 text-xs border border-border/60 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{formatCmsDateTime(snap.recorded_at)}</p>
                      <p className="text-muted-foreground">
                        {formatNumber(snap.views)} views · {formatNumber(snap.likes)} likes
                      </p>
                    </div>
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => deleteAnalytics(snap)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
