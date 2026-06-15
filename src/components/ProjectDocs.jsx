import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { toast } from "react-toastify";
import { Skeleton, Spinner } from "./ui/Loading";
import { RichDocEditor, EMPTY_DOC } from "./docs/RichDocEditor";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  GitBranch,
  History,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

const SECTION_META = {
  overview: { label: "Overview", icon: BookOpen },
  version: { label: "Releases", icon: GitBranch },
  feature: { label: "Features", icon: Layers },
  guide: { label: "Guides", icon: FileText },
  custom: { label: "Other", icon: FileText },
};

function groupPages(pages) {
  const order = ["overview", "version", "feature", "guide", "custom"];
  const groups = Object.fromEntries(order.map((k) => [k, []]));
  for (const p of pages || []) {
    const key = groups[p.doc_type] ? p.doc_type : "custom";
    groups[key].push(p);
  }
  return order
    .map((key) => ({ key, ...SECTION_META[key], pages: groups[key] }))
    .filter((g) => g.pages.length > 0);
}

function ProjectDocs({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [versions, setVersions] = useState([]);
  const [features, setFeatures] = useState([]);
  const [canWrite, setCanWrite] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [content, setContent] = useState(EMPTY_DOC);
  const [serverSnapshot, setServerSnapshot] = useState("");
  const [revisions, setRevisions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [versionName, setVersionName] = useState("");
  const [versionDesc, setVersionDesc] = useState("");
  const [versionStart, setVersionStart] = useState("");
  const [versionEnd, setVersionEnd] = useState("");
  const [versionSaving, setVersionSaving] = useState(false);
  const [versionSnapshot, setVersionSnapshot] = useState("");

  const selectedPage = useMemo(
    () => pages.find((p) => p._id === selectedPageId) || null,
    [pages, selectedPageId]
  );

  const linkedVersion = useMemo(() => {
    if (!selectedPage?.version_id) return null;
    return versions.find((v) => String(v._id) === String(selectedPage.version_id)) || null;
  }, [selectedPage, versions]);

  const versionMetaDirty = useMemo(() => {
    if (!linkedVersion) return false;
    const snap = JSON.stringify({
      name: versionName,
      description: versionDesc,
      start: versionStart,
      end: versionEnd,
    });
    return snap !== versionSnapshot;
  }, [linkedVersion, versionName, versionDesc, versionStart, versionEnd, versionSnapshot]);

  const isDirty = useMemo(() => {
    const snap = JSON.stringify({ title: pageTitle, content });
    return snap !== serverSnapshot;
  }, [pageTitle, content, serverSnapshot]);

  const grouped = useMemo(() => groupPages(pages), [pages]);

  const loadIndex = useCallback(() => {
    if (!orgId || !projectId) return;
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/docs`)
      .then((r) => {
        if (r.data?.success) {
          const list = r.data.pages || [];
          setPages(list);
          setVersions(r.data.versions || []);
          setFeatures(r.data.features || []);
          setCanWrite(Boolean(r.data.can_write));
          setSelectedPageId((prev) => prev || list[0]?._id || null);
        }
      })
      .catch((e) => {
        toast.error(e?.response?.data?.message || "Failed to load docs", { theme: "dark" });
      })
      .finally(() => setLoading(false));
  }, [orgId, projectId]);

  const loadPage = useCallback(
    (pageId) => {
      if (!pageId) return;
      api
        .get(`/api/v1/org/${orgId}/projects/${projectId}/docs/pages/${pageId}`)
        .then((r) => {
          if (r.data?.success) {
            const p = r.data.page;
            setPageTitle(p.title || "");
            setContent(p.content || EMPTY_DOC);
            setServerSnapshot(
              JSON.stringify({ title: p.title || "", content: p.content || EMPTY_DOC })
            );
            setRevisions(r.data.revisions || []);
          }
        })
        .catch((e) => {
          toast.error(e?.response?.data?.message || "Failed to load page", { theme: "dark" });
        });
    },
    [orgId, projectId]
  );

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    if (selectedPageId) loadPage(selectedPageId);
  }, [selectedPageId, loadPage]);

  useEffect(() => {
    if (!linkedVersion) {
      setVersionName("");
      setVersionDesc("");
      setVersionStart("");
      setVersionEnd("");
      setVersionSnapshot("");
      return;
    }
    const name = linkedVersion.name || "";
    const desc = linkedVersion.description || "";
    const start = linkedVersion.start_date ? linkedVersion.start_date.slice(0, 10) : "";
    const end = linkedVersion.end_date ? linkedVersion.end_date.slice(0, 10) : "";
    setVersionName(name);
    setVersionDesc(desc);
    setVersionStart(start);
    setVersionEnd(end);
    setVersionSnapshot(JSON.stringify({ name, description: desc, start, end }));
  }, [linkedVersion]);

  const saveVersionMeta = async () => {
    if (!linkedVersion || !versionMetaDirty) return;
    const name = versionName.trim();
    if (!name || !versionStart || !versionEnd) {
      toast.error("Release name and dates are required", { theme: "dark" });
      return;
    }
    setVersionSaving(true);
    try {
      const r = await api.patch(
        `/api/v1/org/${orgId}/projects/${projectId}/versions/${linkedVersion._id}`,
        {
          name,
          description: versionDesc,
          start_date: versionStart,
          end_date: versionEnd,
        }
      );
      const v = r.data.version;
      setVersions((prev) => prev.map((x) => (String(x._id) === String(v._id) ? { ...x, ...v } : x)));
      const docTitle = `Release: ${v.name}`;
      setPages((prev) =>
        prev.map((p) => (String(p.version_id) === String(v._id) ? { ...p, title: docTitle } : p))
      );
      if (selectedPage?.version_id && String(selectedPage.version_id) === String(v._id)) {
        setPageTitle(docTitle);
        setServerSnapshot((prev) => {
          const snap = prev ? JSON.parse(prev) : { title: docTitle, content };
          return JSON.stringify({ ...snap, title: docTitle });
        });
      }
      setVersionSnapshot(
        JSON.stringify({
          name: v.name,
          description: v.description || "",
          start: v.start_date ? v.start_date.slice(0, 10) : "",
          end: v.end_date ? v.end_date.slice(0, 10) : "",
        })
      );
      toast.success("Release updated", { theme: "dark" });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update release", { theme: "dark" });
    } finally {
      setVersionSaving(false);
    }
  };

  const save = async () => {
    if (!selectedPageId || !isDirty) return;
    setSaving(true);
    try {
      const r = await api.patch(
        `/api/v1/org/${orgId}/projects/${projectId}/docs/pages/${selectedPageId}`,
        {
          title: pageTitle.trim(),
          content,
          change_summary: changeSummary.trim(),
        }
      );
      toast.success(r.data?.message || "Saved", { theme: "dark" });
      const p = r.data.page;
      setPages((prev) => prev.map((x) => (x._id === p._id ? { ...x, ...p } : x)));
      setServerSnapshot(JSON.stringify({ title: p.title, content: p.content }));
      setChangeSummary("");
      loadPage(selectedPageId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  const syncVersions = async () => {
    try {
      const r = await api.post(`/api/v1/org/${orgId}/projects/${projectId}/docs/sync-versions`);
      setPages(r.data?.pages || []);
      toast.success(r.data?.message || "Synced", { theme: "dark" });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Sync failed", { theme: "dark" });
    }
  };

  const addFeatureDoc = async (featureId) => {
    try {
      const r = await api.post(`/api/v1/org/${orgId}/projects/${projectId}/docs/pages`, {
        feature_id: featureId,
      });
      const page = r.data.page;
      setPages((prev) => [...prev, page]);
      setSelectedPageId(page._id);
      toast.success("Feature document created", { theme: "dark" });
    } catch (e) {
      const existing = e?.response?.data?.page;
      if (existing?._id) {
        setSelectedPageId(existing._id);
        toast.info("Opening existing feature doc", { theme: "dark" });
      } else {
        toast.error(e?.response?.data?.message || "Failed to create doc", { theme: "dark" });
      }
    }
  };

  const addCustomPage = async () => {
    const title = window.prompt("Page title");
    if (!title?.trim()) return;
    try {
      const r = await api.post(`/api/v1/org/${orgId}/projects/${projectId}/docs/pages`, {
        title: title.trim(),
        doc_type: "guide",
        content: EMPTY_DOC,
      });
      const page = r.data.page;
      setPages((prev) => [...prev, page]);
      setSelectedPageId(page._id);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create page", { theme: "dark" });
    }
  };

  const deletePage = async () => {
    if (!selectedPage || selectedPage.doc_type === "overview") return;
    if (!window.confirm(`Delete "${selectedPage.title}"?`)) return;
    try {
      await api.delete(
        `/api/v1/org/${orgId}/projects/${projectId}/docs/pages/${selectedPageId}`
      );
      const next = pages.filter((p) => p._id !== selectedPageId);
      setPages(next);
      setSelectedPageId(next[0]?._id || null);
      toast.success("Page deleted", { theme: "dark" });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed", { theme: "dark" });
    }
  };

  const restoreRevision = async (revisionId) => {
    if (!window.confirm("Restore this version? Current content will be saved as a new revision.")) return;
    try {
      const r = await api.post(
        `/api/v1/org/${orgId}/projects/${projectId}/docs/pages/${selectedPageId}/revisions/${revisionId}/restore`
      );
      const p = r.data.page;
      setPageTitle(p.title);
      setContent(p.content || EMPTY_DOC);
      setServerSnapshot(JSON.stringify({ title: p.title, content: p.content }));
      setPages((prev) => prev.map((x) => (x._id === p._id ? { ...x, ...p } : x)));
      loadPage(selectedPageId);
      toast.success(r.data?.message || "Restored", { theme: "dark" });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Restore failed", { theme: "dark" });
    }
  };

  const featurePages = useMemo(() => new Set(pages.filter((p) => p.feature_id).map((p) => String(p.feature_id))), [pages]);
  const undocumentedFeatures = features.filter((f) => !featurePages.has(String(f._id)));

  if (!projectId) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 bg-card">
        <div className="text-sm text-muted-foreground">Select a project to view documentation.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <Skeleton className="h-6 w-44 mb-3" />
        <Skeleton className="h-[480px] w-full" />
        <Spinner className="mt-4" label="Loading documentation…" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[560px] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/10 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-semibold ww-heading">Documents</h2>
          {canWrite ? (
            <button
              type="button"
              onClick={addCustomPage}
              className="p-1 rounded border border-border hover:border-primary/40"
              title="New page"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div className="space-y-3 max-h-[50vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto">
          {grouped.map((section) => (
            <div key={section.key}>
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                <section.icon className="w-3 h-3" />
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.pages.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPageId(p._id)}
                      className={cn(
                        "w-full text-left text-sm px-2 py-1.5 rounded-lg truncate transition",
                        selectedPageId === p._id
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "hover:bg-muted/50 text-foreground/90 border border-transparent"
                      )}
                    >
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {canWrite ? (
          <div className="pt-2 border-t border-border space-y-2">
            <button
              type="button"
              onClick={syncVersions}
              className="w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-border hover:border-primary/40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync release docs
            </button>
            {undocumentedFeatures.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground px-1">Add feature spec</p>
                <select
                  className="ww-input w-full text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addFeatureDoc(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Choose feature…</option>
                  {undocumentedFeatures.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPage ? (
          <>
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-card/50">
              <input
                className="flex-1 min-w-[180px] bg-transparent text-lg font-semibold ww-heading focus:outline-none border-b border-transparent focus:border-border px-1"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                readOnly={!canWrite}
              />
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border",
                    showHistory ? "border-primary/40 bg-primary/10 text-primary" : "border-border"
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  v{selectedPage.revision_count || 1}
                </button>
                {canWrite && selectedPage.doc_type !== "overview" ? (
                  <button
                    type="button"
                    onClick={deletePage}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const snap = JSON.parse(serverSnapshot);
                        setPageTitle(snap.title);
                        setContent(snap.content);
                      }}
                      disabled={!isDirty || saving}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border disabled:opacity-50"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={!isDirty || saving}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {canWrite && isDirty ? (
              <div className="px-3 py-2 border-b border-border bg-muted/20">
                <input
                  className="ww-input w-full text-xs"
                  placeholder="Optional: describe what changed in this revision…"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>
            ) : null}

            {selectedPage.doc_type === "version" && linkedVersion ? (
              <div className="px-3 py-3 border-b border-border bg-muted/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold ww-heading">Release details</p>
                    <p className="text-[11px] text-muted-foreground">
                      Edit the version name, dates, and summary. Doc title stays in sync.
                    </p>
                  </div>
                  {linkedVersion.is_locked ? (
                    <span className="text-[10px] text-amber-400 border border-amber-500/30 rounded px-2 py-0.5">
                      Locked — unlock in Versions to edit
                    </span>
                  ) : linkedVersion.status === "completed" ? (
                    <span className="text-[10px] text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5">
                      Completed — read-only
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <input
                    className="ww-input text-sm sm:col-span-2"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="Release name"
                    readOnly={!canWrite || linkedVersion.is_locked || linkedVersion.status === "completed"}
                  />
                  <input
                    type="date"
                    className="ww-input text-sm"
                    value={versionStart}
                    onChange={(e) => setVersionStart(e.target.value)}
                    readOnly={!canWrite || linkedVersion.is_locked || linkedVersion.status === "completed"}
                  />
                  <input
                    type="date"
                    className="ww-input text-sm"
                    value={versionEnd}
                    onChange={(e) => setVersionEnd(e.target.value)}
                    readOnly={!canWrite || linkedVersion.is_locked || linkedVersion.status === "completed"}
                  />
                </div>
                <textarea
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[72px]"
                  value={versionDesc}
                  onChange={(e) => setVersionDesc(e.target.value)}
                  placeholder="Release description (optional)"
                  readOnly={!canWrite || linkedVersion.is_locked || linkedVersion.status === "completed"}
                />
                {canWrite && !linkedVersion.is_locked && linkedVersion.status !== "completed" ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveVersionMeta}
                      disabled={!versionMetaDirty || versionSaving}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {versionSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save release details
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-1 min-h-0">
              <div className="flex-1 p-3 overflow-y-auto">
                <RichDocEditor
                  value={content}
                  onChange={setContent}
                  editable={canWrite}
                  placeholder="Write like a doc — headings, lists, and links. No markdown required."
                />
                <p className="mt-2 text-[11px] text-muted-foreground px-1">
                  {isDirty ? "Unsaved changes" : `Saved · revision ${selectedPage.revision_count || 1}`}
                </p>
              </div>

              {showHistory ? (
                <div className="w-64 shrink-0 border-l border-border bg-muted/10 p-3 overflow-y-auto">
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Version history
                  </h3>
                  {!revisions.length ? (
                    <p className="text-xs text-muted-foreground">No revisions yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {revisions.map((rev) => (
                        <li
                          key={rev._id}
                          className="rounded-lg border border-border p-2 text-xs space-y-1"
                        >
                          <div className="font-medium">v{rev.revision_number}</div>
                          <div className="text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleString()}
                          </div>
                          {rev.change_summary ? (
                            <div className="text-muted-foreground italic">{rev.change_summary}</div>
                          ) : null}
                          {canWrite && rev.revision_number !== selectedPage.revision_count ? (
                            <button
                              type="button"
                              onClick={() => restoreRevision(rev._id)}
                              className="text-primary hover:underline"
                            >
                              Restore
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">
            Select a document from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDocs;
