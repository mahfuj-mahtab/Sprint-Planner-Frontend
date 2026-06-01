import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";
import { buildJourneyInsights } from "@/lib/strategy";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1117",
  border: "1px solid #1e2a3a",
  borderRadius: "8px",
  fontSize: "12px",
};

const Q_COLORS = ["#a78bfa", "#00d4ff", "#00ff94", "#f59e0b"];

function ChartCard({ title, subtitle, icon: Icon, children, className }) {
  return (
    <div className={cn("ww-card-sm border-border/80 p-5 sm:p-6 flex flex-col", className)}>
      <div className="flex items-start gap-3 mb-4">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">{children}</div>
    </div>
  );
}

export function GoalsInsightsPanel({ goals, year, quarter, weeklyReview }) {
  const j = buildJourneyInsights(goals, year, quarter, weeklyReview);
  const { stats, yearPie } = j;

  const trajectory = stats.byQuarter.map((q, i) => ({
    ...q,
    fill: Q_COLORS[i],
    cumulative: stats.byQuarter
      .slice(0, i + 1)
      .reduce((s, x) => s + x.progress, 0) / (i + 1),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Insights & charts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          See how {year} is unfolding — quarter by quarter and goal by goal.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <ChartCard
          title={`Quarterly momentum (${year})`}
          subtitle="Bar = each quarter · line = running average"
          icon={BarChart3}
          className="lg:col-span-8"
        >
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={trajectory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff94" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00ff94" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, name, props) => {
                  if (name === "progress") return [`${v}% · ${props.payload.count} goals`, "Quarter"];
                  return [`${Math.round(v)}%`, "Trend"];
                }}
              />
              <Bar dataKey="progress" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {trajectory.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === `Q${quarter}` ? entry.fill : `${entry.fill}99`}
                    stroke={entry.name === `Q${quarter}` ? entry.fill : "transparent"}
                    strokeWidth={entry.name === `Q${quarter}` ? 2 : 0}
                  />
                ))}
              </Bar>
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#00ff94"
                strokeWidth={2}
                fill="url(#qGrad)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            Highlighted: <span className="text-[#00d4ff] font-medium">Q{quarter}</span> (where you are now)
          </p>
        </ChartCard>

        <ChartCard
          title={`Year ${year} goals`}
          subtitle="Completed vs still in progress"
          icon={PieIcon}
          className="lg:col-span-4"
        >
          {yearPie.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center justify-center h-full">
              Add year goals to see breakdown
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={yearPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {yearPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex flex-wrap justify-center gap-3 mt-2">
                {yearPie.map((s) => (
                  <li key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                    {s.name} ({s.value})
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Long term direction",
            value: `${stats.longPct}%`,
            sub: `${stats.longTotal} goal(s)`,
            border: "border-[#a78bfa]/30",
            bg: "from-[#a78bfa]/12",
          },
          {
            label: "Year completion",
            value: `${stats.yearPct}%`,
            sub: `${stats.yearDone}/${stats.yearTotal} done`,
            border: "border-[#f59e0b]/30",
            bg: "from-[#f59e0b]/12",
          },
          {
            label: `Q${quarter} execution`,
            value: `${j.currentQuarterPct}%`,
            sub: "Current quarter",
            border: "border-[#00d4ff]/30",
            bg: "from-[#00d4ff]/12",
          },
          {
            label: "Weekly rhythm",
            value: `${stats.checklistPct}%`,
            sub: `${stats.checklistDone}/${stats.checklistTotal} items`,
            border: "border-primary/30",
            bg: "from-primary/12",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-xl border bg-gradient-to-br to-transparent p-4",
              card.border,
              card.bg
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{card.label}</p>
            <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
