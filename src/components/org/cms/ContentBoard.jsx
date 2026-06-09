import { useMemo, useState } from "react";
import { Calendar, Eye, GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import {
  CONTENT_PRIORITY_CLASS,
  CONTENT_PRIORITY_LABELS,
  formatCmsDate,
  formatCmsDateTime,
  formatNumber,
  statusBadgeStyle,
} from "@/lib/cms";

function ContentCard({ item, canWrite, onEdit, onDelete, onAnalytics, onDragStart }) {
  const latest = item.latest_analytics;
  return (
    <article
      draggable={canWrite}
      onDragStart={canWrite ? (e) => onDragStart(e, item) : undefined}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm transition group",
        canWrite ? "cursor-grab active:cursor-grabbing hover:border-[#ec4899]/40" : "cursor-default"
      )}
    >
      <div className="flex items-start gap-2">
        {canWrite ? (
          <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
            {canWrite ? (
              <div className="flex gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onAnalytics?.(item)}
                  className="p-1 rounded border border-transparent hover:border-border text-muted-foreground hover:text-[#ec4899]"
                  title="Analytics"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit?.(item)}
                  className="p-1 rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(item)}
                  className="p-1 rounded border border-transparent hover:border-destructive/40 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {item.description ? (
            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                CONTENT_PRIORITY_CLASS[item.priority] || CONTENT_PRIORITY_CLASS.medium
              )}
            >
              {CONTENT_PRIORITY_LABELS[item.priority] || item.priority}
            </span>
            {item.scheduled_at ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#22d3ee] px-1.5 py-0.5 rounded border border-[#22d3ee]/30 bg-[#22d3ee]/10">
                <Calendar className="w-3 h-3" />
                {formatCmsDateTime(item.scheduled_at)}
              </span>
            ) : null}
          </div>

          {latest ? (
            <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span>{formatNumber(latest.views)} views</span>
              <span>{formatNumber(latest.likes)} likes</span>
              <span>{formatNumber(latest.comments)} comments</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ContentBoard({
  orgId,
  platform,
  statuses,
  content,
  canWrite,
  onRefresh,
  onEdit,
  onDelete,
  onAnalytics,
}) {
  const [dragItem, setDragItem] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const sortedStatuses = useMemo(
    () => [...(statuses || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [statuses]
  );

  const contentByStatus = useMemo(() => {
    const map = Object.fromEntries(sortedStatuses.map((s) => [s._id, []]));
    for (const item of content || []) {
      const sid = item.status_id?.toString?.() || item.status_id;
      if (map[sid]) map[sid].push(item);
      else if (sortedStatuses[0]) map[sortedStatuses[0]._id].push(item);
    }
    for (const sid of Object.keys(map)) {
      map[sid].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return map;
  }, [content, sortedStatuses]);

  const moveContent = async (item, statusId) => {
    const current = item.status_id?.toString?.() || item.status_id;
    if (current === statusId) return;
    try {
      await api.patch(`/api/v1/org/${orgId}/cms/content/${item._id}`, { status_id: statusId });
      const label = sortedStatuses.find((s) => s._id === statusId)?.name || "column";
      toast.success(`Moved to ${label}`, { theme: "dark" });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Move failed", { theme: "dark" });
    }
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    setOverColumn(null);
    if (dragItem) moveContent(dragItem, statusId);
    setDragItem(null);
  };

  if (!sortedStatuses.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Add workflow statuses for {platform?.name || "this platform"} to use the board.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[420px]">
      {sortedStatuses.map((status) => {
        const items = contentByStatus[status._id] || [];
        const badge = statusBadgeStyle(status.color);
        return (
          <div
            key={status._id}
            className={cn(
              "flex flex-col w-[min(100%,260px)] shrink-0 rounded-xl border bg-muted/20",
              overColumn === status._id ? "border-[#ec4899]/50 bg-[#ec4899]/5" : "border-border/80"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(status._id);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => handleDrop(e, status._id)}
          >
            <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between gap-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                style={badge}
              >
                {status.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{items.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[120px]">
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
                  {canWrite ? "Drop content here" : "No content"}
                </p>
              ) : (
                items.map((item) => (
                  <ContentCard
                    key={item._id}
                    item={item}
                    canWrite={canWrite}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAnalytics={onAnalytics}
                    onDragStart={(e, c) => {
                      setDragItem(c);
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
