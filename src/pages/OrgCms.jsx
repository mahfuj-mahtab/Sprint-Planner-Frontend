import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  BarChart3,
  CalendarDays,
  Columns3,
  Layers,
  Loader2,
  Plus,
  Settings2,
  Sparkles,
  Target,
  FileText,
  Trash2,
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
import { CmsCalendar } from "@/components/org/cms/CmsCalendar";
import { CmsTemplates } from "@/components/org/cms/CmsTemplates";
import { CmsGoals } from "@/components/org/cms/CmsGoals";
import { CmsPlatformCard } from "@/components/org/cms/CmsPlatformCard";
import { CmsPlatformPicker } from "@/components/org/cms/CmsPlatformPicker";
import {
  CONTENT_PRIORITIES,
  CONTENT_PRIORITY_LABELS,
  CONTENT_FORMAT_OPTIONS,
  PLATFORM_TYPE_OPTIONS,
  buildPlatformFormFromPreset,
  formatCmsDateTime,
  formatNumber,
  statusBadgeStyle,
} from "@/lib/cms";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "pipeline", label: "Pipeline", icon: Columns3 },
  { id: "platforms", label: "Platforms", icon: Layers },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "goals", label: "Goals", icon: Target },
];

const emptyPlatformForm = {
  name: "",
  description: "",
  color: "#ec4899",
  icon: "youtube",
  platform_type: "video",
  account_handle: "",
  account_url: "",
  niche: "",
  current_followers: 0,
  engagement_rate_target: 4,
};
const emptyStatusForm = {
  name: "",
  color: "#94a3b8",
  is_scheduled_stage: false,
  is_published_stage: false,
};
const emptyContentForm = {
  title: "",
  description: "",
  hook: "",
  script_body: "",
  notes: "",
  priority: "medium",
  content_format: "post",
  status_id: "",
  scheduled_at: "",
  published_at: "",
  tags: "",
  hashtags: "",
  cta: "",
  series_name: "",
  media_url: "",
  published_url: "",
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

const ANALYTICS_FIELDS = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "clicks", label: "Clicks" },
  { key: "watch_time_minutes", label: "Watch time (min)" },
  { key: "subscribers_gained", label: "Subscribers gained" },
];

