import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Landmark,
  LayoutDashboard,
  List,
  Loader2,
  Plus,
  Repeat,
  Tags,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { OrgSubnav } from "@/components/org/OrgSubnav";
import { StatCard } from "@/components/org/StatCard";
import { EmptyState } from "@/components/org/EmptyState";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { AccountCard } from "@/components/org/AccountCard";
import { TransactionCrudPanel } from "@/components/org/TransactionCrudPanel";
import { CategoryManager } from "@/components/org/CategoryManager";
import { SubscriptionPanel } from "@/components/org/SubscriptionPanel";
import { IncomeSourcesPanel } from "@/components/org/IncomeSourcesPanel";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoneySensitive, formatDateTime } from "@/lib/formatMoney";
import { categoryLabel } from "@/lib/financeCategories";
import { PARTITION_SCOPES } from "@/lib/partitionScopes";
import { CurrencySelect } from "@/components/org/CurrencySelect";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];
const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank account" },
  { value: "mobile", label: "Mobile wallet" },
  { value: "cash", label: "Cash" },
  { value: "online_wallet", label: "Online wallet" },
];

const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sources", label: "Income sources", icon: Target },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "expense", label: "Expense", icon: TrendingDown },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat },
  { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { id: "activity", label: "Activity", icon: List },
  { id: "categories", label: "Categories", icon: Tags },
];


