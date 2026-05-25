import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { toast } from "react-toastify";
import { Plus, Trash2, RefreshCw, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { Skeleton, Spinner } from "./ui/Loading";
import { cn } from "@/lib/utils";

const statusPill = (status) => {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (status === "active") return "bg-primary/15 text-primary border-primary/30";
  if (status === "planned") return "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30";
  return "bg-muted/60 text-muted-foreground border-border";
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

function ProjectVersions({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [canCreateVersion, setCanCreateVersion] = useState(true);
  const [createBlockedReason, setCreateBlockedReason] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [versionDetails, setVersionDetails] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [featureModules, setFeatureModules] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [assignFeatureId, setAssignFeatureId] = useState("");

  const selectedVersion = useMemo(
    () => versions.find((v) => v._id === selectedVersionId),
    [versions, selectedVersionId]
  );

  const isLocked = selectedVersion?.is_locked;
  const isCompleted = selectedVersion?.status === "completed";
  const featuresMutable = selectedVersion && !isLocked && !isCompleted;

  const fetchVersions = () => {
    if (!orgId || !projectId) return;
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/versions`)
      .then((r) => {
        if (r.data?.success) {
          const list = r.data.versions || [];
          setVersions(list);
          setCurrentVersionId(r.data.currentVersionId || null);
          setCanCreateVersion(r.data.canCreateVersion !== false);
          setCreateBlockedReason(r.data.createBlockedReason || null);
          if (!selectedVersionId && list[0]?._id) setSelectedVersionId(list[0]._id);
        }
      })
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to load versions", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      )
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
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to load version details", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      )
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

  const patchVersion = (body, successMsg) => {
    if (!selectedVersionId) return Promise.resolve();
    return api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/versions/${selectedVersionId}`, body)
      .then((r) => {
        toast.success(successMsg || r.data?.message, { theme: "dark" });
        fetchVersions();
        fetchDetails(selectedVersionId);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed", { theme: "dark" }));
  };

  const createVersion = () => {
    const name = newName.trim();
    if (!name || !newStart || !newEnd) {
      toast.error("Name, start date, and end date are required", { theme: "dark" });
      return;
    }
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/versions`, {
        name,
        description: newDesc,
        start_date: newStart,
        end_date: newEnd,
      })
      .then((r) => {
        toast.success(r.data?.message || "Version created", { theme: "dark" });
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        setNewStart("");
        setNewEnd("");
        fetchVersions();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create version", { theme: "dark" }));
  };

  const deleteVersion = (v) => {
    if (!window.confirm(`Delete version "${v.name}"?`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/versions/${v._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Version deleted", { theme: "dark" });
        if (selectedVersionId === v._id) {
          setSelectedVersionId(null);
          setVersionDetails(null);
        }
        fetchVersions();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete version", { theme: "dark" }));
  };

  const assignFeature = () => {
    if (!assignFeatureId || !selectedVersionId || !featuresMutable) return;
    setAssigning(true);
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/versions/${selectedVersionId}/features`, {
        featureId: assignFeatureId,
      })
      .then((r) => {
        toast.success(r.data?.message || "Feature assigned", { theme: "dark" });
        setAssignFeatureId("");
        fetchDetails(selectedVersionId);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to assign feature", { theme: "dark" }))
      .finally(() => setAssigning(false));
  };

  const removeFeature = (featureId) => {
    if (!selectedVersionId || !featuresMutable) return;
    if (!window.confirm("Remove this feature from the version?")) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/versions/${selectedVersionId}/features/${featureId}`)
      .then((r) => {
        toast.success(r.data?.message || "Feature removed", { theme: "dark" });
        fetchDetails(selectedVersionId);
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to remove feature", { theme: "dark" }));
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
        </div>
        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-4">
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
            <div className="text-xs text-muted-foreground">One active release at a time</div>
          </div>
          <button
            type="button"
            disabled={!canCreateVersion}
            onClick={() => canCreateVersion && setShowCreate((p) => !p)}
            title={createBlockedReason || "New version"}
            className="bg-primary hover:brightness-95 disabled:opacity-40 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {!canCreateVersion && createBlockedReason ? (
          <p className="text-xs text-amber-400/90 border border-amber-500/30 bg-amber-500/10 rounded-lg px-2.5 py-2 mb-3">
            {createBlockedReason}
          </p>
        ) : null}

        {showCreate && canCreateVersion && (
          <div className="border border-border rounded-xl p-3 bg-muted/10 mb-3 space-y-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="ww-input w-full" placeholder="Version name (e.g. v2.0)" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ww-label text-[10px]">Start date</label>
                <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="ww-input w-full" />
              </div>
              <div>
                <label className="ww-label text-[10px]">End date</label>
                <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="ww-input w-full" />
              </div>
            </div>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Description (optional)"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm px-3 py-1.5 rounded-md border border-border">
                Cancel
              </button>
              <button type="button" onClick={createVersion} className="ww-btn-primary text-sm">
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
                className={cn(
                  "p-3 rounded-xl border transition-colors cursor-pointer",
                  selectedVersionId === v._id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30",
                  currentVersionId === v._id && "ring-1 ring-primary/40"
                )}
                onClick={() => setSelectedVersionId(v._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold truncate">{v.name}</span>
                      {currentVersionId === v._id ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono uppercase">
                          Running
                        </span>
                      ) : null}
                      {v.is_locked ? <Lock className="w-3 h-3 text-amber-400 shrink-0" /> : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {fmtDate(v.start_date)} → {fmtDate(v.end_date)}
                    </div>
                    <span className={cn("inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border", statusPill(v.status))}>
                      {v.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVersion(v);
                    }}
                    disabled={v.is_locked || v.status === "active"}
                    className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-30"
                    title="Delete version"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-semibold ww-heading">Version scope</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign features for this release. Lock the version to freeze scope; complete it before starting another.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchVersions();
              if (selectedVersionId) fetchDetails(selectedVersionId);
            }}
            className="border border-border hover:bg-muted text-sm py-1.5 px-3 rounded-md inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {selectedVersion ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => patchVersion({ is_locked: !selectedVersion.is_locked })}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-1.5"
            >
              {selectedVersion.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {selectedVersion.is_locked ? "Unlock" : "Lock scope"}
            </button>
            {selectedVersion.status !== "completed" ? (
              <button
                type="button"
                onClick={() => patchVersion({ complete: true }, "Version completed")}
                className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark completed
              </button>
            ) : null}
            {isLocked ? (
              <span className="text-xs text-amber-400 self-center">Locked — cannot add or remove features</span>
            ) : null}
            {isCompleted ? (
              <span className="text-xs text-emerald-400 self-center">Completed — read-only</span>
            ) : null}
          </div>
        ) : null}

        {!selectedVersionId ? (
          <div className="text-sm text-muted-foreground">Select a version.</div>
        ) : detailsLoading ? (
          <Spinner label="Loading version details…" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <select
                value={assignFeatureId}
                onChange={(e) => setAssignFeatureId(e.target.value)}
                disabled={!featuresMutable}
                className="ww-input flex-1 disabled:opacity-50"
              >
                <option value="">Assign a feature…</option>
                {featureModules.map((m) => (
                  <optgroup key={m._id} label={m.name}>
                    {(m.features || []).map((f) => (
                      <option key={f._id} value={f._id} disabled={assignedFeatureSet.has(f._id)}>
                        {f.name}
                        {assignedFeatureSet.has(f._id) ? " (assigned)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                onClick={assignFeature}
                disabled={!assignFeatureId || assigning || !featuresMutable}
                className="ww-btn-primary disabled:opacity-50"
              >
                {assigning ? "Adding…" : "Add"}
              </button>
            </div>

            {(versionDetails?.modules || []).length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground">
                No features in this version yet.
              </div>
            ) : (
              <div className="space-y-3">
                {(versionDetails.modules || []).map((m) => (
                  <div key={m._id} className="border border-border rounded-xl overflow-hidden bg-background">
                    <div className="p-3 flex items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded border", statusPill(m.status))}>{m.status}</span>
                    </div>
                    <div className="px-3 pb-3 space-y-2">
                      {(m.features || []).map((f) => (
                        <div key={f._id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm truncate">{f.name}</span>
                            <span className={cn("text-xs px-1.5 py-0.5 rounded border", statusPill(f.status))}>{f.status}</span>
                          </div>
                          <button
                            type="button"
                            disabled={!featuresMutable}
                            onClick={() => removeFeature(f._id)}
                            className="p-1.5 rounded border border-border hover:bg-destructive/10 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      ))}
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