export default function OrgCms() {
  useBlockClientOrgRoutes();
  const { orgId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const platformParam = searchParams.get("platform");

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [goals, setGoals] = useState([]);
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

  // ---------- Data loading ----------

  const loadOverview = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const r = await api.get(`/api/v1/org/${orgId}/cms/overview`);
      setPlatforms(r.data?.platforms || []);
      setTemplates(r.data?.templates || []);
      setGoals(r.data?.goals || []);
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

  // ---------- URL helpers ----------

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    setSearchParams(next);
  };

  const setActivePlatformId = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("platform", id);
    if (!next.get("tab")) next.set("tab", "pipeline");
    setSearchParams(next);
  };

  // ---------- Derived ----------

  const allContent = useMemo(() => {
    const list = [];
    for (const p of platforms) {
      for (const c of p.content || []) {
        list.push({ ...c, platform_id: p._id });
      }
    }
    return list;
  }, [platforms]);

  const activePlatform = useMemo(() => {
    if (!platforms.length) return null;
    if (platformParam) {
      return platforms.find((p) => p._id === platformParam) || platforms[0];
    }
    return platforms[0];
  }, [platforms, platformParam]);

  // ---------- Platform CRUD ----------

  const openPlatformCreate = () => {
    setPlatformForm(buildPlatformFormFromPreset("youtube"));
    setPlatformModal({ mode: "create" });
  };

  const openPlatformEdit = (platform) => {
    setPlatformForm({
      name: platform.name,
      description: platform.description || "",
      color: platform.color || "#ec4899",
      icon: platform.icon || "other",
      platform_type: platform.platform_type || "mixed",
      account_handle: platform.account_handle || "",
      account_url: platform.account_url || "",
      niche: platform.niche || "",
      current_followers: platform.current_followers || 0,
      engagement_rate_target: platform.engagement_rate_target ?? 4,
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

  // ---------- Status CRUD ----------

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
          s.name !== orig.name ||
          s.color !== orig.color ||
          s.is_scheduled_stage !== Boolean(orig.is_scheduled_stage) ||
          s.is_published_stage !== Boolean(orig.is_published_stage);
        if (s.selected && changed) {
          patches.push(
            api.patch(`/api/v1/org/${orgId}/cms/statuses/${s._id}`, {
              name: s.name,
              color: s.color,
              is_scheduled_stage: s.is_scheduled_stage,
              is_published_stage: s.is_published_stage,
            })
          );
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

  // ---------- Status reordering ----------

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

  const handleStatusDrop = async (e, platformId, targetIndex) => {
    e.preventDefault();
    let payload = null;
    try {
      const raw = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain") || "{}";
      payload = JSON.parse(raw);
    } catch (err) {
      return;
    }
    if (payload.platformId !== platformId) return;
    setPlatforms((prev) => {
      const next = prev.map((p) => {
        if (p._id !== platformId) return p;
        const sorted = [...(p.statuses || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        const [moved] = sorted.splice(payload.index, 1);
        sorted.splice(targetIndex, 0, moved);
        return { ...p, statuses: sorted.map((s, i) => ({ ...s, sort_order: i })) };
      });
      return next;
    });
    try {
      const platform = platforms.find((p) => p._id === platformId);
      const sorted = [...(platform?.statuses || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      const orderedIds = sorted.map((s) => s._id);
      const [movedId] = orderedIds.splice(payload.index, 1);
      orderedIds.splice(targetIndex, 0, movedId);
      await api.patch(`/api/v1/org/${orgId}/cms/platforms/${platformId}/statuses/reorder`, {
        order: orderedIds,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reorder failed", { theme: "dark" });
      await refreshAll();
    }
  };

  // ---------- Content CRUD ----------

  const openContentCreate = (platform) => {
    const firstStatus = [...(platform.statuses || [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )[0];
    setContentForm({
      ...emptyContentForm,
      status_id: firstStatus?._id || "",
      content_format:
        platform.platform_type === "video"
          ? "video"
          : platform.platform_type === "short"
            ? "reel"
            : platform.platform_type === "audio"
              ? "podcast"
              : "post",
    });
    setContentModal({ mode: "create", platform });
  };

  const openContentEdit = (platform, content) => {
    setContentForm({
      ...emptyContentForm,
      title: content.title || "",
      description: content.description || "",
      hook: content.hook || "",
      script_body: content.script_body || "",
      notes: content.notes || "",
      priority: content.priority || "medium",
      content_format: content.content_format || "post",
      status_id: content.status_id?._id || content.status_id || "",
      scheduled_at: content.scheduled_at ? content.scheduled_at.slice(0, 16) : "",
      published_at: content.published_at ? content.published_at.slice(0, 16) : "",
      tags: (content.tags || []).join(", "),
      hashtags: (content.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
      cta: content.cta || "",
      series_name: content.series_name || "",
      media_url: content.media_url || "",
      published_url: content.published_url || "",
    });
    setContentModal({ mode: "edit", platform, content });
  };

  const saveContent = async () => {
    if (!contentForm.title.trim()) {
      toast.error("Title is required", { theme: "dark" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: contentForm.title.trim(),
        description: contentForm.description,
        hook: contentForm.hook,
        script_body: contentForm.script_body,
        notes: contentForm.notes,
        priority: contentForm.priority,
        content_format: contentForm.content_format,
        status_id: contentForm.status_id,
        scheduled_at: contentForm.scheduled_at || null,
        published_at: contentForm.published_at || null,
        tags: contentForm.tags,
        hashtags: contentForm.hashtags,
        cta: contentForm.cta,
        series_name: contentForm.series_name,
        media_url: contentForm.media_url,
        published_url: contentForm.published_url,
      };
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

  const repurposeContent = async (content, targetPlatformId) => {
    if (!targetPlatformId) return;
    try {
      await api.post(`/api/v1/org/${orgId}/cms/content/${content._id}/repurpose`, {
        target_platform_id: targetPlatformId,
      });
      toast.success("Content repurposed to another platform", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Repurpose failed", { theme: "dark" });
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

  // ---------- Analytics ----------

  const openAnalytics = async (content) => {
    setAnalyticsForm(emptyAnalyticsForm);
    setAnalyticsModal({ content });
    try {
      const r = await api.get(`/api/v1/org/${orgId}/cms/content/${content._id}/analytics`);
      setAnalyticsHistory(r.data?.snapshots || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load history", { theme: "dark" });
      setAnalyticsHistory([]);
    }
  };

  const saveAnalytics = async () => {
    if (!analyticsModal?.content) return;
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
      const r = await api.get(`/api/v1/org/${orgId}/cms/content/${analyticsModal.content._id}/analytics`);
      setAnalyticsHistory(r.data?.snapshots || []);
      setAnalyticsForm(emptyAnalyticsForm);
      toast.success("Snapshot saved", { theme: "dark" });
      await loadDashboard();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const deleteAnalytics = async (snapshot) => {
    try {
      await api.delete(`/api/v1/org/${orgId}/cms/analytics/${snapshot._id}`);
      const r = await api.get(`/api/v1/org/${orgId}/cms/content/${analyticsModal.content._id}/analytics`);
      setAnalyticsHistory(r.data?.snapshots || []);
      toast.success("Snapshot removed", { theme: "dark" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  // ---------- Subnav actions ----------

  const subnavActions = (
    <>
      {canWrite ? (
        <button
          type="button"
          onClick={openPlatformCreate}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <Plus className="w-4 h-4" /> New platform
        </button>
      ) : null}
    </>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground">
        <OrgSubnav
          orgId={orgId}
          eyebrow="Content"
          title="Content studio"
          icon={Sparkles}
          accent="primary"
          tabs={TABS.map((t) => ({
            ...t,
            badge:
              t.id === "platforms"
                ? platforms.length || undefined
                : t.id === "templates"
                ? templates.length || undefined
                : t.id === "goals"
                ? goals.filter((g) => !g.is_archived).length || undefined
                : t.id === "pipeline"
                ? allContent.length || undefined
                : undefined,
          }))}
          activeTab={tab}
          onTabChange={setTab}
          actions={subnavActions}
        />

        <div className="ww-page-full max-w-none py-6 space-y-6">
          {loading && tab !== "dashboard" ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : null}

          {tab === "dashboard" ? (
            <DashboardTab
              dashboardLoading={dashboardLoading}
              dashboard={dashboard}
              onPlatformSelect={(id) => {
                setActivePlatformId(id);
                setTab("pipeline");
              }}
            />
          ) : null}

          {tab === "calendar" ? (
            <CmsCalendar orgId={orgId} platforms={platforms} />
          ) : null}

          {tab === "pipeline" ? (
            <PipelineTab
              orgId={orgId}
              loading={loading}
              platforms={platforms}
              activePlatform={activePlatform}
              canWrite={canWrite}
              setActivePlatformId={setActivePlatformId}
              onStatusDragStart={handleStatusDragStart}
              onStatusDrop={handleStatusDrop}
              onAddStatus={canWrite ? openStatusCreate : null}
              onEditStatus={canWrite ? openStatusEdit : null}
              onDeleteStatus={canWrite ? deleteStatus : null}
              onBulkEditStatus={canWrite ? openStatusBulkEdit : null}
              onAddContent={canWrite ? openContentCreate : null}
              onEditContent={openContentEdit}
              onDeleteContent={canWrite ? deleteContent : null}
              onAnalytics={openAnalytics}
            />
          ) : null}

          {tab === "platforms" ? (
            <PlatformsTab
              orgId={orgId}
              platforms={platforms}
              templates={templates}
              canWrite={canWrite}
              onEdit={canWrite ? openPlatformEdit : null}
              onDelete={canWrite ? deletePlatform : null}
              onRefresh={refreshAll}
            />
          ) : null}

          {tab === "templates" ? (
            <CmsTemplates
              orgId={orgId}
              platforms={platforms}
              templates={templates}
              onChange={loadOverview}
            />
          ) : null}

          {tab === "goals" ? (
            <CmsGoals
              orgId={orgId}
              platforms={platforms}
              goals={goals}
              onChange={loadOverview}
            />
          ) : null}
        </div>

        {/* ---------- Modals ---------- */}

        {/* Platform modal */}
        <Modal
          open={Boolean(platformModal)}
          onClose={() => setPlatformModal(null)}
          title={platformModal?.mode === "edit" ? "Edit platform" : "Add channel"}
          size="lg"
        >
          <div className="space-y-4">
            {platformModal?.mode === "create" ? (
              <CmsPlatformPicker
                value={platformForm.icon}
                onChange={(form) => setPlatformForm(form)}
              />
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Display name">
                <input
                  className="ww-input w-full"
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                  placeholder="My YouTube channel"
                />
              </Field>
              <Field label="Platform type">
                <SelectInput
                  className="ww-input-md w-full"
                  value={platformForm.platform_type}
                  onChange={(e) =>
                    setPlatformForm({ ...platformForm, platform_type: e.target.value })
                  }
                >
                  {PLATFORM_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Handle" hint="Without @">
                <input
                  className="ww-input w-full"
                  value={platformForm.account_handle}
                  onChange={(e) =>
                    setPlatformForm({ ...platformForm, account_handle: e.target.value })
                  }
                  placeholder="yourhandle"
                />
              </Field>
              <Field label="Profile URL">
                <input
                  className="ww-input w-full"
                  value={platformForm.account_url}
                  onChange={(e) =>
                    setPlatformForm({ ...platformForm, account_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </Field>
            </div>
            <Field label="Niche / focus">
              <input
                className="ww-input w-full"
                value={platformForm.niche}
                onChange={(e) => setPlatformForm({ ...platformForm, niche: e.target.value })}
                placeholder="Indie SaaS, dev education, founder journey..."
              />
            </Field>
            <Field label="Description">
              <input
                className="ww-input w-full"
                value={platformForm.description}
                onChange={(e) =>
                  setPlatformForm({ ...platformForm, description: e.target.value })
                }
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Brand color">
                <input
                  type="color"
                  className="ww-input w-full h-10 p-1"
                  value={platformForm.color}
                  onChange={(e) => setPlatformForm({ ...platformForm, color: e.target.value })}
                />
              </Field>
              <Field label="Followers now">
                <input
                  type="number"
                  min={0}
                  className="ww-input w-full"
                  value={platformForm.current_followers}
                  onChange={(e) =>
                    setPlatformForm({
                      ...platformForm,
                      current_followers: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              <Field label="Engagement target %">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="ww-input w-full"
                  value={platformForm.engagement_rate_target}
                  onChange={(e) =>
                    setPlatformForm({
                      ...platformForm,
                      engagement_rate_target: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlatformModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlatform}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save channel
              </button>
            </div>
          </div>
        </Modal>

        {/* Status modal (create / edit) */}
        <Modal
          open={Boolean(statusModal) && statusModal?.mode !== "bulk"}
          onClose={() => setStatusModal(null)}
          title={
            statusModal?.mode === "edit"
              ? `Edit status — ${statusModal.platform?.name}`
              : `New status — ${statusModal?.platform?.name}`
          }
          size="sm"
        >
          <div className="space-y-3">
            <Field label="Name">
              <input
                className="ww-input w-full"
                value={statusForm.name}
                onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
              />
            </Field>
            <Field label="Color">
              <input
                type="color"
                className="ww-input w-full h-10 p-1"
                value={statusForm.color}
                onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
              />
            </Field>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statusForm.is_scheduled_stage}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, is_scheduled_stage: e.target.checked })
                  }
                />
                Scheduled stage
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statusForm.is_published_stage}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, is_published_stage: e.target.checked })
                  }
                />
                Published stage
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStatus}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </Modal>

        {/* Status bulk modal */}
        <Modal
          open={Boolean(statusModal) && statusModal?.mode === "bulk"}
          onClose={() => setStatusModal(null)}
          title={`Bulk edit statuses — ${statusModal?.platform?.name}`}
          size="lg"
        >
          <div className="space-y-2">
            {statusBulkList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No statuses on this platform yet.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {statusBulkList.map((s, idx) => (
                  <div
                    key={s._id}
                    className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border p-2"
                  >
                    <label className="col-span-1 inline-flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={s.selected}
                        onChange={(e) => {
                          const next = [...statusBulkList];
                          next[idx] = { ...s, selected: e.target.checked };
                          setStatusBulkList(next);
                        }}
                      />
                    </label>
                    <input
                      className="ww-input col-span-5"
                      value={s.name}
                      onChange={(e) => {
                        const next = [...statusBulkList];
                        next[idx] = { ...s, name: e.target.value, selected: true };
                        setStatusBulkList(next);
                      }}
                    />
                    <input
                      type="color"
                      className="ww-input col-span-2 h-9 p-1"
                      value={s.color}
                      onChange={(e) => {
                        const next = [...statusBulkList];
                        next[idx] = { ...s, color: e.target.value, selected: true };
                        setStatusBulkList(next);
                      }}
                    />
                    <label className="col-span-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={s.is_scheduled_stage}
                        onChange={(e) => {
                          const next = [...statusBulkList];
                          next[idx] = { ...s, is_scheduled_stage: e.target.checked, selected: true };
                          setStatusBulkList(next);
                        }}
                      />
                      Scheduled
                    </label>
                    <label className="col-span-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={s.is_published_stage}
                        onChange={(e) => {
                          const next = [...statusBulkList];
                          next[idx] = { ...s, is_published_stage: e.target.checked, selected: true };
                          setStatusBulkList(next);
                        }}
                      />
                      Published
                    </label>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBulkStatuses}
                disabled={bulkSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {bulkSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Apply selected
              </button>
            </div>
          </div>
        </Modal>

        {/* Content modal */}
        <Modal
          open={Boolean(contentModal)}
          onClose={() => setContentModal(null)}
          title={contentModal?.mode === "edit" ? "Edit content" : "New content"}
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <Field label="Title" hint="Clear name for this piece across your pipeline.">
              <input
                className="ww-input w-full"
                value={contentForm.title}
                onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
              />
            </Field>
            <Field label="Hook" hint="First line or scroll-stopper.">
              <input
                className="ww-input w-full"
                value={contentForm.hook}
                onChange={(e) => setContentForm({ ...contentForm, hook: e.target.value })}
              />
            </Field>
            <Field label="Caption / description">
              <textarea
                className="ww-input w-full min-h-[70px]"
                value={contentForm.description}
                onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
              />
            </Field>
            <Field label="Script / full body">
              <textarea
                className="ww-input w-full min-h-[100px]"
                value={contentForm.script_body}
                onChange={(e) => setContentForm({ ...contentForm, script_body: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Format">
                <SelectInput
                  className="ww-input-md w-full"
                  value={contentForm.content_format}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, content_format: e.target.value })
                  }
                >
                  {CONTENT_FORMAT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  className="ww-input-md w-full"
                  value={contentForm.status_id}
                  onChange={(e) => setContentForm({ ...contentForm, status_id: e.target.value })}
                >
                  {(contentModal?.platform?.statuses || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Priority">
                <SelectInput
                  className="ww-input-md w-full"
                  value={contentForm.priority}
                  onChange={(e) => setContentForm({ ...contentForm, priority: e.target.value })}
                >
                  {CONTENT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {CONTENT_PRIORITY_LABELS[p] || p}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Scheduled at">
                <input
                  type="datetime-local"
                  className="ww-input w-full"
                  value={contentForm.scheduled_at}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, scheduled_at: e.target.value })
                  }
                />
              </Field>
              <Field label="Published at">
                <input
                  type="datetime-local"
                  className="ww-input w-full"
                  value={contentForm.published_at}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, published_at: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Series / campaign">
              <input
                className="ww-input w-full"
                value={contentForm.series_name}
                onChange={(e) => setContentForm({ ...contentForm, series_name: e.target.value })}
                placeholder="e.g. Founder diary week 12"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Hashtags">
                <input
                  className="ww-input w-full"
                  value={contentForm.hashtags}
                  onChange={(e) => setContentForm({ ...contentForm, hashtags: e.target.value })}
                  placeholder="#buildinpublic #saas"
                />
              </Field>
              <Field label="Tags (internal)">
                <input
                  className="ww-input w-full"
                  value={contentForm.tags}
                  onChange={(e) => setContentForm({ ...contentForm, tags: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Call to action">
              <input
                className="ww-input w-full"
                value={contentForm.cta}
                onChange={(e) => setContentForm({ ...contentForm, cta: e.target.value })}
                placeholder="Link in bio, comment KEYWORD, etc."
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Draft / asset URL">
                <input
                  className="ww-input w-full"
                  value={contentForm.media_url}
                  onChange={(e) => setContentForm({ ...contentForm, media_url: e.target.value })}
                />
              </Field>
              <Field label="Live post URL">
                <input
                  className="ww-input w-full"
                  value={contentForm.published_url}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, published_url: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                className="ww-input w-full min-h-[60px]"
                value={contentForm.notes}
                onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
              />
            </Field>

            {contentModal?.mode === "edit" && platforms.length > 1 ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium">Repurpose to another platform</p>
                <div className="flex flex-wrap gap-2">
                  {platforms
                    .filter((p) => p._id !== contentModal.platform?._id)
                    .map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          repurposeContent(contentModal.content, p._id);
                          setContentModal(null);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg border border-border hover:border-primary/40"
                        style={{ borderColor: `${p.color}44`, color: p.color }}
                      >
                        → {p.name}
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-card pb-1">
              <button
                type="button"
                onClick={() => setContentModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveContent}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </Modal>

        {/* Analytics modal */}
        <Modal
          open={Boolean(analyticsModal)}
          onClose={() => setAnalyticsModal(null)}
          title={`Log analytics — ${analyticsModal?.content?.title || ""}`}
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANALYTICS_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <input
                    type="number"
                    className="ww-input w-full"
                    value={analyticsForm[key]}
                    onChange={(e) => setAnalyticsForm({ ...analyticsForm, [key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <Field label="Recorded at">
              <input
                type="datetime-local"
                className="ww-input w-full"
                value={analyticsForm.recorded_at}
                onChange={(e) => setAnalyticsForm({ ...analyticsForm, recorded_at: e.target.value })}
              />
            </Field>
            <Field label="Notes">
              <textarea
                className="ww-input w-full min-h-[60px]"
                value={analyticsForm.notes}
                onChange={(e) => setAnalyticsForm({ ...analyticsForm, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAnalyticsModal(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveAnalytics}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save snapshot
              </button>
            </div>
            {analyticsHistory.length > 0 ? (
              <div className="mt-3 border-t border-border/60 pt-3">
                <h4 className="text-sm font-semibold mb-2">History</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {analyticsHistory.map((snap) => (
                    <div
                      key={snap._id}
                      className="flex items-center justify-between text-xs rounded border border-border px-2 py-1.5"
                    >
                      <div className="flex flex-wrap gap-2 text-muted-foreground">
                        <span>{formatCmsDateTime(snap.recorded_at)}</span>
                        {snap.views ? <span>· {formatNumber(snap.views)} views</span> : null}
                        {snap.likes ? <span>· {formatNumber(snap.likes)} likes</span> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAnalytics(snap)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        aria-label="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Modal>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// Tab subcomponents (kept inline to keep a single file)
// ============================================================

function DashboardTab({ dashboardLoading, dashboard, onPlatformSelect }) {
  if (dashboardLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  return (
    <CmsDashboardPanel
      dashboard={dashboard}
      loading={dashboardLoading}
      onSelectPlatform={onPlatformSelect}
    />
  );
}

function PlatformsTab({ orgId, platforms, canWrite, onEdit, onDelete, onRefresh }) {
  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <Layers className="w-8 h-8 mx-auto text-muted-foreground" />
        <h3 className="mt-3 font-semibold">No platforms yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add a platform to start tracking content, statuses, and growth.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map((p) => (
        <PlatformCardWrapper
          key={p._id}
          orgId={orgId}
          platform={p}
          canWrite={canWrite}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

function PlatformCardWrapper({ orgId, platform, canWrite, onEdit, onDelete, onRefresh }) {
  const handleEdit = canWrite
    ? (p) => onEdit?.(p)
    : () => toast.info("You don't have write access", { theme: "dark" });
  return (
    <div className="relative">
      <CmsPlatformCard
        orgId={orgId}
        platform={platform}
        onEdit={handleEdit}
        onRefresh={onRefresh}
      />
      {canWrite && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(platform)}
          className="absolute top-2 right-2 p-1.5 rounded border border-border bg-card/80 text-muted-foreground hover:text-destructive"
          aria-label="Delete platform"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function PipelineTab({
  orgId,
  loading,
  platforms,
  activePlatform,
  canWrite,
  setActivePlatformId,
  onStatusDragStart,
  onStatusDrop,
  onAddStatus,
  onEditStatus,
  onDeleteStatus,
  onBulkEditStatus,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onAnalytics,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <Columns3 className="w-8 h-8 mx-auto text-muted-foreground" />
        <h3 className="mt-3 font-semibold">Create a platform to start the pipeline</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Use the “New platform” button in the header to add your first channel.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PlatformSelector
        platforms={platforms}
        activeId={activePlatform?._id}
        onSelect={setActivePlatformId}
      />

      {activePlatform ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{activePlatform.name}</h2>
              <span className="text-xs text-muted-foreground">
                {activePlatform.content?.length || 0} item
                {(activePlatform.content?.length || 0) === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canWrite ? (
                <>
                  <button
                    type="button"
                    onClick={() => onBulkEditStatus?.(activePlatform)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Bulk edit statuses
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddStatus?.(activePlatform)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Status
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddContent?.(activePlatform)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> New content
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {canWrite ? (
            <StatusRow
              platform={activePlatform}
              onDragStart={onStatusDragStart}
              onDrop={onStatusDrop}
              onEdit={(s) => onEditStatus?.(activePlatform, s)}
              onDelete={onDeleteStatus}
            />
          ) : (
            <StatusBadges statuses={activePlatform.statuses || []} />
          )}

          <ContentBoard
            orgId={orgId}
            platform={activePlatform}
            statuses={activePlatform.statuses}
            content={activePlatform.content}
            canWrite={canWrite}
            onRefresh={() => {}}
            onEdit={onEditContent}
            onDelete={onDeleteContent}
            onAnalytics={onAnalytics}
          />
        </>
      ) : null}
    </div>
  );
}

function PlatformSelector({ platforms, activeId, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {platforms.map((p) => {
        const active = p._id === activeId;
        return (
          <button
            key={p._id}
            type="button"
            onClick={() => onSelect(p._id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition",
              active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={
              active
                ? { boxShadow: `0 0 0 1px ${p.color || "#ec4899"}40` }
                : undefined
            }
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color || "#ec4899" }}
            />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

function StatusRow({ platform, onDragStart, onDrop, onEdit, onDelete }) {
  const sorted = [...(platform.statuses || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {sorted.map((s, idx) => (
        <div
          key={s._id}
          draggable
          onDragStart={(e) => onDragStart(e, platform._id, idx, s._id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDrop(e, platform._id, idx)}
          className="group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
          style={statusBadgeStyle(s.color)}
        >
          <span className="font-medium">{s.name}</span>
          <button
            type="button"
            onClick={() => onEdit?.(s)}
            className="opacity-0 group-hover:opacity-100 transition text-[10px] underline"
          >
            edit
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(s)}
              className="opacity-0 group-hover:opacity-100 transition text-[10px] underline"
            >
              del
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StatusBadges({ statuses }) {
  if (!statuses?.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {statuses.map((s) => (
        <span
          key={s._id}
          className="text-[10px] px-1.5 py-0.5 rounded border"
          style={statusBadgeStyle(s.color)}
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}
