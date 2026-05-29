import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const statusClass = {
  active: 'border-primary/30 bg-primary/10 text-primary',
  inactive: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300',
  exited: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

const InvestorTable = ({
  investors = [],
  loading = false,
  onEdit = () => {},
  onDelete = () => {},
  onViewDetails = () => {},
}) => {
  if (loading) {
    return <div className="rounded-xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">Loading investors...</div>;
  }

  if (investors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <p className="text-sm text-muted-foreground">No investors yet. Create one to get started.</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Ownership</th>
            <th className="px-4 py-3 font-semibold">Total Invested</th>
            <th className="px-4 py-3 font-semibold">Investments</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
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
              <td className="px-4 py-4 text-muted-foreground">{investor.email || '-'}</td>
              <td className="px-4 py-4">
                <strong className="text-foreground">{investor.ownership_percentage}%</strong>
              </td>
              <td className="px-4 py-4 font-semibold text-primary">
                {formatCurrency(investor.total_invested)}
              </td>
              <td className="px-4 py-4 text-muted-foreground">{investor.investment_count}</td>
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[investor.status] || statusClass.exited}`}>
                  {investor.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  onClick={() => onViewDetails(investor._id)}
                  title="View Details"
                >
                  <Eye className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  onClick={() => onEdit(investor._id)}
                  title="Edit"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure?')) {
                      onDelete(investor._id);
                    }
                  }}
                  title="Delete"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestorTable;
