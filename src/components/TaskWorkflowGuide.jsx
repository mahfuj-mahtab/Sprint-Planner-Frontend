import { ArrowRight } from "lucide-react";
import { KANBAN_COLUMNS, STATUS_META } from "@/lib/taskWorkflow";

export function TaskWorkflowGuide({ className = "" }) {
  return (
    <div className={`rounded-xl border border-border/80 bg-card/60 p-4 ${className}`}>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Shipping workflow
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {KANBAN_COLUMNS.map((col, i) => (
          <span key={col} className="inline-flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full border font-medium"
              style={{
                borderColor: `${STATUS_META[col]?.dot}40`,
                color: STATUS_META[col]?.dot,
                backgroundColor: `${STATUS_META[col]?.dot}12`,
              }}
            >
              {STATUS_META[col]?.label}
            </span>
            {i < KANBAN_COLUMNS.length - 1 ? (
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : null}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        <strong className="text-foreground font-normal">Pending</strong> → plan ·{" "}
        <strong className="text-foreground font-normal">In progress</strong> → build ·{" "}
        <strong className="text-foreground font-normal">In review</strong> → QA / PR ·{" "}
        <strong className="text-foreground font-normal">Done</strong> → shipped. Use{" "}
        <strong className="text-foreground font-normal">Blocked</strong> when waiting on someone or something.
      </p>
    </div>
  );
}
