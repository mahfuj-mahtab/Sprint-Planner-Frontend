import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  GitBranch,
  Layers,
  ListTodo,
  Lock,
} from "lucide-react";
import api from "@/ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { StatCard } from "@/components/org/StatCard";
import { Skeleton } from "@/components/ui/Loading";
import { formatDate, formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const TASK_STATUS_CLASS = {
  Done: "bg-primary/15 text-primary border-primary/30",
  "In Progress": "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30",
  Pending: "bg-muted/40 text-muted-foreground border-border",
  Blocked: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ClientPortalProject() {
  const { orgId, projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/portal/org/${orgId}/projects/${projectId}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId, projectId]);

  if (loading) {
    return (
      <DashboardLayout sidebar={<ClientPortalSidebar />}>
        <div className="ww-page-full py-8">
          <Skeleton className="h-10 w-72 mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data?.project) {
    return (
      <DashboardLayout sidebar={<ClientPortalSidebar />}>
        <div className="ww-page-full py-12 text-center text-muted-foreground">Project not found or no access.</div>
      </DashboardLayout>
    );
  }

  const { project, summary, sprintDetails, tasks, features, modules, versions, payments } = data;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "sprints", label: "Sprints" },
    { id: "tasks", label: "Tasks" },
    { id: "features", label: "Features" },
    { id: "versions", label: "Versions" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <DashboardLayout sidebar={<ClientPortalSidebar />}>
      <div className="border-b border-border bg-background/90 sticky top-0 z-20">
        <div className="ww-page-full py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/portal/org/${orgId}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-200 bg-amber-500/10">
              <Lock className="w-3 h-3" /> Read-only
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold ww-heading">{project.name}</h1>
            {project.client_id?.name ? (
              <p className="text-sm text-muted-foreground mt-0.5">Client: {project.client_id.name}</p>
            ) : null}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap",
                  tab === t.id
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ww-page-full py-8 space-y-6 pb-16">
        {tab === "overview" && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Tasks done"
                value={`${summary.completedTasks}/${summary.taskCount}`}
                variant="income"
              />
              <StatCard label="Features" value={summary.featureCount} variant="neutral" />
              <StatCard label="Versions" value={summary.versionCount} variant="neutral" />
              <StatCard
                label="Paid on project"
                value={formatMoney(summary.totalPaid, "BDT")}
                variant="balance"
              />
            </div>
            {project.description ? (
              <div className="ww-card p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                Status: <strong className="text-foreground">{project.status_label}</strong>
              </span>
              {project.start_date ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {formatDate(project.start_date)}
                </span>
              ) : null}
              {project.end_date ? (
                <span>→ {formatDate(project.end_date)}</span>
              ) : null}
            </div>
          </>
        )}

        {tab === "sprints" && (
          <div className="space-y-3">
            {sprintDetails?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sprints yet.</p>
            ) : (
              sprintDetails.map(({ sprint, total_tasks, completed_tasks }) => (
                <div key={sprint._id} className="ww-card p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{sprint.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sprint.startDate ? formatDate(sprint.startDate) : "—"} →{" "}
                        {sprint.endDate ? formatDate(sprint.endDate) : "—"}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-mono text-[#00d4ff]">
                        {completed_tasks}/{total_tasks}
                      </p>
                      <p className="text-[10px] text-muted-foreground">tasks done</p>
                    </div>
                  </div>
                  {sprint.isActive ? (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded border border-primary/30 text-primary">
                      Active sprint
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-2">
            {tasks?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              tasks.map((t) => (
                <div key={t._id} className="ww-card p-3 flex flex-wrap items-center gap-2 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.sprint_id?.name ? (
                      <p className="text-[11px] text-muted-foreground">{t.sprint_id.name}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded border uppercase",
                      TASK_STATUS_CLASS[t.status] || TASK_STATUS_CLASS.Pending
                    )}
                  >
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "features" && (
          <div className="space-y-4">
            {modules
              ?.filter((mod) => !mod.parent_module_id)
              .map((mod) => {
                const subModules = modules.filter(
                  (m) => m.parent_module_id?.toString() === mod._id.toString()
                );
                const directFeatures = features?.filter(
                  (f) => f.module_id?.toString() === mod._id.toString()
                );

                return (
                  <div key={mod._id} className="ww-card p-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#a78bfa]" />
                      {mod.name}
                    </h3>
                    {subModules.map((sub) => (
                      <div key={sub._id} className="mt-4 pl-3 border-l-2 border-[#00d4ff]/30">
                        <p className="text-xs font-mono uppercase text-[#00d4ff]/80 mb-2">{sub.name}</p>
                        <ul className="space-y-2">
                          {features
                            ?.filter((f) => f.module_id?.toString() === sub._id.toString())
                            .map((f) => (
                              <li key={f._id} className="flex items-center gap-2 text-sm">
                                <CheckCircle2
                                  className={cn(
                                    "w-4 h-4 shrink-0",
                                    f.status === "completed" ? "text-primary" : "text-muted-foreground/40"
                                  )}
                                />
                                <span className={f.status === "completed" ? "line-through text-muted-foreground" : ""}>
                                  {f.name}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                    {directFeatures?.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {directFeatures.map((f) => (
                          <li key={f._id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-muted-foreground/40" />
                            {f.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}

        {tab === "versions" && (
          <div className="space-y-3">
            {versions?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions yet.</p>
            ) : (
              versions.map((v) => (
                <div key={v._id} className="ww-card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#a78bfa]" />
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.start_date ? formatDate(v.start_date) : "—"} →{" "}
                        {v.end_date ? formatDate(v.end_date) : "—"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-border capitalize">
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-2">
            {payments?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments on this project yet.</p>
            ) : (
              payments.map((pay) => (
                <div key={pay._id} className="ww-card p-4 flex justify-between items-center gap-3">
                  <div>
                    <p className="font-mono font-semibold text-[#00ff94]">{formatMoney(pay.amount, "BDT")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(pay.payment_date)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{pay.payment_method || "—"}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
