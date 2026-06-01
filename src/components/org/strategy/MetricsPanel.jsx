import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/org/EmptyState";
import { ProgressRing } from "./ProgressRing";
import {
  KPI_CATEGORY_LABELS,
  KPI_CATEGORY_COLORS,
  kpiProgressPercent,
} from "@/lib/strategy";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

function MiniSparkline({ history, color }) {
  if (!history?.length) {
    return <div className="h-12 flex items-center text-[10px] text-muted-foreground">No history yet</div>;
  }
  const data = history.map((h, i) => ({ i, v: h.value }));
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, "Value"]} labelFormatter={() => ""} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MetricsPanel({ kpis, canWrite, onAdd, onEdit, onDelete, onRecord }) {
  const [category, setCategory] = useState("all");
  const [logId, setLogId] = useState(null);
  const [logValue, setLogValue] = useState("");

  const filtered = useMemo(() => {
    if (category === "all") return kpis;
    return kpis.filter((k) => k.category === category);
  }, [kpis, category]);

  const categories = useMemo(() => {
    const set = new Set(kpis.map((k) => k.category));
    return ["all", ...Array.from(set)];
  }, [kpis]);

  if (kpis.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No metrics yet"
        description="Track 5–10 KPIs that predict success: revenue, users, churn, activation."
        action={
          canWrite ? (
            <button type="button" onClick={onAdd} className="ww-btn ww-btn-primary text-sm">
              Add first metric
            </button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Metrics dashboard</h2>
          <p className="text-sm text-muted-foreground">Log values weekly — trends show if you’re improving</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> Add metric
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition",
              category === c
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {c === "all" ? "All" : KPI_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((kpi) => {
          const pct = kpiProgressPercent(kpi);
          const color = KPI_CATEGORY_COLORS[kpi.category] || "#00d4ff";
          const isLogging = logId === kpi._id;

          return (
            <div
              key={kpi._id}
              className="rounded-2xl border border-border/80 bg-card p-5 hover:border-[#00d4ff]/25 transition flex flex-col"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color }}>
                    {KPI_CATEGORY_LABELS[kpi.category]}
                  </span>
                  <h4 className="font-semibold mt-0.5">{kpi.name}</h4>
                </div>
                {pct != null ? <ProgressRing value={pct} size={48} stroke={4} accent="cyan" /> : null}
              </div>

              <p className="font-mono text-3xl font-bold tabular-nums tracking-tight">
                {kpi.latest_value ?? kpi.current_value}
                <span className="text-base font-normal text-muted-foreground ml-1">{kpi.unit}</span>
              </p>
              {kpi.target_value != null ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Target {kpi.target_value} {kpi.unit} · {kpi.frequency}
                </p>
              ) : null}

              <div className="mt-3 mb-3">
                <MiniSparkline history={kpi.history} color={color} />
              </div>

              {canWrite ? (
                <div className="mt-auto pt-3 border-t border-border/60 flex gap-2">
                  {isLogging ? (
                    <>
                      <input
                        type="number"
                        step="any"
                        className="ww-input ww-input-sm flex-1"
                        value={logValue}
                        onChange={(e) => setLogValue(e.target.value)}
                        placeholder="New value"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="ww-btn ww-btn-primary text-xs px-3"
                        onClick={() => {
                          if (logValue) onRecord(kpi._id, logValue);
                          setLogId(null);
                          setLogValue("");
                        }}
                      >
                        Save
                      </button>
                      <button type="button" className="text-xs text-muted-foreground" onClick={() => setLogId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setLogId(kpi._id);
                          setLogValue(String(kpi.latest_value ?? ""));
                        }}
                        className="flex-1 text-xs py-2 rounded-lg bg-primary/15 text-primary font-medium"
                      >
                        Log value
                      </button>
                      <button type="button" onClick={() => onEdit(kpi)} className="p-2 rounded-lg border border-border">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(kpi._id)}
                        className="p-2 rounded-lg border border-border text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
