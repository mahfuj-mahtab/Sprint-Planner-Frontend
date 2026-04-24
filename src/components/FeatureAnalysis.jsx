import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { Plus, RefreshCw, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";

const statusPill = (status) => {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (status === "in-progress") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
  return "bg-muted/60 text-muted-foreground border-border";
};

function FeatureAnalysis({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleName, setModuleName] = useState("");

  const [featureDrafts, setFeatureDrafts] = useState({}); // moduleId -> name
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleName, setEditingModuleName] = useState("");
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [editingFeatureName, setEditingFeatureName] = useState("");
  const [addingFeatureModuleId, setAddingFeatureModuleId] = useState(null);

  const fetchSummary = () => {
    if (!orgId || !projectId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/features/summary`)
      .then((r) => {
        if (r.data?.success) setModules(r.data.modules || []);
        else setModules([]);
      })
      .catch((e) => setError(e?.response?.data?.message || "Failed to load feature analysis"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  const totals = useMemo(() => {
    const totalFeatures = modules.reduce((acc, m) => acc + (m.totalFeatures || 0), 0);
    const completedFeatures = modules.reduce((acc, m) => acc + (m.completedFeatures || 0), 0);
    return { totalFeatures, completedFeatures };
  }, [modules]);

  const createModule = () => {
    if (!moduleName.trim()) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules`, { name: moduleName.trim() })
      .then((r) => {
        toast.success(r.data?.message || "Module created", { position: "top-right", autoClose: 3500, theme: "dark" });
        setModuleName("");
        setShowModuleForm(false);
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create module", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const startEditModule = (m) => {
    setEditingModuleId(m._id);
    setEditingModuleName(m.name);
  };

  const saveModuleEdit = (m) => {
    const trimmed = (editingModuleName || "").trim();
    if (!trimmed) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`, { name: trimmed })
      .then((r) => {
        toast.success(r.data?.message || "Module updated", { position: "top-right", autoClose: 3500, theme: "dark" });
        setEditingModuleId(null);
        setEditingModuleName("");
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to update module", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const deleteModule = (m) => {
    if (!window.confirm(`Delete module "${m.name}"? This will remove all its features and unassign them from tasks.`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Module deleted", { position: "top-right", autoClose: 3500, theme: "dark" });
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete module", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const createFeature = (moduleId) => {
    const name = (featureDrafts[moduleId] || "").trim();
    if (!name) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${moduleId}/features`, { name })
      .then((r) => {
        toast.success(r.data?.message || "Feature created", { position: "top-right", autoClose: 3500, theme: "dark" });
        setFeatureDrafts((p) => ({ ...p, [moduleId]: "" }));
        setAddingFeatureModuleId(null);
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create feature", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const startEditFeature = (f) => {
    setEditingFeatureId(f._id);
    setEditingFeatureName(f.name);
  };

  const saveFeatureEdit = (f) => {
    const trimmed = (editingFeatureName || "").trim();
    if (!trimmed) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`, { name: trimmed })
      .then((r) => {
        toast.success(r.data?.message || "Feature updated", { position: "top-right", autoClose: 3500, theme: "dark" });
        setEditingFeatureId(null);
        setEditingFeatureName("");
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to update feature", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const deleteFeature = (f) => {
    if (!window.confirm(`Delete feature "${f.name}"? It will be unassigned from tasks.`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Feature deleted", { position: "top-right", autoClose: 3500, theme: "dark" });
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete feature", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  if (!projectId) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 bg-card">
        <div className="text-sm text-muted-foreground">Select a project to view features.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-52 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-4 w-72 rounded-lg bg-muted/60 animate-pulse" />
          </div>
          <div className="h-9 w-28 rounded-lg bg-muted/60 animate-pulse" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="h-5 w-48 rounded-lg bg-muted/60 mb-3" />
            <div className="h-4 w-80 rounded-lg bg-muted/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="text-sm text-destructive mb-3">{error}</div>
        <button onClick={fetchSummary} className="ww-btn-primary inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold ww-heading">Feature Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Completed {totals.completedFeatures} / {totals.totalFeatures} features across {modules.length} modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowModuleForm((p) => !p)}
            className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Module
          </button>
        </div>
      </div>

      {showModuleForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="Module name (e.g. User)"
              className="ww-input flex-1"
            />
            <button onClick={createModule} className="ww-btn-primary">
              Add
            </button>
            <button onClick={() => { setShowModuleForm(false); setModuleName(""); }} className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted">
              Cancel
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Module is completed only when all its features are completed.</p>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 bg-card">
          <div className="text-sm text-muted-foreground">No modules yet. Add a module to start tracking features.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m) => {
            const pct = m.totalFeatures ? Math.round((m.completedFeatures / m.totalFeatures) * 100) : 0;
            return (
              <div key={m._id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {editingModuleId === m._id ? (
                        <input
                          value={editingModuleName}
                          onChange={(e) => setEditingModuleName(e.target.value)}
                          className="ww-input h-9 py-1.5 px-3"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-base font-semibold truncate">{m.name}</h3>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPill(m.status)}`}>{m.status}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.completedFeatures}/{m.totalFeatures} features
                      </span>
                    </div>
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {editingModuleId === m._id ? (
                      <>
                        <button onClick={() => saveModuleEdit(m)} className="ww-btn-primary">
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingModuleId(null); setEditingModuleName(""); }}
                          className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditModule(m)}
                        className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                        title="Edit module"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteModule(m)}
                      className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                      title="Delete module"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  {m.features?.length ? (
                    <div className="space-y-2">
                      {m.features.map((f) => (
                        <div key={f._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {editingFeatureId === f._id ? (
                                <input
                                  value={editingFeatureName}
                                  onChange={(e) => setEditingFeatureName(e.target.value)}
                                  className="ww-input h-9 py-1.5 px-3"
                                  autoFocus
                                />
                              ) : (
                                <div className="font-medium truncate">{f.name}</div>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPill(f.status)}`}>{f.status}</span>
                              <span className="text-xs text-muted-foreground">
                                {f.completedTasks}/{f.totalTasks} tasks
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {editingFeatureId === f._id ? (
                              <>
                                <button onClick={() => saveFeatureEdit(f)} className="ww-btn-primary">
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingFeatureId(null); setEditingFeatureName(""); }}
                                  className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditFeature(f)}
                                className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                                title="Edit feature"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteFeature(f)}
                              className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                              title="Delete feature"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No features in this module yet.</div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
                    {addingFeatureModuleId === m._id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          value={featureDrafts[m._id] || ""}
                          onChange={(e) => setFeatureDrafts((p) => ({ ...p, [m._id]: e.target.value }))}
                          placeholder="New feature…"
                          className="ww-input flex-1 h-9 py-1.5"
                          autoFocus
                        />
                        <button onClick={() => createFeature(m._id)} className="ww-btn-primary">
                          Add
                        </button>
                        <button
                          onClick={() => { setAddingFeatureModuleId(null); setFeatureDrafts((p) => ({ ...p, [m._id]: "" })); }}
                          className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground">
                          Add features at the bottom to keep the list clean.
                        </div>
                        <button
                          onClick={() => setAddingFeatureModuleId(m._id)}
                          className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Feature
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeatureAnalysis;
