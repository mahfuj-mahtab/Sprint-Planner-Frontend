import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import { toast } from "react-toastify";
import { Skeleton, Spinner } from "./ui/Loading";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const template = `# Overview
Describe what this project does and who it is for.

# Goals
- 

# Scope
In-scope:
- 
Out-of-scope:
- 

# Modules & Features
- Module: User
  - Login
  - Register

# Notes
- `;

function ProjectDocs({ orgId, projectId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [serverDoc, setServerDoc] = useState("");
  const [doc, setDoc] = useState("");
  const [mode, setMode] = useState("write"); // "write" | "preview"

  const isDirty = useMemo(() => doc !== serverDoc, [doc, serverDoc]);

  const fetchProject = () => {
    if (!orgId || !projectId) return;
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/projects/${projectId}`)
      .then((r) => {
        if (r.data?.success) {
          const p = r.data.project;
          setProjectName(p?.name || "");
          const d = p?.documentation || "";
          setServerDoc(d);
          setDoc(d);
        }
      })
      .catch((e) => {
        toast.error(e?.response?.data?.message || "Failed to load project docs", { position: "top-right", autoClose: 5000, theme: "dark" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId]);

  const save = () => {
    if (!isDirty) return;
    setSaving(true);
    api
      .patch(`/api/v1/org/${orgId}/projects/${projectId}`, { documentation: doc })
      .then((r) => {
        toast.success(r.data?.message || "Documentation saved", { position: "top-right", autoClose: 3500, theme: "dark" });
        setServerDoc(doc);
      })
      .catch((e) => {
        toast.error(e?.response?.data?.message || "Failed to save documentation", { position: "top-right", autoClose: 5000, theme: "dark" });
      })
      .finally(() => setSaving(false));
  };

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
        <Skeleton className="h-4 w-80 mb-5" />
        <Skeleton className="h-64 w-full" />
        <Spinner className="mt-4" label="Loading documentation…" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold ww-heading">Documentation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {projectName ? <span className="font-mono text-foreground">{projectName}</span> : "Project"} docs (Markdown supported).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "write" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "preview" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Preview
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDoc(serverDoc)}
            disabled={!isDirty || saving}
            className="border border-border hover:bg-muted disabled:opacity-50 text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            className="bg-primary hover:brightness-95 disabled:opacity-50 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {doc.trim().length === 0 && (
        <div className="mb-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
          <span>Start with a professional template.</span>
          <button
            type="button"
            onClick={() => setDoc(template)}
            className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors"
          >
            Insert template
          </button>
        </div>
      )}

      {mode === "write" ? (
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          rows={18}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 font-mono"
          placeholder="Write project docs here…"
        />
      ) : (
        <div className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground overflow-auto min-h-[420px]">
          {doc.trim().length === 0 ? (
            <div className="text-sm text-muted-foreground">Nothing to preview yet.</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (p) => <h1 className="text-2xl font-semibold ww-heading mt-1 mb-3" {...p} />,
                h2: (p) => <h2 className="text-xl font-semibold ww-heading mt-6 mb-2" {...p} />,
                h3: (p) => <h3 className="text-lg font-semibold ww-heading mt-4 mb-2" {...p} />,
                p: (p) => <p className="text-sm text-foreground/90 leading-6 mb-3" {...p} />,
                ul: (p) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-foreground/90" {...p} />,
                ol: (p) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-foreground/90" {...p} />,
                li: (p) => <li className="leading-6" {...p} />,
                a: (p) => <a className="text-primary underline underline-offset-4 hover:opacity-90" target="_blank" rel="noreferrer" {...p} />,
                blockquote: (p) => <blockquote className="border-l-2 border-border pl-4 text-muted-foreground mb-3" {...p} />,
                code: ({ inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-muted/60 border border-border font-mono text-[13px]" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={`block ${className || ""} font-mono text-[13px]`} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: (p) => (
                  <pre className="rounded-xl border border-border bg-muted/30 p-3 overflow-auto mb-3" {...p} />
                ),
                table: (p) => (
                  <div className="overflow-auto mb-3">
                    <table className="w-full text-sm border border-border rounded-lg" {...p} />
                  </div>
                ),
                th: (p) => <th className="text-left px-3 py-2 bg-muted/60 border-b border-border" {...p} />,
                td: (p) => <td className="px-3 py-2 border-b border-border text-foreground/90" {...p} />,
              }}
            >
              {doc}
            </ReactMarkdown>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-muted-foreground">
        {isDirty ? "Unsaved changes" : "All changes saved"}
      </div>
    </div>
  );
}

export default ProjectDocs;
