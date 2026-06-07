import { useMemo, useState } from "react";
import { GripVertical, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import {
  LEARNING_BOARD_COLUMNS,
  LEARNING_TOPIC_STATUS_LABELS,
  LEARNING_TOPIC_STATUS_CLASS,
  normalizeLearningTopicStatus,
  formatLearningDate,
} from "@/lib/learningWorkflow";
import { cn } from "@/lib/utils";

function ProgressBar({ value, className }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={cn("w-full h-1.5 rounded-full bg-muted/80 overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          pct >= 100 ? "bg-primary" : pct > 0 ? "bg-[#a78bfa]" : "bg-transparent"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TopicKanbanCard({ topic, canWrite, onEdit, onDelete, onAssign, onOpen, onDragStart }) {
  const start = formatLearningDate(topic.start_date);
  const end = formatLearningDate(topic.due_date);
  const progress = topic.progress?.avg_progress ?? 0;

  return (
    <article
      draggable={canWrite}
      onDragStart={canWrite ? (e) => onDragStart(e, topic) : undefined}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm transition group",
        canWrite ? "cursor-grab active:cursor-grabbing hover:border-[#a78bfa]/40" : "cursor-default"
      )}
    >
      <div className="flex items-start gap-2">
        {canWrite ? (
          <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-snug">{topic.title}</h4>
            {canWrite ? (
              <div className="flex gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit?.(topic)}
                  className="p-1 rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  title="Edit topic"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(topic)}
                  className="p-1 rounded border border-transparent hover:border-destructive/40 text-muted-foreground hover:text-destructive"
                  title="Delete topic"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {topic.description ? (
            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{topic.description}</p>
          ) : null}

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {topic.progress?.total ?? 0} assigned
              </span>
              <span className="font-mono text-[#a78bfa]">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          {(start || end) && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {start && end ? `${start} → ${end}` : start ? `Start: ${start}` : `Due: ${end}`}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => onOpen?.(topic)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#c4b5fd] hover:bg-[#a78bfa]/20"
            >
              Open topic
            </button>
            {canWrite ? (
              <button
                type="button"
                onClick={() => onAssign?.(topic)}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              >
                <UserPlus className="w-3 h-3" />
                Assign
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function LearningTopicBoard({
  orgId,
  topics,
  canWrite,
  onRefresh,
  onEdit,
  onDelete,
  onAssign,
  onOpen,
}) {
  const [dragTopic, setDragTopic] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const topicsByColumn = useMemo(() => {
    const map = Object.fromEntries(LEARNING_BOARD_COLUMNS.map((c) => [c, []]));
    for (const t of topics || []) {
      const col = normalizeLearningTopicStatus(t.status);
      if (map[col]) map[col].push(t);
    }
    return map;
  }, [topics]);

  const moveTopic = async (topic, column) => {
    const current = normalizeLearningTopicStatus(topic.status);
    if (current === column) return;
    try {
      await api.patch(`/api/v1/org/${orgId}/learning/topics/${topic._id}`, { status: column });
      toast.success(`Moved to ${LEARNING_TOPIC_STATUS_LABELS[column]}`, { theme: "dark" });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Move failed", { theme: "dark" });
    }
  };

  const handleDrop = (e, column) => {
    e.preventDefault();
    setOverColumn(null);
    if (dragTopic) moveTopic(dragTopic, column);
    setDragTopic(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[420px]">
      {LEARNING_BOARD_COLUMNS.map((column) => {
        const items = topicsByColumn[column] || [];
        return (
          <div
            key={column}
            className={cn(
              "flex flex-col w-[min(100%,260px)] shrink-0 rounded-xl border bg-muted/20",
              overColumn === column ? "border-[#a78bfa]/50 bg-[#a78bfa]/5" : "border-border/80"
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
                  LEARNING_TOPIC_STATUS_CLASS[column]
                )}
              >
                {LEARNING_TOPIC_STATUS_LABELS[column]}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">{items.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[120px]">
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
                  {canWrite ? "Drop topics here" : "No topics"}
                </p>
              ) : (
                items.map((t) => (
                  <TopicKanbanCard
                    key={t._id}
                    topic={t}
                    canWrite={canWrite}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAssign={onAssign}
                    onOpen={onOpen}
                    onDragStart={(e, topic) => {
                      setDragTopic(topic);
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
