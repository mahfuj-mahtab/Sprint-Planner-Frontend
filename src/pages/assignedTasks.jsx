import React, { useEffect, useMemo, useState } from "react";
import api from "../ApiInception";
import LeftSidebar from "../components/LeftSidebar";
import Profileheader from "../components/profileheader";
import { Link } from "react-router";
import { ExternalLink, Filter, RefreshCw } from "lucide-react";
import { Skeleton, Spinner } from "../components/ui/Loading";

const statusPill = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "completed") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (s.includes("progress")) return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
  if (s === "hold" || s === "cancelled") return "bg-muted/60 text-muted-foreground border-border";
  return "bg-muted/60 text-muted-foreground border-border";
};

const priorityPill = (priority) => {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-red-500/15 text-red-300 border-red-500/20";
  if (p === "medium") return "bg-amber-500/15 text-amber-300 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-300/90 border-emerald-500/20";
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—");

function AssignedTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTasks = () => {
    setLoading(true);
    api
      .get("/api/v1/users/tasks/assigned")
      .then((r) => {
        if (r.data?.success) setTasks(r.data.tasks || []);
        else setTasks([]);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (tasks || []).filter((t) => {
      const matchesText =
        !text ||
        t.title?.toLowerCase().includes(text) ||
        t.organization_id?.name?.toLowerCase().includes(text) ||
        t.project_id?.name?.toLowerCase().includes(text) ||
        t.sprint_id?.name?.toLowerCase().includes(text) ||
        t.team_id?.name?.toLowerCase().includes(text);

      const matchesStatus = statusFilter === "all" ? true : (t.status || "") === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [tasks, q, statusFilter]);

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-sidebar border-r border-border h-full">
        <LeftSidebar />
      </div>

      <div className="flex-1 bg-background overflow-y-auto">
        <Profileheader />

        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-semibold ww-heading">My Task</h1>
              <p className="text-sm text-muted-foreground mt-1">All sprint/project tasks assigned to you.</p>
            </div>
            <button
              onClick={fetchTasks}
              className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by task, org, project, sprint, team…"
                className="ww-input flex-1"
              />
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                  <Filter className="w-4 h-4" />
                  Status
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ww-input w-48">
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Work In Progress">Work In Progress</option>
                  <option value="Hold">Hold</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-64 mb-2" />
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 lg:grid-cols-5 gap-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </div>
              ))}
              <Spinner className="pt-2" label="Loading assigned tasks…" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-6 bg-card">
              <div className="text-sm text-muted-foreground">No assigned tasks found.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const orgName = t.organization_id?.name || "Org";
                const projectName = t.project_id?.name || "Project";
                const sprintName = t.sprint_id?.name || "Sprint";
                const teamName = t.team_id?.name || "Team";
                const orgId = t.organization_id?._id;
                const projectId = t.project_id?._id || t.sprint_id?.project_id;
                const sprintId = t.sprint_id?._id;
                const linkOk = orgId && projectId && sprintId;
                return (
                  <div key={t._id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-base truncate">{t.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-mono text-foreground">{orgName}</span> /{" "}
                          <span className="font-mono text-foreground">{projectName}</span> /{" "}
                          <span className="font-mono text-foreground">{sprintName}</span> · {teamName}
                        </div>
                      </div>

                      {linkOk ? (
                        <Link
                          to={`/user/profile/org/${orgId}/project/${projectId}/sprint/${sprintId}`}
                          className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2 shrink-0"
                          title="Open sprint"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="border border-border text-muted-foreground text-sm font-medium py-1.5 px-3 rounded-md opacity-60 cursor-not-allowed shrink-0"
                          title="Missing org/project/sprint link"
                        >
                          Open
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPill(t.status)}`}>{t.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${priorityPill(t.priority)}`}>{t.priority}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md border border-border bg-muted/10 text-muted-foreground">
                        {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                      </span>
                      {t.feature_id?.name ? (
                        <span className="text-xs px-2 py-0.5 rounded-md border border-border bg-muted/10 text-muted-foreground">
                          Feature: <span className="text-foreground">{t.feature_id.name}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignedTasks;
