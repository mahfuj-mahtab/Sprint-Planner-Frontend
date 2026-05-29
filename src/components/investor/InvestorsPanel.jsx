import { Link } from "react-router-dom";
import { HandCoins, Loader2, Users } from "lucide-react";
import { useInvestorDashboard } from "@/hooks/useInvestor";
import {
  InvestorAccessBanner,
  InvestorDashboard,
  InvestorQuickActions,
} from "@/components/investor/InvestorDashboard";

export function InvestorsPanel({
  orgId,
  currency = "BDT",
  canSeeExactAmounts = true,
  canWrite = true,
  accessRole = "",
}) {
  const { metrics, summary, loading } = useInvestorDashboard(orgId);

  return (
    <div className="space-y-6 text-left w-full">
      <InvestorAccessBanner
        accessRole={accessRole}
        canSeeExactAmounts={canSeeExactAmounts}
        canWrite={canWrite}
      />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#00d4ff]" />
            Investor capital
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Track equity ownership and funding rounds. Capital increases partition balances without
            counting as business income.
          </p>
        </div>
        <InvestorQuickActions orgId={orgId} canWrite={canWrite} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !metrics?.investors?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-10 text-center">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No investors yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Add investors with ownership %, then record each capital injection to the correct
            account partition.
          </p>
          {canWrite && (
            <Link
              to={`/user/profile/org/${orgId}/investors`}
              className="inline-block mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Set up first investor →
            </Link>
          )}
        </div>
      ) : (
        <InvestorDashboard
          metrics={metrics}
          summary={summary}
          loading={loading}
          currency={currency}
          canSeeExactAmounts={canSeeExactAmounts}
          compact
        />
      )}
    </div>
  );
}
