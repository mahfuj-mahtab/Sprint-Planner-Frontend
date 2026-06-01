import { useState } from "react";
import { Calendar, History, ListChecks, MessageSquare } from "lucide-react";
import { Field } from "@/components/org/Field";
import { REVIEW_TYPE_LABELS } from "@/lib/strategy";
import { cn } from "@/lib/utils";

const RHYTHM_SECTIONS = [
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "reflect", label: "Reflection", icon: MessageSquare },
  { id: "history", label: "History", icon: History },
];

export function RhythmPanel({ weeklyReview, recentReviews, canWrite, onSave, saving }) {
  const [section, setSection] = useState("checklist");
  const checklist = weeklyReview?.checklist || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updatedChecklist = checklist.map((item, i) => ({
      ...item,
      done: fd.get(`check_${i}`) === "on",
    }));
    onSave({
      review_type: "weekly",
      year: weeklyReview.year,
      period: weeklyReview.period,
      period_label: weeklyReview.period_label,
      achievements: fd.get("achievements"),
      failed: fd.get("failed"),
      why_failed: fd.get("why_failed"),
      stop_doing: fd.get("stop_doing"),
      continue_doing: fd.get("continue_doing"),
      start_doing: fd.get("start_doing"),
      notes: fd.get("notes"),
      checklist: updatedChecklist,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Leadership rhythm
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Weekly CEO review · Stop · Continue · Start — used by high-growth teams worldwide
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {RHYTHM_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition",
              section === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className={cn("lg:col-span-2 space-y-4", section === "history" && "hidden lg:block")}>
          {section !== "history" ? (
            <div className="ww-card-sm border-border/80 p-6">
              <p className="text-xs text-[#00d4ff] font-mono mb-4">{weeklyReview?.period_label}</p>

              {(section === "checklist" || section === "reflect") && (
                <div className={cn(section !== "checklist" && "hidden")}>
                  <h3 className="text-sm font-semibold mb-3">Monday checklist</h3>
                  <div className="grid sm:grid-cols-2 gap-2 mb-6">
                    {checklist.map((item, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-2.5 text-sm rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/30"
                      >
                        <input
                          type="checkbox"
                          name={`check_${i}`}
                          defaultChecked={item.done}
                          disabled={!canWrite}
                          className="mt-0.5"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(section === "reflect" || section === "checklist") && (
                <div className={cn("space-y-4", section === "checklist" && "hidden")}>
                  <Field label="What did we achieve this week?">
                    <textarea
                      name="achievements"
                      className="ww-input w-full min-h-[80px]"
                      defaultValue={weeklyReview?.achievements || ""}
                      disabled={!canWrite}
                    />
                  </Field>
                  <Field label="What failed?">
                    <textarea
                      name="failed"
                      className="ww-input w-full min-h-[64px]"
                      defaultValue={weeklyReview?.failed || ""}
                      disabled={!canWrite}
                    />
                  </Field>
                  <Field label="Root cause">
                    <textarea
                      name="why_failed"
                      className="ww-input w-full min-h-[64px]"
                      defaultValue={weeklyReview?.why_failed || ""}
                      disabled={!canWrite}
                    />
                  </Field>
                </div>
              )}

              {section === "reflect" ? (
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <Field label="Stop">
                    <textarea
                      name="stop_doing"
                      className="ww-input w-full min-h-[88px]"
                      defaultValue={weeklyReview?.stop_doing || ""}
                      disabled={!canWrite}
                      placeholder="What to stop"
                    />
                  </Field>
                  <Field label="Continue">
                    <textarea
                      name="continue_doing"
                      className="ww-input w-full min-h-[88px]"
                      defaultValue={weeklyReview?.continue_doing || ""}
                      disabled={!canWrite}
                    />
                  </Field>
                  <Field label="Start">
                    <textarea
                      name="start_doing"
                      className="ww-input w-full min-h-[88px]"
                      defaultValue={weeklyReview?.start_doing || ""}
                      disabled={!canWrite}
                    />
                  </Field>
                </div>
              ) : null}

              {section !== "history" && canWrite ? (
                <button type="submit" disabled={saving} className="ww-btn ww-btn-primary mt-6">
                  Save {section === "checklist" ? "checklist" : "review"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={cn("ww-card-sm border-border/80 p-5", section !== "history" && "lg:block", section === "history" && "lg:col-span-3")}>
          <h3 className="text-sm font-semibold mb-3">Past reviews</h3>
          {recentReviews?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Saved reviews appear here.</p>
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto">
              {recentReviews.map((r) => (
                <li key={r._id} className="rounded-lg border border-border px-3 py-3 text-sm">
                  <div className="font-medium text-xs text-primary">
                    {REVIEW_TYPE_LABELS[r.review_type]} · {r.period_label || r.year}
                  </div>
                  {r.achievements ? (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{r.achievements}</p>
                  ) : null}
                  {(r.stop_doing || r.start_doing) && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {r.stop_doing ? `Stop: ${r.stop_doing.slice(0, 40)}…` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </div>
  );
}
