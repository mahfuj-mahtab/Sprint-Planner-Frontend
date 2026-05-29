import React from 'react';

const statusClass = {
  active: 'border-primary/30 bg-primary/10 text-primary',
  inactive: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300',
  exited: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

const InvestorDashboard = ({ metrics, summary, loading }) => {
  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  if (!metrics || !summary) {
    return <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">No data available</div>;
  }

  const currency = summary.currency || metrics.summary.currency || 'BDT';

  const formatCurrency = (amount, currencyCode = currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="ww-card-sm">
          <h3 className="ww-label mb-3">Total Raised</h3>
          <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalRaised)}</p>
          <span className="mt-1 block text-xs text-muted-foreground">
            Capital {summary.totalsByCurrency?.length > 1 ? `· primary ${currency}` : ''}
          </span>
        </div>

        <div className="ww-card-sm">
          <h3 className="ww-label mb-3">Active Investors</h3>
          <p className="text-2xl font-bold text-foreground">{metrics.summary.active_investors}</p>
          <span className="mt-1 block text-xs text-muted-foreground">Of {metrics.summary.total_investors}</span>
        </div>

        <div className="ww-card-sm">
          <h3 className="ww-label mb-3">Avg Investment</h3>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.avgInvestment)}</p>
          <span className="mt-1 block text-xs text-muted-foreground">Per Investor</span>
        </div>

        <div className="ww-card-sm">
          <h3 className="ww-label mb-3">Ownership</h3>
          <p className="text-2xl font-bold text-foreground">{metrics.summary.total_ownership_allocated}%</p>
          <span className="mt-1 block text-xs text-muted-foreground">Allocated</span>
        </div>
      </div>

      <div className="ww-card">
        <h2 className="ww-heading mb-5 text-xl">Ownership Breakdown</h2>
        {summary.totalsByCurrency?.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {summary.totalsByCurrency.map((item) => (
              <span key={item.currency} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {formatCurrency(item.amount, item.currency)}
              </span>
            ))}
          </div>
        )}
        <div className="space-y-4">
          {metrics.ownershipSummary.map((inv) => (
            <div key={inv.name} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_150px] lg:items-center">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${inv.ownership_percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">{inv.name}</span>
                <span className="font-semibold text-primary">
                  {inv.ownership_percentage}%
                </span>
              </div>
              <div className="text-sm font-semibold text-foreground lg:text-right">
                {formatCurrency(inv.total_invested)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ww-card">
        <h2 className="ww-heading mb-5 text-xl">Top Investors</h2>
        <div className="space-y-3">
          {summary.topInvestors.map((inv, idx) => (
            <div key={inv.name} className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-[56px_minmax(0,1fr)_160px] sm:items-center">
              <div className="font-mono text-lg font-bold text-primary">#{idx + 1}</div>
              <div>
                <h4 className="font-semibold text-foreground">{inv.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{inv.ownership_percentage}% ownership</p>
              </div>
              <div className="font-semibold text-primary sm:text-right">
                {formatCurrency(inv.total_invested)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ww-card">
        <h2 className="ww-heading mb-5 text-xl">All Investors</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Ownership</th>
                <th className="px-4 py-3 font-semibold">Total Invested</th>
                <th className="px-4 py-3 font-semibold">Investments</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.investors.map((inv) => (
                <tr key={inv._id} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-4 font-semibold text-foreground">{inv.name}</td>
                  <td className="px-4 py-4 capitalize text-muted-foreground">{inv.investor_type}</td>
                  <td className="px-4 py-4">
                    <strong>{inv.ownership_percentage}%</strong>
                  </td>
                  <td className="px-4 py-4 font-semibold text-primary">{formatCurrency(inv.total_invested)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{inv.investment_count}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[inv.status] || statusClass.exited}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
