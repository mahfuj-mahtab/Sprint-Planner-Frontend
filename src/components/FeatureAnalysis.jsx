import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../ApiInception";
import { Download, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { countAllFeatures, FEATURE_IMPORT_EXAMPLE } from "@/lib/featureTree";
import { Modal } from "@/components/org/Modal";

const STATUS = {
  completed: {
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 ring-1 ring-emerald-500/30 font-semibold",
  },
  "in-progress": {
    label: "In progress",
    className: "bg-amber-500/20 text-amber-200 border-amber-400/50 ring-1 ring-amber-500/35 font-semibold",
  },
  pending: {
    label: "Pending",
    className: "bg-slate-500/25 text-slate-200 border-slate-400/40 font-medium",
  },
};

function StatusBadge({ status, size = "sm" }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 uppercase tracking-wide",
        size === "lg" ? "text-[11px]" : "text-[10px]",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

function InlineNameInput({ value, onChange, onCommit, placeholder, className }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit();
        }
        if (e.key === "Escape") onCommit();
      }}
      placeholder={placeholder}
      className={cn(
        "w-full min-w-0 bg-transparent border-0 outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -mx-1",
        className
      )}
    />
  );
}

function FeatureRow({ feature, canWrite, featureEdits, setFeatureEdits, onSave, onDelete }) {
  return (
    <li className="grid grid-cols-[1fr_auto_auto_32px] gap-2 items-center pl-5 pr-4 py-2 hover:bg-[#00ff94]/[0.03] transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/70 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          {canWrite ? (
            <InlineNameInput
              value={featureEdits[feature._id] ?? feature.name}
              onChange={(v) => setFeatureEdits((p) => ({ ...p, [feature._id]: v }))}
              onCommit={() => onSave(feature)}
              className="text-xs font-normal text-muted-foreground hover:text-foreground focus:text-foreground"
            />
          ) : (
            <span className="text-xs text-muted-foreground">{feature.name}</span>
          )}
          {feature.description ? (
            <p className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-2 pl-3">{feature.description}</p>
          ) : null}
        </div>
      </div>
      <div className="w-24 flex justify-center scale-90 origin-center">
        <StatusBadge status={feature.status} />
      </div>
      <span className="w-16 text-center text-[10px] font-mono text-muted-foreground/80">
        {feature.completedTasks}/{feature.totalTasks}
      </span>
      {canWrite ? (
        <button
          type="button"
          onClick={() => onDelete(feature)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive"
          title="Delete feature"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : (
        <span />
      )}
    </li>
  );
}

