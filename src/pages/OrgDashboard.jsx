import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Layers,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/org/StatCard";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoney } from "@/lib/formatMoney";
import {
  MonthlyTrendChart,
  ProfitLineChart,
  CategoryBarChart,
  TaskStatusPie,
  ProjectProfitChart,
} from "@/components/charts/DashboardCharts";
import { cn } from "@/lib/utils";

function OrgDashboard() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/dashboard`)
      .then((r) => setData(r.data.dashboard))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId]);

  const fmt = (v) => formatMoney(v, "BDT");

  const taskPie = data
    ? [
        { name: "Completed", value: data.tasks.completed, color: "#00ff94" },
        { name: "In progress", value: data.tasks.wip, color: "#fbbf24" },
        { name: "Pending", value: data.tasks.pending, color: "#94a3b8" },
        { name: "Hold", value: data.tasks.hold, color: "#a78bfa" },
        { name: "Cancelled", value: data.tasks.cancelled, color: "#f87171" },
      ]
    : [];

  const projectChart = (data?.projects || []).map((p) => ({
    name: p.project.name,
    revenue: p.revenue,
    cost: p.cost,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="ww-page-full space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="ww-page-full">
          <p className="text-muted-foreground">Could not load dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { finance, counts, tasks, features, projects, organization } = data;

  return (
    <DashboardLayout>
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="ww-page-full py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/user/profile/org/${orgId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Organization
            </button>
            <div>
              <div className="ww-tag border-primary/25 bg-primary/10 text-primary text-[10px] mb-1">Insights</div>
              <h1 className="ww-heading text-xl">{organization.name} Dashboard</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/user/profile/org/${orgId}/finance`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Finance
            </Link>
            <Link to={`/user/profile/org/${orgId}/clients`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <Users className="w-4 h-4" /> Clients
            </Link>
          </div>
        </div>
      </div>

      <div className="ww-page-full space-y-6 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard label="Month income" value={fmt(finance.monthIncome)} variant="income" />
          <StatCard label="Month expense" value={fmt(finance.monthExpense)} variant="expense" />
          <StatCard label="Net profit" value={fmt(finance.netProfit)} variant={finance.netProfit >= 0 ? "income" : "expense"} />
          <StatCard label="Cash balance" value={fmt(finance.totalBalance)} variant="balance" />
          <StatCard label="Tasks done" value={`${tasks.completionPct}%`} sub={`${tasks.completed}/${tasks.total} tasks`} variant="neutral" />
          <StatCard label="Active sprints" value={String(counts.activeSprints)} sub={`${counts.totalSprints} total`} variant="neutral" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="ww-card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              Income vs expense (6 months)
            </h2>
            <MonthlyTrendChart data={finance.monthlyTrend} formatValue={fmt} />
          </section>
          <section className="ww-card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#00d4ff]" />
              Net profit trend
            </h2>
            <ProfitLineChart data={finance.monthlyTrend} formatValue={fmt} />
          </section>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="ww-card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Income by category
            </h2>
            {finance.incomeByCategory.length ? (
              <CategoryBarChart data={finance.incomeByCategory} formatValue={fmt} color="#00ff94" />
            ) : (
              <p className="text-sm text-muted-foreground">No income recorded yet.</p>
            )}
          </section>
          <section className="ww-card p-5">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Expense by category
            </h2>
            {finance.expenseByCategory.length ? (
              <CategoryBarChart data={finance.expenseByCategory} formatValue={fmt} color="#f87171" />
            ) : (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            )}
          </section>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="ww-card p-5 lg:col-span-1">
            <h2 className="text-base font-semibold mb-4">Task status</h2>
            <TaskStatusPie data={taskPie} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border p-2">
                <span className="text-muted-foreground">Total</span>
                <div className="font-mono text-lg font-semibold">{tasks.total}</div>
              </div>
              <div className="rounded-lg border border-border p-2">
                <span className="text-muted-foreground">Completed</span>
                <div className="font-mono text-lg font-semibold text-primary">{tasks.completed}</div>
              </div>
            </div>
          </section>
          <section className="ww-card p-5 lg:col-span-2">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
              <FolderKanban className="w-5 h-5 text-[#a78bfa]" />
              Project revenue vs cost
            </h2>
            {projectChart.length ? (
              <ProjectProfitChart data={projectChart} formatValue={fmt} />
            ) : (
              <p className="text-sm text-muted-foreground">Link transactions to projects to see profit bars.</p>
            )}
          </section>
        </div>

        <section className="ww-card p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Project progress
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Project</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2 pr-4 text-right">Cost</th>
                  <th className="py-2 pr-4 text-right">Profit</th>
                  <th className="py-2 pr-4 text-center">Tasks</th>
                  <th className="py-2 pr-4 text-center">Progress</th>
                  <th className="py-2 text-center">Sprints</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((row) => (
                  <tr key={row.project._id} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="py-3 pr-4 font-medium">{row.project.name}</td>
                    <td className="py-3 pr-4 text-right font-mono text-primary">{fmt(row.revenue)}</td>
                    <td className="py-3 pr-4 text-right font-mono">{fmt(row.cost)}</td>
                    <td className={cn("py-3 pr-4 text-right font-mono font-medium", row.profit >= 0 ? "text-primary" : "text-destructive")}>
                      {fmt(row.profit)}
                    </td>
                    <td className="py-3 pr-4 text-center text-muted-foreground">
                      {row.tasks.completed}/{row.tasks.total}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${row.completionPct}%` }} />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">{row.completionPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-muted-foreground">
                      {row.activeSprints > 0 ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Zap className="w-3.5 h-3.5" /> {row.activeSprints}
                        </span>
                      ) : (
                        row.sprintCount
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="ww-card-sm flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-[#a78bfa]" />
            <div>
              <div className="text-2xl font-semibold font-mono">{counts.projects}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
          </div>
          <div className="ww-card-sm flex items-center gap-3">
            <Users className="w-8 h-8 text-[#00d4ff]" />
            <div>
              <div className="text-2xl font-semibold font-mono">{counts.clients}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
          </div>
          <div className="ww-card-sm flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-semibold font-mono">{features.completed}</div>
              <div className="text-sm text-muted-foreground">Features done</div>
            </div>
          </div>
          <div className="ww-card-sm flex items-center gap-3">
            <Layers className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-semibold font-mono">{features.total}</div>
              <div className="text-sm text-muted-foreground">Total features</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrgDashboard;
