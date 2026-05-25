import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

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

function FeatureAnalysis({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);
  const [moduleName, setModuleName] = useState("");
  const [featureDrafts, setFeatureDrafts] = useState({});
  const [moduleEdits, setModuleEdits] = useState({});
  const [featureEdits, setFeatureEdits] = useState({});

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
    modules.forEach((m) => {
      modEdits[m._id] = m.name;
      m.features?.forEach((f) => {
        featEdits[f._id] = f.name;
      });
    });
    setModuleEdits(modEdits);
    setFeatureEdits(featEdits);
  }, [modules]);

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
        fetchSummary();
      })
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to create module", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
  };

  const saveModuleName = (m) => {
    const trimmed = (moduleEdits[m._id] || "").trim();
    if (!trimmed || trimmed === m.name) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`, { name: trimmed })
      .then(() => fetchSummary())
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to update module", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
  };

  const deleteModule = (m) => {
    if (!window.confirm(`Delete module "${m.name}"? This will remove all its features and unassign them from tasks.`))
      return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${m._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Module deleted", { position: "top-right", autoClose: 3500, theme: "dark" });
        fetchSummary();
      })
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to delete module", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
  };

  const createFeature = (moduleId) => {
    const name = (featureDrafts[moduleId] || "").trim();
    if (!name) return;
    api
      .post(`/api/v1/org/${orgId}/projects/${projectId}/feature-modules/${moduleId}/features`, { name })
      .then((r) => {
        toast.success(r.data?.message || "Feature created", { position: "top-right", autoClose: 3500, theme: "dark" });
        setFeatureDrafts((p) => ({ ...p, [moduleId]: "" }));
        fetchSummary();
      })
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to create feature", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
  };

  const saveFeatureName = (f) => {
    const trimmed = (featureEdits[f._id] || "").trim();
    if (!trimmed || trimmed === f.name) return;
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`, { name: trimmed })
      .then(() => fetchSummary())
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to update feature", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
  };

  const deleteFeature = (f) => {
    if (!window.confirm(`Delete feature "${f.name}"? It will be unassigned from tasks.`)) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}/features/${f._id}`)
      .then((r) => {
        toast.success(r.data?.message || "Feature deleted", { position: "top-right", autoClose: 3500, theme: "dark" });
        fetchSummary();
      })
      .catch((e) =>
        toast.error(e?.response?.data?.message || "Failed to delete feature", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        })
      );
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
            {totals.completedFeatures} / {totals.totalFeatures} features · {modules.length} modules
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="border border-border hover:bg-muted text-sm py-1.5 px-3 rounded-lg inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

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

      {modules.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 bg-card text-center text-sm text-muted-foreground">
          No modules yet. Type a module name above to get started.
        </div>
      ) : (
        <div className="space-y-5">
          {modules.map((m) => {
            const pct = m.totalFeatures ? Math.round((m.completedFeatures / m.totalFeatures) * 100) : 0;
            return (
              <section key={m._id} className="rounded-xl border border-primary/20 overflow-hidden bg-card shadow-sm">
                <header className="flex flex-wrap items-center gap-3 px-4 py-3.5 bg-primary/10 border-b border-primary/25">
                  <div className="w-1.5 h-9 rounded-full bg-primary shrink-0" aria-hidden />
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary/90 mb-0.5 font-semibold">
                      Module
                    </div>
                    <InlineNameInput
                      value={moduleEdits[m._id] ?? m.name}
                      onChange={(v) => setModuleEdits((p) => ({ ...p, [m._id]: v }))}
                      onCommit={() => saveModuleName(m)}
                      className="text-lg font-bold text-foreground"
                    />
                  </div>
                  <StatusBadge status={m.status} size="lg" />
                  <span className="text-xs text-foreground/80 font-mono">
                    {m.completedFeatures}/{m.totalFeatures}
                  </span>
                  <div className="w-28 h-2 bg-background/60 rounded-full overflow-hidden hidden sm:block border border-primary/20">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteModule(m)}
                    className="p-2 rounded-lg border border-border bg-background/50 hover:bg-destructive/10 text-destructive ml-auto"
                    title="Delete module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </header>

                <div className="bg-[#0a0f14]/80 border-t border-border/40">
                  <div className="px-5 py-2 border-b border-border/30">
                    <div className="grid grid-cols-[1fr_auto_auto_32px] gap-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/90 pl-3">
                      <span>Feature</span>
                      <span className="w-24 text-center">Status</span>
                      <span className="w-16 text-center">Tasks</span>
                      <span />
                    </div>
                  </div>

                  <ul className="divide-y divide-border/25">
                    {(m.features || []).map((f) => (
                      <li
                        key={f._id}
                        className="grid grid-cols-[1fr_auto_auto_32px] gap-2 items-center pl-5 pr-4 py-2 hover:bg-[#00ff94]/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/70 shrink-0" aria-hidden />
                          <InlineNameInput
                            value={featureEdits[f._id] ?? f.name}
                            onChange={(v) => setFeatureEdits((p) => ({ ...p, [f._id]: v }))}
                            onCommit={() => saveFeatureName(f)}
                            className="text-xs font-normal text-muted-foreground hover:text-foreground focus:text-foreground"
                          />
                        </div>
                        <div className="w-24 flex justify-center scale-90 origin-center">
                          <StatusBadge status={f.status} />
                        </div>
                        <span className="w-16 text-center text-[10px] font-mono text-muted-foreground/80">
                          {f.completedTasks}/{f.totalTasks}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteFeature(f)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive"
                          title="Delete feature"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                    <li className="grid grid-cols-[1fr_auto_auto_32px] gap-2 items-center pl-5 pr-4 py-2 bg-[#00d4ff]/[0.04] border-t border-dashed border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="w-3 h-3 text-[#00d4ff]/70 shrink-0" />
                        <input
                          value={featureDrafts[m._id] || ""}
                          onChange={(e) => setFeatureDrafts((p) => ({ ...p, [m._id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && createFeature(m._id)}
                          placeholder="New feature…"
                          className="text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 w-full text-foreground"
                        />
                      </div>
                      <span className="w-24" />
                      <span className="w-16" />
                      <button
                        type="button"
                        onClick={() => createFeature(m._id)}
                        disabled={!(featureDrafts[m._id] || "").trim()}
                        className="p-1 rounded text-[#00d4ff] disabled:opacity-30"
                        title="Add feature"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FeatureAnalysis;