function FinanceSkeleton() {
  return (
    <div className="ww-page space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}

function OrgFinance() {
  const { orgId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const prefillClient = searchParams.get("clientId") || "";

  const setTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", id);
    next.delete("clientId");
    setSearchParams(next, { replace: true });
  };

  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState({ incomes: [], expenses: [], transfers: [] });
  const [profitSummary, setProfitSummary] = useState([]);
  const [unlinkedIncomeTotal, setUnlinkedIncomeTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [incomeSources, setIncomeSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [partitionModal, setPartitionModal] = useState(false);
  const [partitionEditModal, setPartitionEditModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);

  const [accountForm, setAccountForm] = useState({ name: "", type: "bank", currency: "BDT" });
  const [partitionForm, setPartitionForm] = useState({ accountId: "", name: "", scope: "business" });
  const [partitionEditForm, setPartitionEditForm] = useState({
    accountId: "",
    partitionId: "",
    name: "",
    scope: "business",
  });
  const [transferForm, setTransferForm] = useState({
    account_id: "",
    from_partition_id: "",
    to_partition_id: "",
    amount: "",
    transfer_date: today(),
    notes: "",
  });

  const refresh = useCallback(() => {
    setLoading(true);
    return Promise.all([
      api.get(`/api/v1/org/${orgId}/finance/overview`),
      api.get(`/api/v1/org/${orgId}/finance/transactions`),
      api.get(`/api/v1/org/${orgId}/finance/project-profit`),
      api.get(`/api/v1/org/${orgId}/projects`, { params: { limit: 200, archived: "all" } }),
      api.get(`/api/v1/org/${orgId}/clients`),
      api.get(`/api/v1/org/${orgId}/finance/categories`),
      api.get(`/api/v1/org/${orgId}/finance/income-sources`),
    ])
      .then(([ov, tx, profit, proj, cl, cats, sourcesRes]) => {
        setOverview(ov.data.overview);
        setTransactions({
          incomes: tx.data.incomes || [],
          expenses: tx.data.expenses || [],
          transfers: tx.data.transfers || [],
        });
        setProfitSummary(profit.data.summary || []);
        setUnlinkedIncomeTotal(profit.data.unlinkedIncomeTotal || 0);
        setProjects(proj.data.projects || []);
        setClients(cl.data.clients || []);
        setCategories(cats.data.categories || []);
        setIncomeSources(sourcesRes.data.sources || []);
      })
      .catch(() => toast.error("Failed to load finance data", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (prefillClient && tab === "overview") setTab("income");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillClient]);

  const accounts = overview?.accounts || [];
  const currency = accounts[0]?.currency || "BDT";
  const hasAccounts = accounts.length > 0;
  const canSee = overview?.access?.canSeeExactAmounts ?? true;
  const canWrite = overview?.access?.canWrite ?? true;
  const fmt = (v, cur = currency) => formatMoneySensitive(v, cur, canSee);

  const partitionsForAccount = useMemo(() => {
    const map = {};
    for (const a of accounts) map[a._id] = a.partitions || [];
    return map;
  }, [accounts]);

  useEffect(() => {
    if (!hasAccounts || loading) return;
    const firstId = accounts[0]._id;
    setTransferForm((f) => (f.account_id ? f : { ...f, account_id: firstId }));
  }, [hasAccounts, loading, accounts]);

  const activityFeed = useMemo(() => {
    const items = [
      ...transactions.incomes.map((i) => ({
        id: i._id,
        type: "income",
        amount: i.amount,
        date: i.payment_date,
        label: categoryLabel(i.category, categories) || i.source,
        meta: [i.project_id?.name, i.payment_method].filter(Boolean).join(" · "),
      })),
      ...transactions.expenses.map((e) => ({
        id: e._id,
        type: "expense",
        amount: e.amount,
        date: e.expense_date,
        label: categoryLabel(e.category, categories),
        meta: [e.project_id?.name, e.is_personal ? "personal" : null].filter(Boolean).join(" · "),
      })),
      ...transactions.transfers.map((t) => ({
        id: t._id,
        type: "transfer",
        amount: t.amount,
        date: t.transfer_date,
        label:
          t.from_partition_name && t.to_partition_name
            ? `${t.from_partition_name} → ${t.to_partition_name}`
            : "Partition transfer",
        meta: "",
      })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, categories]);

  const openAccountModal = (account = null) => {
    if (account) {
      setEditingAccountId(account._id);
      setAccountForm({
        name: account.name,
        type: account.type || "bank",
        currency: account.currency || "BDT",
      });
    } else {
      setEditingAccountId(null);
      setAccountForm({ name: "", type: "bank", currency: "BDT" });
    }
    setAccountModal(true);
  };

  const openPartitionModal = (accountId = "") => {
    setPartitionForm({ accountId: accountId || accounts[0]?._id || "", name: "", scope: "business" });
    setPartitionModal(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = editingAccountId
        ? await api.patch(`/api/v1/org/${orgId}/finance/accounts/${editingAccountId}`, accountForm)
        : await api.post(`/api/v1/org/${orgId}/finance/accounts`, accountForm);
      toast.success(r.data.message, { theme: "dark" });
      setAccountForm({ name: "", type: "bank", currency: "BDT" });
      setEditingAccountId(null);
      setAccountModal(false);
      await refresh();
      if (!editingAccountId) setTab("overview");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (
      !window.confirm(
        `Delete "${account.name}" and all its partitions? This cannot be undone.`
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.delete(`/api/v1/org/${orgId}/finance/accounts/${account._id}`);
      toast.success(r.data.message, { theme: "dark" });
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePartition = async (e) => {
    e.preventDefault();
    if (!partitionForm.accountId) return;
    setSubmitting(true);
    try {
      const r = await api.post(
        `/api/v1/org/${orgId}/finance/accounts/${partitionForm.accountId}/partitions`,
        { name: partitionForm.name, scope: partitionForm.scope }
      );
      toast.success(r.data.message, { theme: "dark" });
      setPartitionForm({ accountId: partitionForm.accountId, name: "", scope: "business" });
      setPartitionModal(false);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartitionScopeChange = async (accountId, partitionId, scope) => {
    try {
      await api.patch(
        `/api/v1/org/${orgId}/finance/accounts/${accountId}/partitions/${partitionId}`,
        { scope }
      );
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update partition", { theme: "dark" });
    }
  };

  const openEditPartition = (accountId, partition) => {
    setPartitionEditForm({
      accountId,
      partitionId: partition._id,
      name: partition.name,
      scope: partition.scope || "business",
    });
    setPartitionEditModal(true);
  };

  const handleUpdatePartition = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.patch(
        `/api/v1/org/${orgId}/finance/accounts/${partitionEditForm.accountId}/partitions/${partitionEditForm.partitionId}`,
        { name: partitionEditForm.name, scope: partitionEditForm.scope }
      );
      toast.success(r.data.message, { theme: "dark" });
      setPartitionEditModal(false);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePartition = async (accountId, partition) => {
    if (!window.confirm(`Delete partition "${partition.name}"?`)) return;
    setSubmitting(true);
    try {
      const r = await api.delete(
        `/api/v1/org/${orgId}/finance/accounts/${accountId}/partitions/${partition._id}`
      );
      toast.success(r.data.message, { theme: "dark" });
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientCreated = (client) => {
    setClients((prev) => [client, ...prev]);
  };

  const handleProjectCreated = (project) => {
    setProjects((prev) => [...prev, project]);
  };

  const handleIncomeSourceCreated = (source) => {
    setIncomeSources((prev) => [source, ...prev]);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post(`/api/v1/org/${orgId}/finance/transfer`, {
        ...transferForm,
        amount: Number(transferForm.amount),
      });
      toast.success(r.data.message, { theme: "dark" });
      setTransferForm((f) => ({ ...f, amount: "", notes: "" }));
      await refresh();
      setTab("activity");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const SetupBanner = () =>
    !hasAccounts && !loading ? (
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <p className="text-sm font-medium text-foreground">Set up your first account</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add a bank or wallet, then partitions (Free, Emergency, Ops).
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAccountModal()}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add account
        </button>
      </div>
    ) : null;

  return (
    <DashboardLayout>
      <OrgSubnav
        orgId={orgId}
        eyebrow="Money layer"
        title="Finance"
        icon={Wallet}
        links={[
          {
            to: `/user/profile/org/${orgId}/dashboard`,
            label: "Dashboard",
            icon: BarChart3,
            active: false,
          },
          {
            to: `/user/profile/org/${orgId}/crm`,
            label: "CRM",
            icon: Users,
            active: false,
          },
        ]}
        actions={
          hasAccounts ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("income")}
                className="text-sm px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition inline-flex items-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" /> Income
              </button>
              <button
                type="button"
                onClick={() => setTab("expense")}
                className="text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted transition inline-flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" /> Expense
              </button>
            </div>
          ) : null
        }
        tabs={TABS.map((t) => ({
          ...t,
          badge: t.id === "activity" ? activityFeed.length : undefined,
        }))}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className={cn(tab === "sources" ? "ww-page-full max-w-none w-full" : "ww-page")}>
        {tab !== "sources" ? <SetupBanner /> : null}

        {loading ? (
          <FinanceSkeleton />
        ) : (
          <>
            {tab === "overview" && overview && (
              <div className="space-y-6 text-left">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Business P&amp;L — current calendar month only</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <StatCard
                      label="Business revenue"
                      value={fmt(overview.businessMonthIncome ?? overview.monthIncome, currency)}
                      variant="income"
                      sub="Income into business-scoped partitions"
                    />
                    <StatCard
                      label="Business expense"
                      value={fmt(overview.businessMonthExpense ?? overview.monthExpense, currency)}
                      variant="expense"
                      sub="Expenses from business partitions"
                    />
                    <StatCard
                      label="Business net"
                      value={fmt(overview.businessNetProfit ?? overview.netProfit, currency)}
                      variant={(overview.businessNetProfit ?? overview.netProfit) >= 0 ? "income" : "expense"}
                      sub="This month revenue − expenses"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cash by partition scope — all time balances</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                      label="Business cash"
                      value={fmt(overview.businessBalance ?? 0, currency)}
                      variant="income"
                      sub="Revenue & ops envelopes"
                    />
                    <StatCard
                      label="Owner cash"
                      value={fmt(overview.ownerBalance ?? 0, currency)}
                      variant="balance"
                      sub="Your pay / drawings"
                    />
                    <StatCard
                      label="Excluded cash"
                      value={fmt(overview.excludedBalance ?? 0, currency)}
                      variant="neutral"
                      sub="Outside business (e.g. day job)"
                    />
                    <StatCard
                      label="Total cash"
                      value={fmt(overview.totalBalance, currency)}
                      variant="balance"
                      sub="Sum of all accounts"
                    />
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h2 className="text-sm font-semibold">Accounts & partitions</h2>
                      {hasAccounts ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openAccountModal()}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Account
                          </button>
                          <button
                            type="button"
                            onClick={() => openPartitionModal()}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border hover:bg-muted inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Partition
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {!hasAccounts ? (
                      <EmptyState
                        icon={Landmark}
                        title="No accounts yet"
                        description="Create a bank or mobile wallet account. Each account gets partitions — virtual buckets for Free balance, Emergency fund, project budget, and more."
                        action={
                          <button type="button" onClick={() => openAccountModal()} className="ww-btn-primary text-sm">
                            Create first account
                          </button>
                        }
                      />
                    ) : (
                      <div className="grid gap-2">
                        {accounts.map((a) => (
                          <AccountCard
                            key={a._id}
                            account={a}
                            canSeeExactAmounts={canSee}
                            canWrite={canWrite}
                            onPartitionScopeChange={canWrite ? handlePartitionScopeChange : undefined}
                            onEditAccount={canWrite ? openAccountModal : undefined}
                            onDeleteAccount={canWrite ? handleDeleteAccount : undefined}
                            onAddPartition={canWrite ? openPartitionModal : undefined}
                            onEditPartition={canWrite ? openEditPartition : undefined}
                            onDeletePartition={canWrite ? handleDeletePartition : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#a78bfa]" />
                          <h2 className="text-sm font-semibold">Project revenue & cost</h2>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-md">
                          When adding income or expense, choose a <strong className="text-foreground font-medium">Project</strong> in the form (not only Client). Client payments without a project count in org totals but not here.
                        </p>
                      </div>
                      {unlinkedIncomeTotal > 0 ? (
                        <button
                          type="button"
                          onClick={() => setTab("income")}
                          className="text-[11px] rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 px-2.5 py-1.5 hover:bg-amber-500/15"
                        >
                          {fmt(unlinkedIncomeTotal, currency)} income not linked to a project — fix in Income tab
                        </button>
                      ) : null}
                    </div>
                    {profitSummary.length === 0 ? (
                      <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-4">
                        No projects yet. Create a project under your organization, then record income with that project selected.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-muted/40">
                              <th className="px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-normal">
                                Project
                              </th>
                              <th className="px-3 py-2 text-right font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-normal">
                                Revenue
                              </th>
                              <th className="px-3 py-2 text-right font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-normal">
                                Cost
                              </th>
                              <th className="px-3 py-2 text-right font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-normal">
                                Profit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {profitSummary.map((row) => (
                              <tr
                                key={row.project._id}
                                className={cn(
                                  "border-t border-border hover:bg-muted/20",
                                  row.revenue > 0 && "bg-primary/[0.04]"
                                )}
                              >
                                <td className="px-3 py-2 font-medium">{row.project.name}</td>
                                <td className="px-3 py-2 text-right font-mono text-primary tabular-nums">
                                  {row.revenue > 0 ? fmt(row.revenue, currency) : "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">
                                  {row.cost > 0 ? fmt(row.cost, currency) : "—"}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2 text-right font-mono font-medium tabular-nums",
                                    row.profit > 0 && "text-primary",
                                    row.profit < 0 && "text-destructive",
                                    row.profit === 0 && "text-muted-foreground"
                                  )}
                                >
                                  {row.revenue || row.cost ? fmt(row.profit, currency) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {tab === "sources" && (
              <IncomeSourcesPanel
                orgId={orgId}
                projects={projects}
                currency={currency}
                canSeeExactAmounts={canSee}
                canWrite={canWrite}
                onProjectCreated={handleProjectCreated}
                onRefresh={refresh}
              />
            )}

            {tab === "accounts" && (
              <div className="space-y-4 text-left">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openAccountModal()} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> New account
                  </button>
                  <button
                    type="button"
                    onClick={() => openPartitionModal()}
                    disabled={!hasAccounts}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add partition
                  </button>
                </div>
                {hasAccounts ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {accounts.map((a) => (
                      <AccountCard
                        key={a._id}
                        account={a}
                        canSeeExactAmounts={canSee}
                        canWrite={canWrite}
                        onPartitionScopeChange={canWrite ? handlePartitionScopeChange : undefined}
                        onEditAccount={canWrite ? openAccountModal : undefined}
                        onDeleteAccount={canWrite ? handleDeleteAccount : undefined}
                        onAddPartition={canWrite ? openPartitionModal : undefined}
                        onEditPartition={canWrite ? openEditPartition : undefined}
                        onDeletePartition={canWrite ? handleDeletePartition : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Landmark}
                    title="Accounts & partitions"
                    description="Each real-world account (bank, bKash, cash) holds virtual partitions. Money flows between partitions without leaving the account."
                    action={
                      <button type="button" onClick={() => openAccountModal()} className="ww-btn-primary text-sm">
                        Add account
                      </button>
                    }
                  />
                )}
              </div>
            )}

            {tab === "income" && (
              <TransactionCrudPanel
                type="income"
                orgId={orgId}
                items={transactions.incomes}
                accounts={accounts}
                projects={projects}
                clients={clients}
                categories={categories}
                currency={currency}
                hasAccounts={hasAccounts}
                partitionsForAccount={partitionsForAccount}
                canSeeExactAmounts={canSee}
                canWrite={canWrite}
                onRefresh={refresh}
                onManageCategories={() => setTab("categories")}
                prefillClientId={prefillClient}
                onClientCreated={handleClientCreated}
                onProjectCreated={handleProjectCreated}
                incomeSources={incomeSources}
                onIncomeSourceCreated={handleIncomeSourceCreated}
              />
            )}

            {tab === "expense" && (
              <TransactionCrudPanel
                type="expense"
                orgId={orgId}
                items={transactions.expenses}
                accounts={accounts}
                projects={projects}
                clients={clients}
                incomeSources={incomeSources}
                categories={categories}
                currency={currency}
                hasAccounts={hasAccounts}
                partitionsForAccount={partitionsForAccount}
                canSeeExactAmounts={canSee}
                canWrite={canWrite}
                onRefresh={refresh}
                onManageCategories={() => setTab("categories")}
                onClientCreated={handleClientCreated}
                onProjectCreated={handleProjectCreated}
                onIncomeSourceCreated={handleIncomeSourceCreated}
              />
            )}

            {tab === "subscriptions" && (
              <SubscriptionPanel
                orgId={orgId}
                accounts={accounts}
                projects={projects}
                categories={categories}
                currency={currency}
                hasAccounts={hasAccounts}
                partitionsForAccount={partitionsForAccount}
                canSeeExactAmounts={canSee}
                canWrite={canWrite}
                onRefresh={refresh}
              />
            )}

            {tab === "categories" && (
              <CategoryManager orgId={orgId} categories={categories} canWrite={canWrite} onRefresh={refresh} />
            )}

            {tab === "transfer" && (
              <form
                onSubmit={handleTransfer}
                className="max-w-md ww-card-sm space-y-3 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold">Move between partitions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Same account only.</p>
                </div>
                <Field label="Account">
                  <SelectInput
                    required
                    value={transferForm.account_id}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        account_id: e.target.value,
                        from_partition_id: "",
                        to_partition_id: "",
                      })
                    }
                  >
                    <option value="">Select…</option>
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="From">
                    <SelectInput
                      required
                      value={transferForm.from_partition_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_partition_id: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {(partitionsForAccount[transferForm.account_id] || []).map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({fmt(p.balance, currency)})
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="To">
                    <SelectInput
                      required
                      value={transferForm.to_partition_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_partition_id: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {(partitionsForAccount[transferForm.account_id] || [])
                        .filter((p) => p._id !== transferForm.from_partition_id)
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                    </SelectInput>
                  </Field>
                </div>
                <Field label="Amount">
                  <input
                    className="ww-input ww-input-sm w-full font-mono"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  />
                </Field>
                <button
                  type="submit"
                  disabled={submitting || !hasAccounts}
                  className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Transfer"}
                </button>
              </form>
            )}

            {tab === "activity" && (
              <div className="max-w-4xl text-left">
                {activityFeed.length === 0 ? (
                  <EmptyState
                    icon={List}
                    title="No transactions yet"
                    description="Income, expenses, and partition transfers will show up here in chronological order."
                    action={
                      hasAccounts ? (
                        <button type="button" onClick={() => setTab("income")} className="ww-btn-primary text-sm">
                          Record first income
                        </button>
                      ) : null
                    }
                  />
                ) : (
                  <ul className="space-y-1.5">
                    {activityFeed.map((item) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/20 transition"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            item.type === "income" && "bg-primary/15 text-primary",
                            item.type === "expense" && "bg-destructive/15 text-destructive",
                            item.type === "transfer" && "bg-[#00d4ff]/15 text-[#00d4ff]"
                          )}
                        >
                          {item.type === "income" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : item.type === "expense" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowLeftRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(item.date)}
                            {item.meta ? ` · ${item.meta}` : ""}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "font-mono text-base font-medium tabular-nums shrink-0",
                            item.type === "income" && "text-primary",
                            item.type === "expense" && "text-destructive",
                            item.type === "transfer" && "text-[#00d4ff]"
                          )}
                        >
                          {item.type === "expense" ? "−" : item.type === "income" ? "+" : ""}
                          {fmt(item.amount, currency)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={accountModal}
        onClose={() => {
          setAccountModal(false);
          setEditingAccountId(null);
        }}
        title={editingAccountId ? "Edit account" : "New financial account"}
        description={
          editingAccountId
            ? "Update name, type, or currency."
            : "A default Free Balance partition is created automatically."
        }
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <Field label="Account name">
            <input
              className="ww-input w-full"
              placeholder="e.g. BRAC Bank, bKash"
              required
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <SelectInput value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Currency">
            <CurrencySelect
              value={accountForm.currency}
              onChange={(e) =>
                setAccountForm({ ...accountForm, currency: e.target.value })
              }
            />
          </Field>
          <button type="submit" disabled={submitting} className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : editingAccountId ? (
              "Save account"
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </Modal>

      <Modal
        open={partitionEditModal}
        onClose={() => setPartitionEditModal(false)}
        title="Edit partition"
        description="Rename or change scope."
      >
        <form onSubmit={handleUpdatePartition} className="space-y-4">
          <Field label="Partition name">
            <input
              className="ww-input w-full"
              required
              value={partitionEditForm.name}
              onChange={(e) => setPartitionEditForm({ ...partitionEditForm, name: e.target.value })}
            />
          </Field>
          <Field label="Scope">
            <SelectInput
              value={partitionEditForm.scope}
              onChange={(e) => setPartitionEditForm({ ...partitionEditForm, scope: e.target.value })}
            >
              {PARTITION_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.hint}
                </option>
              ))}
            </SelectInput>
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save partition"}
          </button>
        </form>
      </Modal>

      <Modal open={partitionModal} onClose={() => setPartitionModal(false)} title="Add partition" description="Business = revenue & ops. Owner = your pay. Excluded = outside income (other job).">
        <form onSubmit={handleCreatePartition} className="space-y-4">
          <Field label="Account">
            <SelectInput
              required
              value={partitionForm.accountId}
              onChange={(e) => setPartitionForm({ ...partitionForm, accountId: e.target.value })}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Partition name">
            <input
              className="ww-input w-full"
              placeholder="Business, Owner pay, Product ops…"
              required
              value={partitionForm.name}
              onChange={(e) => setPartitionForm({ ...partitionForm, name: e.target.value })}
            />
          </Field>
          <Field label="Scope">
            <SelectInput
              value={partitionForm.scope}
              onChange={(e) => setPartitionForm({ ...partitionForm, scope: e.target.value })}
            >
              {PARTITION_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.hint}
                </option>
              ))}
            </SelectInput>
          </Field>
          <button type="submit" disabled={submitting} className="w-full text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add partition"}
          </button>
        </form>
      </Modal>

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </DashboardLayout>
  );
}

export default OrgFinance;
