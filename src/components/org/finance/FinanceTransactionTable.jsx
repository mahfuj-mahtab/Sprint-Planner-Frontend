import { Pencil, Trash2 } from "lucide-react";
import { categoryLabel } from "@/lib/financeCategories";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS = {
  bkash: "bKash",
  bank: "Bank",
  cash: "Cash",
  stripe: "Stripe",
  paypal: "PayPal",
  other: "Other",
};

function cellText(value, fallback = "—") {
  if (value == null || value === "") return fallback;
  return value;
}

export function FinanceTransactionTable({
  type,
  items = [],
  categories = [],
  currency,
  canSeeExactAmounts = true,
  canWrite = true,
  investors = [],
  onEdit,
  onDelete,
  deleting = false,
}) {
  const isIncome = type === "income";
  const fmt = (v) => formatMoneySensitive(v, currency, canSeeExactAmounts);
  const showInvestor = !isIncome && investors.length > 0;

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No matching transactions. Adjust filters or add a new entry.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Income source</th>
            <th className="px-4 py-3 font-semibold">Project</th>
            {isIncome ? <th className="px-4 py-3 font-semibold">Client</th> : null}
            <th className="px-4 py-3 font-semibold">Account</th>
            {!isIncome ? <th className="px-4 py-3 font-semibold">Partition</th> : null}
            {isIncome ? <th className="px-4 py-3 font-semibold">Payment</th> : null}
            {showInvestor ? <th className="px-4 py-3 font-semibold">Investor</th> : null}
            {!isIncome ? <th className="px-4 py-3 font-semibold">Personal</th> : null}
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold max-w-[140px]">Notes</th>
            {canWrite ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item._id} className="transition-colors hover:bg-muted/25">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(isIncome ? item.payment_date : item.expense_date)}
              </td>
              <td className="px-4 py-3">{categoryLabel(item.category, categories)}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                {cellText(item.income_source_id?.name)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 max-w-[140px] truncate",
                  item.project_id?.name ? "text-foreground" : isIncome ? "text-amber-500/90" : "text-muted-foreground"
                )}
              >
                {item.project_id?.name || (isIncome ? "No project" : "—")}
              </td>
              {isIncome ? (
                <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                  {cellText(item.client_id?.name)}
                </td>
              ) : null}
              <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                {cellText(item.account_id?.name)}
              </td>
              {!isIncome ? (
                <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                  {cellText(item.partition_id?.name || item.partition_name)}
                </td>
              ) : null}
              {isIncome ? (
                <td className="px-4 py-3 text-muted-foreground">
                  {PAYMENT_LABELS[item.payment_method] || item.payment_method || "—"}
                </td>
              ) : null}
              {showInvestor ? (
                <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                  {cellText(item.investor_id?.name)}
                </td>
              ) : null}
              {!isIncome ? (
                <td className="px-4 py-3">
                  {item.is_personal ? (
                    <span className="inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-300">
                      Yes
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              ) : null}
              <td
                className={cn(
                  "px-4 py-3 text-right font-mono tabular-nums font-semibold",
                  isIncome ? "text-primary" : "text-destructive"
                )}
              >
                {isIncome ? "+" : "−"}
                {fmt(item.amount)}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">
                {cellText(item.notes, "")}
              </td>
              {canWrite ? (
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={deleting}
                      className="p-2 rounded-md hover:bg-muted text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