function SubModuleSection({
  sub,
  canWrite,
  moduleEdits,
  setModuleEdits,
  featureEdits,
  setFeatureEdits,
  featureDrafts,
  setFeatureDrafts,
  onSaveSubModule,
  onDeleteSubModule,
  onSaveFeature,
  onDeleteFeature,
  onCreateFeature,
}) {
  const pct = sub.totalFeatures ? Math.round((sub.completedFeatures / sub.totalFeatures) * 100) : 0;

  return (
    <div className="border-t border-border/30 bg-[#0a0f14]/50">
      <header className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#00d4ff]/[0.06] border-b border-border/25">
        <div className="flex-1 min-w-[140px]">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#00d4ff]/80 mb-0.5">Sub-module</div>
          {canWrite ? (
            <InlineNameInput
              value={moduleEdits[sub._id] ?? sub.name}
              onChange={(v) => setModuleEdits((p) => ({ ...p, [sub._id]: v }))}
              onCommit={() => onSaveSubModule(sub)}
              className="text-sm font-semibold text-foreground"
            />
          ) : (
            <span className="text-sm font-semibold">{sub.name}</span>
          )}
        </div>
        <StatusBadge status={sub.status} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {sub.completedFeatures}/{sub.totalFeatures}
        </span>
        <div className="w-20 h-1.5 bg-background/60 rounded-full overflow-hidden hidden sm:block">
          <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => onDeleteSubModule(sub)}
            className="p-1.5 rounded hover:bg-destructive/10 text-destructive ml-auto"
            title="Delete sub-module"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </header>

      <ul className="divide-y divide-border/20">
        {(sub.features || []).map((f) => (
          <FeatureRow
            key={f._id}
            feature={f}
            canWrite={canWrite}
            featureEdits={featureEdits}
            setFeatureEdits={setFeatureEdits}
            onSave={onSaveFeature}
            onDelete={onDeleteFeature}
          />
        ))}
        {canWrite ? (
          <li className="grid grid-cols-[1fr_auto_auto_32px] gap-2 items-center pl-5 pr-4 py-2 bg-[#00d4ff]/[0.04] border-t border-dashed border-border/40">
            <div className="flex items-center gap-2 min-w-0">
              <Plus className="w-3 h-3 text-[#00d4ff]/70 shrink-0" />
              <input
                value={featureDrafts[sub._id] || ""}
                onChange={(e) => setFeatureDrafts((p) => ({ ...p, [sub._id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && onCreateFeature(sub._id)}
                placeholder="New feature…"
                className="text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 w-full text-foreground"
              />
            </div>
            <span className="w-24" />
            <span className="w-16" />
            <button
              type="button"
              onClick={() => onCreateFeature(sub._id)}
              disabled={!(featureDrafts[sub._id] || "").trim()}
              className="p-1 rounded text-[#00d4ff] disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function FeatureAnalysis({ orgId, projectId, canWrite = true }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);
  const [moduleName, setModuleName] = useState("");
  const [subModuleDrafts, setSubModuleDrafts] = useState({});
  const [featureDrafts, setFeatureDrafts] = useState({});
  const [moduleEdits, setModuleEdits] = useState({});
  const [featureEdits, setFeatureEdits] = useState({});
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState("merge");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    const modEdits = {};
    const featEdits = {};
    const walk = (mod) => {
      modEdits[mod._id] = mod.name;
      (mod.features || []).forEach((f) => {
        featEdits[f._id] = f.name;
      });
      (mod.subModules || []).forEach(walk);
    };
    modules.forEach(walk);
    setModuleEdits(modEdits);
    setFeatureEdits(featEdits);
  }, [modules]);

  const totals = useMemo(() => countAllFeatures(modules), [modules]);

  const createModule = () => {
    if (!canWrite || !moduleName.trim()) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules`, { name: moduleName.trim() })
      .then((r) => {
        toast.success(r.data?.message || "Module created", { theme: "dark" });
        setModuleName("");
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create module", { theme: "dark" }));
  };

  const createSubModule = (parentModuleId) => {
    if (!canWrite) return;
    const name = (subModuleDrafts[parentModuleId] || "").trim();
    if (!name) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules`, {
        name,
        parent_module_id: parentModuleId,
      })
      .then((r) => {
        toast.success(r.data?.message || "Sub-module created", { theme: "dark" });
        setSubModuleDrafts((p) => ({ ...p, [parentModuleId]: "" }));
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create sub-module", { theme: "dark" }));
  };

  const saveModuleName = (m) => {
    if (!canWrite) return;
    const trimmed = (moduleEdits[m._id] || "").trim();
    if (!trimmed || trimmed === m.name) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`, { name: trimmed })
      .then(() => fetchSummary())
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to update", { theme: "dark" }));
  };

  const deleteModule = (m) => {
    if (!canWrite) return;
    if (!window.confirm(`Delete module "${m.name}" and all sub-modules/features?`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Deleted", { theme: "dark" });
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete", { theme: "dark" }));
  };

  const deleteSubModule = (sub) => {
    if (!canWrite) return;
    if (!window.confirm(`Delete sub-module "${sub.name}" and its features?`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${sub._id}`)
      .then(() => fetchSummary())
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete", { theme: "dark" }));
  };

  const createFeature = (moduleId) => {
    if (!canWrite) return;
    const name = (featureDrafts[moduleId] || "").trim();
    if (!name) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${moduleId}/features`, { name })
      .then((r) => {
        toast.success(r.data?.message || "Feature created", { theme: "dark" });
        setFeatureDrafts((p) => ({ ...p, [moduleId]: "" }));
        fetchSummary();
      })
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to create feature", { theme: "dark" }));
  };

  const saveFeatureName = (f) => {
    if (!canWrite) return;
    const trimmed = (featureEdits[f._id] || "").trim();
    if (!trimmed || trimmed === f.name) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`, { name: trimmed })
      .then(() => fetchSummary())
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to update feature", { theme: "dark" }));
  };

  const deleteFeature = (f) => {
    if (!canWrite) return;
    if (!window.confirm(`Delete feature "${f.name}"?`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`)
      .then(() => fetchSummary())
      .catch((e) => toast.error(e?.response?.data?.message || "Failed to delete feature", { theme: "dark" }));
  };

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(FEATURE_IMPORT_EXAMPLE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feature-tree-template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file) => {
    if (!file || !canWrite) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const r = await api.post(`/api/v1/org/${orgId}/projects/${projectId}/features/import`, {
        modules: parsed.modules ?? parsed,
        mode: importMode,
      });
      toast.success(r.data?.message || "Imported", { theme: "dark" });
      setImportOpen(false);
      fetchSummary();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Import failed", { theme: "dark" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-muted/60 rounded-lg" />
        <div className="h-32 bg-muted/40 rounded-xl border border-border" />
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
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-semibold ww-heading">Feature Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totals.completed} / {totals.total} features · {modules.length} modules
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="border border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff] text-sm py-1.5 px-3 rounded-lg inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </button>
          ) : null}
          <button
            onClick={fetchSummary}
            className="border border-border hover:bg-muted text-sm py-1.5 px-3 rounded-lg inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {canWrite ? (
        <div className="flex gap-2 mb-5">
          <input
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createModule()}
            placeholder="New module name…"
            className="ww-input flex-1 max-w-md"
          />
          <button onClick={createModule} className="ww-btn-primary inline-flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add module
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-5">Read-only — join a project team with editor access to manage features.</p>
      )}

      {modules.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 bg-card text-center text-sm text-muted-foreground">
          No modules yet. Add a module or import a JSON feature tree.
        </div>
      ) : (
        <div className="space-y-5">
          {modules.map((m) => {
            const pct = m.totalFeatures ? Math.round((m.completedFeatures / m.totalFeatures) * 100) : 0;
            const subModules = m.subModules || [];
            const parentDirectFeatures = m.features || [];

            return (
              <section key={m._id} className="rounded-xl border border-primary/20 overflow-hidden bg-card shadow-sm">
                <header className="flex flex-wrap items-center gap-3 px-4 py-3.5 bg-primary/10 border-b border-primary/25">
                  <div className="w-1.5 h-9 rounded-full bg-primary shrink-0" aria-hidden />
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary/90 mb-0.5 font-semibold">
                      Module
                    </div>
                    {canWrite ? (
                      <InlineNameInput
                        value={moduleEdits[m._id] ?? m.name}
                        onChange={(v) => setModuleEdits((p) => ({ ...p, [m._id]: v }))}
                        onCommit={() => saveModuleName(m)}
                        className="text-lg font-bold text-foreground"
                      />
                    ) : (
                      <span className="text-lg font-bold text-foreground">{m.name}</span>
                    )}
                  </div>
                  <StatusBadge status={m.status} size="lg" />
                  <span className="text-xs text-foreground/80 font-mono">
                    {m.completedFeatures}/{m.totalFeatures}
                  </span>
                  <div className="w-28 h-2 bg-background/60 rounded-full overflow-hidden hidden sm:block border border-primary/20">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => deleteModule(m)}
                      className="p-2 rounded-lg border border-border bg-background/50 hover:bg-destructive/10 text-destructive ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </header>

                {subModules.map((sub) => (
                  <SubModuleSection
                    key={sub._id}
                    sub={sub}
                    canWrite={canWrite}
                    moduleEdits={moduleEdits}
                    setModuleEdits={setModuleEdits}
                    featureEdits={featureEdits}
                    setFeatureEdits={setFeatureEdits}
                    featureDrafts={featureDrafts}
                    setFeatureDrafts={setFeatureDrafts}
                    onSaveSubModule={saveModuleName}
                    onDeleteSubModule={deleteSubModule}
                    onSaveFeature={saveFeatureName}
                    onDeleteFeature={deleteFeature}
                    onCreateFeature={createFeature}
                  />
                ))}

                {parentDirectFeatures.length > 0 ? (
                  <div className="border-t border-border/30">
                    <div className="px-4 py-2 text-[10px] font-mono uppercase text-amber-400/90 bg-amber-500/10">
                      Features on module (move into a sub-module)
                    </div>
                    <ul className="divide-y divide-border/20">
                      {parentDirectFeatures.map((f) => (
                        <FeatureRow
                          key={f._id}
                          feature={f}
                          canWrite={canWrite}
                          featureEdits={featureEdits}
                          setFeatureEdits={setFeatureEdits}
                          onSave={saveFeatureName}
                          onDelete={deleteFeature}
                        />
                      ))}
                    </ul>
                  </div>
                ) : null}

                {canWrite ? (
                  <div className="px-4 py-3 border-t border-dashed border-border/40 bg-muted/10 flex gap-2">
                    <input
                      value={subModuleDrafts[m._id] || ""}
                      onChange={(e) => setSubModuleDrafts((p) => ({ ...p, [m._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && createSubModule(m._id)}
                      placeholder="New sub-module…"
                      className="ww-input ww-input-sm flex-1 max-w-sm"
                    />
                    <button
                      type="button"
                      onClick={() => createSubModule(m._id)}
                      disabled={!(subModuleDrafts[m._id] || "").trim()}
                      className="text-sm px-3 py-1.5 rounded-md border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add sub-module
                    </button>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <Modal open={importOpen} onClose={() => !importing && setImportOpen(false)} title="Import feature tree">
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Upload a JSON file with modules, sub-modules, and features. Use merge to add missing items, or replace to
            wipe and rebuild the tree.
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={importMode === "merge"} onChange={() => setImportMode("merge")} />
              Merge (keep existing)
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={importMode === "replace"} onChange={() => setImportMode("replace")} />
              Replace all
            </label>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-sm inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Download className="w-4 h-4" />
            Download example template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            disabled={importing}
            onChange={(e) => handleImportFile(e.target.files?.[0])}
            className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
          />
          {importing ? <p className="text-muted-foreground">Importing…</p> : null}
        </div>
      </Modal>
    </div>
  );
}

export default FeatureAnalysis;
