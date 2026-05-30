import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInvestors } from "@/hooks/useInvestor";
import { useInvestorPageAccess } from "@/hooks/useInvestorPageAccess";
import InvestorForm from "@/components/investor/InvestorForm";
import { InvestorTable } from "@/components/investor/InvestorTable";
import { InvestorAccessBanner } from "@/components/investor/InvestorDashboard";
import { formatMoneySensitive } from "@/lib/formatMoney";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, BarChart3, Loader2, Plus, ReceiptText, X } from "lucide-react";

const InvestorListPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { canSeeExactAmounts, canWrite, accessRole, loading: accessLoading } =
    useInvestorPageAccess(orgId);
  const { investors, loading, error, createInvestor, updateInvestor, deleteInvestor } =
    useInvestors(orgId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const currency = "BDT";
  const fmt = (v) => formatMoneySensitive(v, currency, canSeeExactAmounts);

  const allocatedOwnership = investors
    .filter((i) => i.status !== "exited")
    .reduce((s, i) => s + Number(i.ownership_percentage || 0), 0);

  const totals = investors.reduce(
    (acc, inv) => {
      acc.invested += Number(inv.total_invested || 0);
      acc.returned += Number(inv.total_returned || 0);
      return acc;
    },
    { invested: 0, returned: 0 }
  );
  totals.net = totals.invested - totals.returned;

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await createInvestor(data);
      setShowForm(false);
    } catch (err) {
      console.error("Error creating investor:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      await updateInvestor(editingId, data);
      setEditingId(null);
      setEditingData(null);
    } catch (err) {
      console.error("Error updating investor:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (investorId) => {
    try {
      await deleteInvestor(investorId);
      if (selectedInvestor?._id === investorId) setSelectedInvestor(null);
    } catch (err) {
      console.error("Error deleting investor:", err);
    }
  };

  const handleEdit = (investorId) => {
    const investor = investors.find((i) => i._id === investorId);
    setEditingData(investor);
    setEditingId(investorId);
    setShowForm(false);
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
                Investors
              </div>
              <h1 className="ww-heading text-xl">Investor management</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Link
                to={`/user/profile/org/${orgId}/investors/record`}
                className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2"
              >
                <ReceiptText className="w-4 h-4" /> Record investment
              </Link>
            )}
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="ww-card-sm p-4">
            <p className="text-xs text-muted-foreground">Investors</p>
            <p className="text-2xl font-semibold tabular-nums">{investors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {investors.filter((i) => i.status === "active").length} active
            </p>
          </div>
          <div className="ww-card-sm p-4">
            <p className="text-xs text-muted-foreground">Total invested</p>
            <p className="text-2xl font-semibold tabular-nums text-primary font-mono">{fmt(totals.invested)}</p>
          </div>
          <div className="ww-card-sm p-4">
            <p className="text-xs text-muted-foreground">Total returned</p>
            <p className="text-2xl font-semibold tabular-nums text-destructive font-mono">{fmt(totals.returned)}</p>
            <p className="text-xs text-muted-foreground mt-1">Expense-linked payouts</p>
          </div>
          <div className="ww-card-sm p-4">
            <p className="text-xs text-muted-foreground">Net capital</p>
            <p className="text-2xl font-semibold tabular-nums font-mono">{fmt(totals.net)}</p>
          </div>
          <div className="ww-card-sm p-4">
            <p className="text-xs text-muted-foreground">Ownership allocated</p>
            <p className="text-2xl font-semibold tabular-nums">{allocatedOwnership}%</p>
            <p className="text-xs text-muted-foreground mt-1">{Math.max(0, 100 - allocatedOwnership)}% free</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Manage ownership caps (max 100% total) and investor profiles.
          </p>
          {canWrite && (
            <button
              type="button"
              className="ww-btn-primary h-11 px-4 py-0 inline-flex items-center gap-2"
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setEditingData(null);
              }}
            >
              {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
              {showForm ? "Close" : "New investor"}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {canWrite && showForm && (
          <div className="ww-card">
            <h2 className="ww-heading mb-2 text-xl">Create investor</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Remaining ownership available: {Math.max(0, 100 - allocatedOwnership)}%
            </p>
            <InvestorForm onSubmit={handleCreate} loading={formLoading} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {canWrite && editingId && editingData && (
          <div className="ww-card">
            <h2 className="ww-heading mb-5 text-xl">Edit investor</h2>
            <InvestorForm
              initialData={editingData}
              onSubmit={handleUpdate}
              loading={formLoading}
              onCancel={() => {
                setEditingId(null);
                setEditingData(null);
              }}
            />
          </div>
        )}

        {selectedInvestor && (
          <div className="ww-card">
            <div className="mb-5">
              <h2 className="ww-heading text-xl">Investor details</h2>
              <p className="mt-1 text-sm font-semibold text-primary">{selectedInvestor.name}</p>
            </div>
            <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="ww-label">Type</label>
                <p className="text-sm capitalize">{selectedInvestor.investor_type}</p>
              </div>
              <div>
                <label className="ww-label">Email</label>
                <p className="text-sm">{selectedInvestor.email || "—"}</p>
              </div>
              <div>
                <label className="ww-label">Ownership</label>
                <p className="text-sm font-semibold">{selectedInvestor.ownership_percentage}%</p>
              </div>
              <div>
                <label className="ww-label">Total invested</label>
                <p className="text-sm font-semibold text-primary font-mono">
                  {fmt(selectedInvestor.total_invested)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedInvestor.investment_count} round
                  {selectedInvestor.investment_count === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <label className="ww-label">Total returned</label>
                <p className="text-sm font-semibold text-destructive font-mono">
                  {fmt(selectedInvestor.total_returned)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedInvestor.return_count || 0} payout
                  {(selectedInvestor.return_count || 0) === 1 ? "" : "s"} via expenses
                </p>
              </div>
              <div>
                <label className="ww-label">Net position</label>
                <p className="text-sm font-semibold font-mono">
                  {fmt(
                    selectedInvestor.net_position ??
                      Number(selectedInvestor.total_invested || 0) -
                        Number(selectedInvestor.total_returned || 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Invested minus returned</p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              {canWrite && (
                <button
                  type="button"
                  className="ww-btn-primary h-10 px-4"
                  onClick={() => handleEdit(selectedInvestor._id)}
                >
                  Edit
                </button>
              )}
              <button type="button" className="ww-btn-outline h-10 px-4" onClick={() => setSelectedInvestor(null)}>
                Close
              </button>
            </div>
          </div>
        )}

        <div className="ww-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="ww-heading text-xl">All investors</h2>
            <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {investors.length} total
            </span>
          </div>
          <InvestorTable
            investors={investors}
            loading={loading}
            currency={currency}
            canSeeExactAmounts={canSeeExactAmounts}
            canWrite={canWrite}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={(id) => setSelectedInvestor(investors.find((i) => i._id === id))}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestorListPage;
