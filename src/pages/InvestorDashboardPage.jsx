import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useInvestorDashboard } from '../hooks/useInvestor';
import InvestorDashboard from '../components/investor/InvestorDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, RefreshCcw, ReceiptText, Users } from 'lucide-react';

const InvestorDashboardPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { metrics, summary, loading, error, refetch } = useInvestorDashboard(orgId);

  if (error) {
    return (
      <DashboardLayout>
        <div className="ww-page-full">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="ww-page-full py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/user/profile/org/${orgId}/finance?tab=investors`)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Finance
            </button>
            <div className="min-w-0">
              <div className="ww-tag border-primary/25 bg-primary/10 text-primary text-[10px] mb-1">Overview</div>
              <h1 className="ww-heading text-xl">Investor Dashboard</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/user/profile/org/${orgId}/investors`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <Users className="w-4 h-4" /> Investors
            </Link>
            <Link to={`/user/profile/org/${orgId}/investors/record`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <ReceiptText className="w-4 h-4" /> Record Investment
            </Link>
            <button type="button" className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2" onClick={refetch}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="ww-page-full space-y-6 pb-10">
        <p className="text-sm text-muted-foreground">Track capital raised, ownership allocation, and investor activity.</p>
        <InvestorDashboard
          metrics={metrics}
          summary={summary}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
};

export default InvestorDashboardPage;
