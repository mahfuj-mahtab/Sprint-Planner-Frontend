import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useInvestors } from '../hooks/useInvestor';
import InvestorForm from '../components/investor/InvestorForm';
import InvestorTable from '../components/investor/InvestorTable';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, BarChart3, Plus, ReceiptText, X } from 'lucide-react';

const InvestorListPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { investors, loading, error, createInvestor, updateInvestor, deleteInvestor } = useInvestors(orgId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await createInvestor(data);
      setShowForm(false);
      // Optional: show success message
    } catch (err) {
      console.error('Error creating investor:', err);
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
      console.error('Error updating investor:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (investorId) => {
    try {
      await deleteInvestor(investorId);
      // Optional: show success message
    } catch (err) {
      console.error('Error deleting investor:', err);
    }
  };

  const handleViewDetails = (investorId) => {
    const investor = investors.find(i => i._id === investorId);
    setSelectedInvestor(investor);
  };

  const handleEdit = (investorId) => {
    const investor = investors.find(i => i._id === investorId);
    setEditingData(investor);
    setEditingId(investorId);
    setShowForm(false);
  };

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
              <div className="ww-tag border-primary/25 bg-primary/10 text-primary text-[10px] mb-1">Investors</div>
              <h1 className="ww-heading text-xl">Investor Management</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/user/profile/org/${orgId}/investors/record`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <ReceiptText className="w-4 h-4" /> Record Investment
            </Link>
            <Link to={`/user/profile/org/${orgId}/investors/dashboard`} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="ww-page-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Manage ownership, investor records, and funding history.</p>
        <button
          type="button"
          className="ww-btn-primary h-11 px-4 py-0"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setEditingData(null);
          }}
        >
          {showForm ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {showForm ? 'Close' : 'New Investor'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</div>}

      {showForm && (
        <div className="ww-card">
          <h2 className="ww-heading mb-5 text-xl">Create New Investor</h2>
          <InvestorForm
            onSubmit={handleCreate}
            loading={formLoading}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingId && editingData && (
        <div className="ww-card">
          <h2 className="ww-heading mb-5 text-xl">Edit Investor</h2>
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
            <h2 className="ww-heading text-xl">Investor Details</h2>
            <p className="mt-1 text-sm font-semibold text-primary">{selectedInvestor.name}</p>
          </div>
          <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="ww-label">Type</label>
              <p className="text-sm capitalize text-foreground">{selectedInvestor.investor_type}</p>
            </div>
            <div>
              <label className="ww-label">Email</label>
              <p className="text-sm text-foreground">{selectedInvestor.email || '-'}</p>
            </div>
            <div>
              <label className="ww-label">Phone</label>
              <p className="text-sm text-foreground">{selectedInvestor.phone || '-'}</p>
            </div>
            <div>
              <label className="ww-label">Ownership</label>
              <p className="text-sm font-semibold text-foreground">{selectedInvestor.ownership_percentage}%</p>
            </div>
            <div>
              <label className="ww-label">Total Invested</label>
              <p className="text-sm font-semibold text-primary">${selectedInvestor.total_invested.toLocaleString()}</p>
            </div>
            <div>
              <label className="ww-label">Investments</label>
              <p className="text-sm text-foreground">{selectedInvestor.investment_count}</p>
            </div>
            <div>
              <label className="ww-label">Status</label>
              <p className="text-sm capitalize text-foreground">{selectedInvestor.status}</p>
            </div>
            {selectedInvestor.notes && (
              <div className="sm:col-span-2">
                <label className="ww-label">Notes</label>
                <p className="text-sm leading-6 text-muted-foreground">{selectedInvestor.notes}</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="ww-btn-primary h-10 px-4 py-0"
              onClick={() => handleEdit(selectedInvestor._id)}
            >
              Edit
            </button>
            <button
              type="button"
              className="ww-btn-outline h-10 px-4 py-0"
              onClick={() => setSelectedInvestor(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="ww-card">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="ww-heading text-xl">All Investors</h2>
          <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">{investors.length} total</span>
        </div>
        <InvestorTable
          investors={investors}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestorListPage;
