import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInvestors, useInvestmentTransactions } from "@/hooks/useInvestor";
import { useInvestorPageAccess } from "@/hooks/useInvestorPageAccess";
import InvestmentForm from "@/components/investor/InvestmentForm";
import { InvestorAccessBanner } from "@/components/investor/InvestorDashboard";
import { formatMoneySensitive } from "@/lib/formatMoney";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/ApiInception";
import { ArrowLeft, BarChart3, CheckCircle2, Loader2, Pencil, Trash2, Users, X } from "lucide-react";

const InvestmentRecordPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { canSeeExactAmounts, canWrite, accessRole, loading: accessLoading } =
    useInvestorPageAccess(orgId);
  const { investors, loading: investorsLoading, refetch: refetchInvestors } = useInvestors(orgId);
  const {
    transactions,
    recordInvestment,
    updateInvestment,
    deleteTransaction,
    refetch: refetchTransactions,
    loading: investmentLoading,
  } = useInvestmentTransactions(orgId);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const currency = accounts[0]?.currency || "BDT";
  const fmt = (amount, cur = currency) => formatMoneySensitive(amount, cur, canSeeExactAmounts);

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const response = await api.get(`/api/v1/org/${orgId}/finance/accounts`);
      setAccounts(response.data.accounts || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editingTransaction) {
        await updateInvestment(editingTransaction._id, data);
        setSubmittedMessage("Investment updated successfully.");
      } else {
        await recordInvestment(data);
        setSubmittedMessage("Investment recorded successfully.");
      }
      await Promise.all([fetchAccounts(), refetchInvestors(), refetchTransactions()]);
      setEditingTransaction(null);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Error recording investment:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (
      !window.confirm(
        "Delete this investment record? This reverses the investor total and partition balance."
      )
    ) {
      return;
    }
    setFormLoading(true);
    try {
      await deleteTransaction(transactionId);
      await Promise.all([fetchAccounts(), refetchInvestors(), refetchTransactions()]);
    } catch (err) {
      console.error("Error deleting investment:", err);
    } finally {
      setFormLoading(false);
    }
  };

  if (accessLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
              <div className="ww-tag border-primary/25 bg-primary/10 text-primary text-[10px] mb-1">
                Funding
              </div>
              <h1 className="ww-heading text-xl">Record investment</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/user/profile/org/${orgId}/investors`}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Investors
            </Link>
            <Link
              to={`/user/profile/org/${orgId}/investors/dashboard`}
              className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="ww-page-full space-y-6 pb-10">
        <InvestorAccessBanner
          accessRole={accessRole}
          canSeeExactAmounts={canSeeExactAmounts}
          canWrite={canWrite}
        />

        <p className="text-sm text-muted-foreground">
          Capital funding increases partition balance without inflating income.
        </p>

        {submitted && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            <CheckCircle2 className="size-4" />
            {submittedMessage}
          </div>
        )}

        {canWrite ? (
          <div className="ww-card">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="ww-heading text-xl">
                {editingTransaction ? "Edit investment" : "New investment"}
              </h2>
              {editingTransaction && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingTransaction(null)}
                  disabled={formLoading}
                >
                  <X className="size-4" />
                  Cancel edit
                </button>
              )}
            </div>
            <p className="mb-5 mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Record capital from an investor into a business partition. This is separate from
              revenue.
            </p>

            {investorsLoading || accountsLoading ? (
              <div className="rounded-xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Loading data...
              </div>
            ) : (
              <InvestmentForm
                onSubmit={handleSubmit}
                loading={formLoading || investmentLoading}
                investors={investors}
                accounts={accounts}
                initialData={editingTransaction}
                onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
              />
            )}
          </div>
        ) : (
          <div className="ww-card-sm p-4 text-sm text-muted-foreground">
            You have read-only access. Ask an owner or admin to record investments.
          </div>
        )}

        <div className="ww-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="ww-heading text-xl">Investment records</h2>
            <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {transactions.length} total
            </span>
          </div>

          {investmentLoading ? (
            <div className="rounded-xl border border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              No investment records yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Investor</th>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    {canWrite ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="transition-colors hover:bg-muted/25">
                      <td className="px-4 py-4 font-semibold">
                        {transaction.investor_id?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {transaction.account_id?.name || "—"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-primary font-mono tabular-nums">
                        {fmt(transaction.amount, transaction.currency || currency)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {transaction.investment_date
                          ? new Date(transaction.investment_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-4 capitalize text-muted-foreground">
                        {transaction.payment_method || "—"}
                      </td>
                      {canWrite ? (
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className="mr-1.5 inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            onClick={() => setEditingTransaction(transaction)}
                            disabled={formLoading}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                            onClick={() => handleDeleteTransaction(transaction._id)}
                            disabled={formLoading}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestmentRecordPage;
