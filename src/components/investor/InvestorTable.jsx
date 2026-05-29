import { Eye, Pencil, Trash2 } from "lucide-react";
import { formatMoneySensitive } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const statusClass = {
  active: "border-primary/30 bg-primary/10 text-primary",
  inactive: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",
  exited: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

export function InvestorTable({
  investors = [],
  loading = false,
  currency = "BDT",
  canSeeExactAmounts = true,
  canWrite = true,
  onEdit = () => {},
  onDelete = () => {},
  onViewDetails = () => {},
}) {
  const fmt = (amount) => formatMoneySensitive(amount, currency, canSeeExactAmounts);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Loading investors...
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <p className="text-sm text-muted-foreground">No investors yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Ownership</th>
            <th className="px-4 py-3 font-semibold">Total invested</th>
            <th className="px-4 py-3 font-semibold">Rounds</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            {canWrite ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {investors.map((investor) => (
            <tr key={investor._id} className="transition-colors hover:bg-muted/25">
              <td className="px-4 py-4 font-semibold text-foreground">{investor.name}</td>
              <td className="px-4 py-4">
                <span className="inline-flex rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {investor.investor_type}
                </span>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{investor.email || "—"}</td>
              <td className="px-4 py-4 font-mono tabular-nums">{investor.ownership_percentage}%</td>
              <td className="px-4 py-4 font-semibold text-primary font-mono tabular-nums">
                {fmt(investor.total_invested)}
              </td>
              <td className="px-4 py-4 text-muted-foreground">{investor.investment_count}</td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold capitalize",
                    statusClass[investor.status] || statusClass.exited
                  )}
                >
                  {investor.status}
                </span>
              </td>
              {canWrite ? (
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                      onClick={() => onViewDetails(investor._id)}
                      title="View details"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                      onClick={() => onEdit(investor._id)}
                      title="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                      onClick={() => {
                        if (window.confirm("Remove this investor?")) onDelete(investor._id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvestorTable;
