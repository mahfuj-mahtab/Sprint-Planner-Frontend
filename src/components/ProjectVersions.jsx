import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { toast } from "react-toastify";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Skeleton, Spinner } from "./ui/Loading";

const statusPill = (status) => {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (status === "in-progress") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
  return "bg-muted/60 text-muted-foreground border-border";
};

function ProjectVersions({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [versionDetails, setVersionDetails] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [featureModules, setFeatureModules] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [assignFeatureId, setAssignFeatureId] = useState("");

  const fetchVersions = () => {
    if (!orgId || !projectId) return;
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/versions`)
      .then((r) => {
        if (r.data?.success) {
          const list = r.data.versions || [];
          setVersions(list);
          if (!selectedVersionId && list[0]?._id) setSelectedVersionId(list[0]._id);
        }
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to load versions", { position: "top-right", autoClose: 5000, theme: "dark" }))
      .finally(() => setLoading(false));
  };

  const fetchFeatureSummary = () => {
    if (!orgId || !projectId) return;
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/features/summary`)
      .then((r) => {
        if (r.data?.success) setFeatureModules(r.data.modules || []);
        else setFeatureModules([]);
      })
      .catch(() => setFeatureModules([]));
  };

  const fetchDetails = (versionId = selectedVersionId) => {
    if (!orgId || !projectId || !versionId) return;
    setDetailsLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/versions/${versionId}`)
      .then((r) => {
        if (r.data?.success) setVersionDetails(r.data);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to load version details", { position: "top-right", autoClose: 5000, theme: "dark" }))
      .finally(() => setDetailsLoading(false));
  };

  useEffect(() => {
    if (!projectId) return;
    setSelectedVersionId(null);
    setVersionDetails(null);
    fetchVersions();
    fetchFeatureSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  useEffect(() => {
    if (selectedVersionId) fetchDetails(selectedVersionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId]);

  const assignedFeatureSet = useMemo(() => {
    const ids = new Set();
    const modules = versionDetails?.modules || [];
    for (const m of modules) for (const f of m.features || []) ids.add(f._id);
    return ids;
  }, [versionDetails]);

  const createVersion = () => {
    const name = newName.trim();
    if (!name) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/versions`, { name, description: newDesc })
      .then((r) => {
        toast.success(r.data?.message || "Version created", { position: "top-right", autoClose: 3500, theme: "dark" });
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        fetchVersions();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create version", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const deleteVersion = (v) => {
    if (!window.confirm(`Delete version "${v.name}"?`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/versions/${v._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Version deleted", { position: "top-right", autoClose: 3500, theme: "dark" });
        if (selectedVersionId === v._id) {
          setSelectedVersionId(null);
          setVersionDetails(null);
        }
        fetchVersions();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete version", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  const assignFeature = () => {
    if (!assignFeatureId || !selectedVersionId) return;
    setAssigning(true);
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/versions/${selectedVersionId}/features`, { featureId: assignFeatureId })
      .then((r) => {
        toast.success(r.data?.message || "Feature assigned", { position: "top-right", autoClose: 3000, theme: "dark" });
        setAssignFeatureId("");
        fetchDetails(selectedVersionId);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to assign feature", { position: "top-right", autoClose: 5000, theme: "dark" }))
      .finally(() => setAssigning(false));
  };

  const removeFeature = (featureId) => {
    if (!selectedVersionId) return;
    if (!window.confirm("Remove this feature from the version? (This will not delete the feature.)")) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/versions/${selectedVersionId}/features/${featureId}`)
      .then((r) => {
        toast.success(r.data?.message || "Feature removed", { position: "top-right", autoClose: 3000, theme: "dark" });
        fetchDetails(selectedVersionId);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to remove feature", { position: "top-right", autoClose: 5000, theme: "dark" }));
  };

  if (!projectId) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 bg-card">
        <div className="text-sm text-muted-foreground">Select a project to manage versions.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
          <Spinner className="mt-2" label="Loading versions…" />
        </div>
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-6 w-56 mb-3" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Versions</div>
            <div className="text-xs text-muted-foreground">Assign features per release</div>
          </div>
          <button
            onClick={() => setShowCreate((p) => !p)}
            className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {showCreate && (
          <div className="border border-border rounded-xl p-3 bg-muted/10 mb-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="ww-input mb-2" placeholder="Version name (e.g. v1)" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" rows={3} placeholder="Short description (optional)" />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }} className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted">
                Cancel
              </button>
              <button onClick={createVersion} className="ww-btn-primary">
                Create
              </button>
            </div>
          </div>
        )}

        {versions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No versions yet.</div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v._id}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  selectedVersionId === v._id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                }`}
                onClick={() => setSelectedVersionId(v._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{v.name}</div>
                    {v.description ? <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{v.description}</div> : null}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteVersion(v); }}
                    className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                    title="Delete version"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-semibold ww-heading">Version Features</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign features from your project. Status is read-only and comes from tasks.
            </p>
          </div>
          <button
            onClick={() => { fetchVersions(); if (selectedVersionId) fetchDetails(selectedVersionId); }}
            className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {!selectedVersionId ? (
          <div className="text-sm text-muted-foreground">Select a version to view details.</div>
        ) : detailsLoading ? (
          <div>
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-40 w-full" />
            <Spinner className="mt-4" label="Loading version details…" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <select
                value={assignFeatureId}
                onChange={(e) => setAssignFeatureId(e.target.value)}
                className="ww-input flex-1"
              >
                <option value="">Assign a feature…</option>
                {featureModules.map((m) => (
                  <optgroup key={m._id} label={m.name}>
                    {(m.features || []).map((f) => (
                      <option key={f._id} value={f._id} disabled={assignedFeatureSet.has(f._id)}>
                        {f.name}{assignedFeatureSet.has(f._id) ? " (assigned)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button onClick={assignFeature} disabled={!assignFeatureId || assigning} className="ww-btn-primary disabled:opacity-60">
                {assigning ? "Adding…" : "Add"}
              </button>
            </div>

            {(versionDetails?.modules || []).length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-6 bg-background">
                <div className="text-sm text-muted-foreground">No features assigned to this version yet.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {(versionDetails.modules || []).map((m) => (
                  <div key={m._id} className="border border-border rounded-xl overflow-hidden bg-background">
                    <div className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold truncate">{m.name}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPill(m.status)}`}>{m.status}</span>
                          <span className="text-xs text-muted-foreground">{m.completedFeatures}/{m.totalFeatures} features</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      {m.features?.length ? (
                        <div className="space-y-2">
                          {m.features.map((f) => (
                            <div key={f._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/10">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-medium truncate">{f.name}</div>
                                  <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPill(f.status)}`}>{f.status}</span>
                                  <span className="text-xs text-muted-foreground">{f.completedTasks}/{f.totalTasks} tasks</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFeature(f._id)}
                                className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                                title="Remove from version"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No features in this module for this version.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProjectVersions;
