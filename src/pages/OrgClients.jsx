import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  Wallet,
  Pencil,
  Briefcase,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CrmSubnav } from "@/components/org/CrmSubnav";
import { EmptyState } from "@/components/org/EmptyState";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { CurrencySelect } from "@/components/org/CurrencySelect";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoneySensitive, formatDate } from "@/lib/formatMoney";
import { useOrgAccess } from "@/hooks/useOrgAccess";
import {
  CLIENT_STATUSES,
  CLIENT_TYPES,
  CLIENT_PRIORITIES,
  LOG_TYPES,
  LIST_FILTERS,
  statusMeta,
  logTypeLabel,
  emptyClientForm,
  clientToForm,
} from "@/lib/crmClient";
import { cn } from "@/lib/utils";

function ClientListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border font-medium", meta.color)}>
      {meta.label}
    </span>
  );
}

function OrgClients() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFromUrl = searchParams.get("id");
  const filterFromUrl = searchParams.get("filter");

  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(selectedFromUrl || null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyClientForm());
  const [logNote, setLogNote] = useState("");
  const [logType, setLogType] = useState("note");
  const [submitting, setSubmitting] = useState(false);

  const defaultCurrency = "BDT";
  const { access } = useOrgAccess(orgId);
  const canSee = access?.canSeeExactAmounts ?? true;
  const canWrite = access?.canWrite ?? true;
  const fmt = (v, cur = defaultCurrency, compact = false) =>
    formatMoneySensitive(v, cur, canSee, compact);

  useEffect(() => {
    if (access?.role === "viewer") {
      navigate(`/user/profile/org/${orgId}`);
    }
  }, [access, navigate, orgId]);

  const fetchOverview = useCallback(() => {
    return api
      .get(`/api/v1/org/${orgId}/clients/overview`)
      .then((r) => setOverview(r.data.overview))
      .catch(() => {});
  }, [orgId]);

  const fetchClients = useCallback(() => {
    setLoading(true);
    const params = {};
    if (listFilter === "follow_up") params.follow_up = "due";
    else if (listFilter !== "all") params.status = listFilter;

    return api
      .get(`/api/v1/org/${orgId}/clients`, { params })
      .then((r) => setClients(r.data.clients || []))
      .catch(() => toast.error("Failed to load clients", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, [orgId, listFilter]);

  const fetchDetail = (clientId) => {
    setDetailLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/clients/${clientId}`)
      .then((r) => setDetail(r.data))
      .catch(() => toast.error("Failed to load client", { theme: "dark" }))
      .finally(() => setDetailLoading(false));
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchOverview(), fetchClients()]);
    if (selectedId) await fetchDetail(selectedId);
  }, [fetchOverview, fetchClients, selectedId]);

  useEffect(() => {
    if (filterFromUrl === "follow_up") setListFilter("follow_up");
    else if (filterFromUrl && LIST_FILTERS.some((f) => f.id === filterFromUrl)) {
      setListFilter(filterFromUrl);
    }
  }, [filterFromUrl]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedId) {
      const next = new URLSearchParams(searchParams);
      next.set("id", selectedId);
      setSearchParams(next, { replace: true });
      fetchDetail(selectedId);
    } else {
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
      setDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, orgId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditing(false);
    setForm(emptyClientForm(defaultCurrency));
    setShowForm(true);
  };

  const openEdit = () => {
    if (!detail?.client) return;
    setForm(clientToForm(detail.client, defaultCurrency));
    setEditing(true);
    setShowForm(true);
  };

  const buildPayload = () => ({
    ...form,
    tags: form.tags,
    hourly_rate: form.hourly_rate === "" ? null : form.hourly_rate,
    expected_value: form.expected_value === "" ? null : form.expected_value,
    next_follow_up: form.next_follow_up || null,
  });

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editing && selectedId) {
        await api.patch(`/api/v1/org/${orgId}/clients/${selectedId}`, payload);
        toast.success("Client updated", { theme: "dark" });
      } else {
        const r = await api.post(`/api/v1/org/${orgId}/clients`, payload);
        const newId = r.data.client?._id;
        await fetchClients();
        if (newId) setSelectedId(newId);
        toast.success("Client created", { theme: "dark" });
      }
      setShowForm(false);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (status) => {
    if (!selectedId) return;
    try {
      await api.patch(`/api/v1/org/${orgId}/clients/${selectedId}`, { status });
      await refreshAll();
      toast.success("Status updated", { theme: "dark" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleSnooze = async (days) => {
    if (!selectedId) return;
    try {
      await api.post(`/api/v1/org/${orgId}/clients/${selectedId}/follow-up/snooze`, { days });
      await refreshAll();
      toast.success(`Follow-up in ${days} days`, { theme: "dark" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm("Delete this client? Linked projects will be unlinked.")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/clients/${clientId}`);
      if (selectedId === clientId) setSelectedId(null);
      toast.success("Client removed", { theme: "dark" });
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logNote.trim() || !selectedId) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/clients/${selectedId}/logs`, {
        note: logNote,
        type: logType,
      });
      setLogNote("");
      await fetchDetail(selectedId);
      await fetchClients();
      toast.success("Activity logged", { theme: "dark" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!selectedId || !window.confirm("Remove this activity?")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/clients/${selectedId}/logs/${logId}`);
      await fetchDetail(selectedId);
      toast.success("Removed", { theme: "dark" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied", { theme: "dark" });
  };

  const createProject = async () => {
    if (!selectedId || !detail?.client) return;
    const name = window.prompt("Project name", `${detail.client.name} — project`);
    if (!name?.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post(`/api/v1/org/${orgId}/projects`, {
        name: name.trim(),
        client_id: selectedId,
        project_type: "client_work",
        status: "active",
      });
      toast.success("Project created", { theme: "dark" });
      await fetchDetail(selectedId);
      const pid = r.data.project?._id;
      if (pid) navigate(`/user/profile/org/${orgId}/project/${pid}/dashboard`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const recordPayment = () => {
    if (!selectedId) return;
    navigate(`/user/profile/org/${orgId}/finance?tab=income&clientId=${selectedId}`);
  };

  const clientCurrency = detail?.client?.currency || defaultCurrency;

  return (
    <DashboardLayout>
      <CrmSubnav
        orgId={orgId}
        active="clients"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New client
          </button>
        }
      />

      <div className="ww-page space-y-4">
        <div className="grid lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="ww-input w-full pl-10"
                placeholder="Search name, company, tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {LIST_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setListFilter(f.id)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition",
                    listFilter === f.id
                      ? "bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                  {f.id === "follow_up" && overview?.followUpsDue > 0 ? (
                    <span className="ml-1 font-mono">({overview.followUpsDue})</span>
                  ) : null}
                </button>
              ))}
            </div>

            {loading ? (
              <ClientListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={User}
                title={clients.length === 0 ? "No clients yet" : "No matches"}
                description={
                  clients.length === 0
                    ? "Track leads, retainers, and client work. Log calls, set follow-ups, and tie payments in Finance."
                    : "Try a different search or filter."
                }
                action={
                  clients.length === 0 ? (
                    <button type="button" onClick={openCreate} className="ww-btn-primary text-sm">
                      Add first client
                    </button>
                  ) : null
                }
                className="py-10"
              />
            ) : (
              <ul className="space-y-2">
                {filtered.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c._id)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition",
                        selectedId === c._id
                          ? "border-[#00d4ff]/40 bg-[#00d4ff]/5"
                          : "border-border bg-card hover:border-[#00d4ff]/25",
                        c.followUpDue && selectedId !== c._id && "border-amber-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold",
                            selectedId === c._id
                              ? "border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]"
                              : "border-border bg-muted/40"
                          )}
                        >
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold truncate">{c.name}</span>
                            <StatusBadge status={c.status} />
                            {c.priority === "high" ? (
                              <span className="text-[9px] uppercase text-amber-400">High</span>
                            ) : null}
                          </div>
                          {c.company ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {c.company}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] font-mono text-muted-foreground">
                            <span>{c.projectCount || 0} proj</span>
                            {c.paymentCount > 0 ? (
                              <span>{c.paymentCount} pay</span>
                            ) : null}
                            {c.totalPaid > 0 ? (
                              <span className="text-primary">{fmt(c.totalPaid, c.currency || defaultCurrency, true)}</span>
                            ) : null}
                            {c.lastContactAt ? (
                              <span className="inline-flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {formatDate(c.lastContactAt)}
                              </span>
                            ) : null}
                            {c.followUpDue ? (
                              <span className="text-amber-400 inline-flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3" /> Follow-up
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="ww-card-sm min-h-[400px] border-border/80 lg:sticky lg:top-36">
              {!selectedId ? (
                <EmptyState
                  icon={Briefcase}
                  title="Your client hub"
                  description="Manage leads and active clients, log every touchpoint, track expected value, and jump to Finance to record payments."
                  action={
                    <button type="button" onClick={openCreate} className="ww-btn-outline text-sm">
                      <UserPlus className="w-4 h-4" /> Add client
                    </button>
                  }
                  className="border-0 bg-transparent py-16"
                />
              ) : detailLoading && !detail ? (
                <div className="space-y-4 p-2">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                </div>
              ) : detail ? (
                <div className="space-y-5">
                  {detail.summary?.followUpDue ? (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 text-amber-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Follow-up due
                        {detail.client.next_follow_up
                          ? ` — ${formatDate(detail.client.next_follow_up)}`
                          : ""}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleSnooze(7)}
                          className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                        >
                          +7 days
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSnooze(14)}
                          className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                        >
                          +14 days
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{detail.client.name}</h2>
                        <StatusBadge status={detail.client.status} />
                      </div>
                      {detail.client.company ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Building2 className="w-4 h-4 shrink-0" />
                          {detail.client.company}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {detail.client.email ? (
                          <a
                            href={`mailto:${detail.client.email}`}
                            className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        ) : null}
                        {detail.client.phone ? (
                          <a
                            href={`tel:${detail.client.phone}`}
                            className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        ) : null}
                        {detail.client.website ? (
                          <a
                            href={detail.client.website.startsWith("http") ? detail.client.website : `https://${detail.client.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Web
                          </a>
                        ) : null}
                      </div>
                      {(detail.client.tags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {detail.client.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={recordPayment}
                        className="text-sm px-3 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 inline-flex items-center gap-1.5"
                      >
                        <Wallet className="w-4 h-4" />
                        Payment
                      </button>
                      <button
                        type="button"
                        onClick={createProject}
                        disabled={submitting}
                        className="text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Project
                      </button>
                      <button type="button" onClick={openEdit} className="p-2 rounded-xl border border-border hover:bg-muted">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedId)}
                        className="p-2 rounded-xl border border-border hover:bg-muted text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Status:</span>
                    {CLIENT_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleQuickStatus(s.value)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border transition",
                          detail.client.status === s.value ? s.color : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                      <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Paid</div>
                      <div className="font-mono text-base text-primary mt-0.5">
                        {fmt(detail.summary?.totalPaid ?? 0, clientCurrency)}
                      </div>
                      {detail.summary?.lastPayment ? (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Last {formatDate(detail.summary.lastPayment)}
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Expected</div>
                      <div className="font-mono text-base mt-0.5">
                        {detail.summary?.expectedValue
                          ? fmt(detail.summary.expectedValue, clientCurrency)
                          : "—"}
                      </div>
                    </div>
                    {(detail.summary?.outstanding ?? 0) > 0 ? (
                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5">
                        <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Outstanding</div>
                        <div className="font-mono text-base text-amber-200 mt-0.5">
                          {fmt(detail.summary.outstanding, clientCurrency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">vs project budgets</div>
                      </div>
                    ) : (detail.summary?.pipelineGap ?? 0) > 0 ? (
                      <div className="rounded-lg border border-[#00d4ff]/25 bg-[#00d4ff]/5 p-2.5">
                        <div className="text-muted-foreground uppercase tracking-wide text-[9px]">To collect</div>
                        <div className="font-mono text-base text-[#00d4ff] mt-0.5">
                          {fmt(detail.summary.pipelineGap, clientCurrency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">vs expected</div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                        <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Projects</div>
                        <div className="font-mono text-base mt-0.5">{detail.summary?.projectCount ?? 0}</div>
                      </div>
                    )}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Rate</div>
                      <div className="font-mono text-base mt-0.5">
                        {detail.client.hourly_rate != null
                          ? `${fmt(detail.client.hourly_rate, clientCurrency, true)}/hr`
                          : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="text-muted-foreground uppercase tracking-wide text-[9px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Follow-up
                      </div>
                      <div className="font-medium mt-0.5 text-[11px]">
                        {detail.client.next_follow_up
                          ? formatDate(detail.client.next_follow_up)
                          : "Not set"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="text-muted-foreground uppercase tracking-wide text-[9px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Last touch
                      </div>
                      <div className="font-medium mt-0.5 text-[11px]">
                        {detail.client.last_contacted_at
                          ? formatDate(detail.client.last_contacted_at)
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {detail.client.notes ? (
                    <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">{detail.client.notes}</p>
                  ) : null}

                  <section>
                    <h3 className="text-sm font-semibold mb-2">Payment history</h3>
                    {detail.incomes?.length ? (
                      <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                        {detail.incomes.map((inc) => (
                          <li
                            key={inc._id}
                            className="flex justify-between text-sm rounded-lg border border-border px-3 py-2"
                          >
                            <span>
                              <span className="text-muted-foreground">{formatDate(inc.payment_date)}</span>
                              <span className="ml-2">{inc.category}</span>
                            </span>
                            <span className="font-mono text-primary">+{fmt(inc.amount, clientCurrency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No payments linked — use Record payment.</p>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">Projects</h3>
                      <button type="button" onClick={createProject} className="text-xs text-primary hover:underline">
                        + New project
                      </button>
                    </div>
                    {detail.projects?.length ? (
                      <ul className="space-y-1.5">
                        {detail.projects.map((p) => (
                          <li key={p._id}>
                            <Link
                              to={`/user/profile/org/${orgId}/project/${p._id}/dashboard`}
                              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/20 text-sm"
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="font-mono text-muted-foreground text-xs">
                                {p.budget != null ? fmt(p.budget, clientCurrency) : "—"}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No projects yet.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Activity
                    </h3>
                    <form onSubmit={handleAddLog} className="space-y-2 mb-3">
                      <div className="flex gap-2">
                        <SelectInput
                          value={logType}
                          onChange={(e) => setLogType(e.target.value)}
                          className="w-28 shrink-0 text-sm"
                        >
                          {LOG_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </SelectInput>
                        <textarea
                          className="ww-input flex-1 min-h-[44px] text-sm"
                          placeholder="What happened? Scope, quote, feedback…"
                          value={logNote}
                          onChange={(e) => setLogNote(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting || !logNote.trim()}
                        className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log activity"}
                      </button>
                    </form>
                    {detail.client.communicationLogs?.length > 0 ? (
                      <ul className="space-y-2 max-h-52 overflow-y-auto">
                        {detail.client.communicationLogs.map((log) => (
                          <li key={log._id} className="rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm group">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono uppercase text-[#00d4ff]">
                                {logTypeLabel(log.type)}
                              </span>
                              <div className="flex items-center gap-2">
                                <time className="text-[10px] text-muted-foreground">
                                  {new Date(log.loggedAt).toLocaleString()}
                                </time>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(log._id)}
                                  className="opacity-0 group-hover:opacity-100 text-destructive p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 leading-relaxed">{log.note}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No activity yet.</p>
                    )}
                    {detail.client.last_contacted_at ? (
                      <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last contact {formatDate(detail.client.last_contacted_at)}
                      </p>
                    ) : null}
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(false);
        }}
        title={editing ? "Edit client" : "New client"}
        description="Leads, retainers, and project clients — built for solo & indie devs."
        size="lg"
      >
        <form onSubmit={handleSaveClient} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Field label="Name *">
            <input
              className="ww-input w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Status">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CLIENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Type">
              <SelectInput value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })}>
                {CLIENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Priority">
              <SelectInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {CLIENT_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input
                className="ww-input w-full"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone / WhatsApp">
              <input
                className="ww-input w-full"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company">
              <input
                className="ww-input w-full"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>
            <Field label="Website">
              <input
                className="ww-input w-full"
                placeholder="https://"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Currency">
              <CurrencySelect value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </Field>
            <Field label="Hourly rate">
              <input
                type="number"
                min="0"
                className="ww-input w-full font-mono"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              />
            </Field>
            <Field label="Expected value" hint="Deal / LTV target">
              <input
                type="number"
                min="0"
                className="ww-input w-full font-mono"
                value={form.expected_value}
                onChange={(e) => setForm({ ...form, expected_value: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Next follow-up">
              <input
                type="date"
                className="ww-input w-full"
                value={form.next_follow_up}
                onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })}
              />
            </Field>
            <Field label="How they found you">
              <input
                className="ww-input w-full"
                placeholder="Referral, Twitter, Upwork…"
                value={form.referral_source}
                onChange={(e) => setForm({ ...form, referral_source: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tags" hint="Comma-separated">
            <input
              className="ww-input w-full"
              placeholder="retainer, enterprise, design"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="ww-input w-full min-h-[72px]"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <button type="submit" disabled={submitting} className="ww-btn-primary w-full py-3 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editing ? "Save changes" : "Create client"}
          </button>
        </form>
      </Modal>

      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </DashboardLayout>
  );
}

export default OrgClients;
