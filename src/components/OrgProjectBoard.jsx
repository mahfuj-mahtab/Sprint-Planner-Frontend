import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BarChart3, ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import {
  PROJECT_BOARD_COLUMNS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CLASS,
  PROJECT_TYPE_LABELS,
  PROJECT_PRIORITY_BADGE,
  PROJECT_PRIORITY_LABELS,
  PROJECT_PRIORITY_CARD_RING,
  normalizeProjectStatus,
  sortProjectsByPriority,
  formatProjectDate,
} from "@/lib/projectWorkflow";
import { cn } from "@/lib/utils";

function ProjectKanbanCard({
  project,
  orgId,
  canWrite,
  onEdit,
  onDelete,
  onOpenDetails,
  onDragStart,
}) {
  const priority = project.priority || "medium";
  const start = formatProjectDate(project.start_date);
  const end = formatProjectDate(project.end_date);

  return (
    <article
      draggable={canWrite}
      onDragStart={canWrite ? (e) => onDragStart(e, project) : undefined}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition group",
        canWrite ? "cursor-grab active:cursor-grabbing hover:border-primary/30" : "cursor-default",
        PROJECT_PRIORITY_CARD_RING[priority] || PROJECT_PRIORITY_CARD_RING.medium
      )}
    >
      <div className="flex items-start gap-2">
        {canWrite ? (
          <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-snug">{project.name}</h4>
            {canWrite ? (
              <div className="flex gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit?.(project)}
                  className="p-1 rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  title="Edit project"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(project._id)}
                  className="p-1 rounded border border-transparent hover:border-destructive/40 text-muted-foreground hover:text-destructive"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className={cn(
                "text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium",
                PROJECT_PRIORITY_BADGE[priority]
              )}
            >
              {PROJECT_PRIORITY_LABELS[priority]}
            </span>
            <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
              {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
            </span>
            {project.currentVersion ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-primary/30 text-primary font-mono">
                {project.currentVersion.name}
              </span>
            ) : null}
          </div>

          {project.description ? (
            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
          ) : null}

          {(start || end) ? (
            <p className="text-[10px] text-muted-foreground mt-2">
              {start && end ? `${start} → ${end}` : start ? `Start: ${start}` : `End: ${end}`}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/50">
            {canWrite ? (
            <Link
              to={`/user/profile/org/${orgId}/project/${project._id}/dashboard`}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd] hover:bg-[#a78bfa]/20 no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              <BarChart3 className="w-3 h-3" />
              Dashboard
            </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenDetails?.(project._id)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ExternalLink className="w-3 h-3" />
              Open project
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OrgProjectBoard({
  orgId,
  projects,
  canWrite,
  onRefresh,
  onEdit,
  onDelete,
  onOpenDetails,
}) {
  const [dragProject, setDragProject] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const projectsByColumn = useMemo(() => {
    const map = Object.fromEntries(PROJECT_BOARD_COLUMNS.map((c) => [c, []]));
    for (const p of projects || []) {
      const col = normalizeProjectStatus(p.status);
      if (map[col]) map[col].push(p);
      else if (col === "cancelled") {
        /* cancelled shown via filter, not board */
      }
    }
    for (const col of PROJECT_BOARD_COLUMNS) {
      map[col] = sortProjectsByPriority(map[col]);
    }
    return map;
  }, [projects]);

  const moveProject = async (project, column) => {
    const current = normalizeProjectStatus(project.status);
    if (current === column) return;
    try {
      await api.patch(`/api/v1/org/${orgId}/projects/${project._id}`, { status: column });
      toast.success(`Moved to ${PROJECT_STATUS_LABELS[column]}`, { theme: "dark" });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Move failed", { theme: "dark" });
    }
  };

  const handleDrop = (e, column) => {
    e.preventDefault();
    setOverColumn(null);
    if (dragProject) moveProject(dragProject, column);
    setDragProject(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[420px]">
      {PROJECT_BOARD_COLUMNS.map((column) => {
        const items = projectsByColumn[column] || [];
        return (
          <div
            key={column}
            className={cn(
              "flex flex-col w-[min(100%,280px)] shrink-0 rounded-xl border bg-muted/20",
              overColumn === column ? "border-primary/50 bg-primary/5" : "border-border/80"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(column);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-md border",
                  PROJECT_STATUS_CLASS[column]
                )}
              >
                {PROJECT_STATUS_LABELS[column]}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{items.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[120px]">
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
                  {canWrite ? "Drop projects here" : "No projects"}
                </p>
              ) : (
                items.map((p) => (
                  <ProjectKanbanCard
                    key={p._id}
                    project={p}
                    orgId={orgId}
                    canWrite={canWrite}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onOpenDetails={onOpenDetails}
                    onDragStart={(e, proj) => {
                      setDragProject(proj);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
