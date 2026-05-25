import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  BarChart3,
  Building2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Wallet,
  Pencil,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { OrgSubnav } from "@/components/org/OrgSubnav";
import { EmptyState } from "@/components/org/EmptyState";
import { Modal } from "@/components/org/Modal";
import { Field } from "@/components/org/Field";
import { Skeleton } from "@/components/ui/Loading";
import { formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", email: "", phone: "", company: "", notes: "" };

function ClientListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

function OrgClients() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFromUrl = searchParams.get("id");

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(selectedFromUrl || null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [logNote, setLogNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/clients`)
      .then((r) => setClients(r.data.clients || []))
      .catch(() => toast.error("Failed to load clients", { theme: "dark" }))
      .finally(() => setLoading(false));
  };

  const fetchDetail = (clientId) => {
    setDetailLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/clients/${clientId}`)
      .then((r) => setDetail(r.data))
      .catch(() => toast.error("Failed to load client", { theme: "dark" }))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, [orgId]);

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
        c.phone?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditing(false);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = () => {
    if (!detail?.client) return;
    const c = detail.client;
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      company: c.company || "",
      notes: c.notes || "",
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editing && selectedId) {
        const r = await api.patch(`/api/v1/org/${orgId}/clients/${selectedId}`, form);
        toast.success(r.data.message, { theme: "dark" });
        await fetchDetail(selectedId);
      } else {
        const r = await api.post(`/api/v1/org/${orgId}/clients`, form);
        toast.success(r.data.message, { theme: "dark" });
        const newId = r.data.client?._id;
        await fetchClients();
        if (newId) setSelectedId(newId);
      }
      setShowForm(false);
      setForm(emptyForm);
      await fetchClients();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm("Delete this client? Linked projects will be unlinked.")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/clients/${clientId}`);
      if (selectedId === clientId) setSelectedId(null);
      toast.success("Client removed", { theme: "dark" });
      fetchClients();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logNote.trim() || !selectedId) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/clients/${selectedId}/logs`, { note: logNote });
      setLogNote("");
      await fetchDetail(selectedId);
      toast.success("Note saved", { theme: "dark" });
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

  return (
    <DashboardLayout>
      <OrgSubnav
        orgId={orgId}
        eyebrow="Light CRM"
        title="Clients"
        icon={User}
        accent="cyan"
        links={[
          {
            to: `/user/profile/org/${orgId}/dashboard`,
            label: "Dashboard",
            icon: BarChart3,
            active: false,
          },
          {
            to: `/user/profile/org/${orgId}/finance`,
            label: "Finance",
            icon: Wallet,
            active: false,
          },
        ]}
        actions={
            <button type="button" onClick={openCreate} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> New client
          </button>
        }
      />

      <div className="ww-page">
        <div className="grid lg:grid-cols-5 gap-3">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="ww-input w-full pl-10"
                placeholder="Search clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <ClientListSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={User}
                title={clients.length === 0 ? "No clients yet" : "No matches"}
                description={
                  clients.length === 0
                    ? "Track who you build for. Link clients to projects and record payments in Finance."
                    : "Try a different search term."
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
                        "w-full text-left rounded-lg border p-3 transition group",
                        selectedId === c._id
                          ? "border-[#00d4ff]/40 bg-[#00d4ff]/5 shadow-[0_4px_24px_rgba(0,212,255,0.08)]"
                          : "border-border bg-card hover:border-[#00d4ff]/25"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold",
                            selectedId === c._id
                              ? "border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]"
                              : "border-border bg-muted/40 text-muted-foreground"
                          )}
                        >
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{c.name}</div>
                          {c.company ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {c.company}
                            </div>
                          ) : null}
                          <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                            {c.projectCount || 0} project{(c.projectCount || 0) !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            <div className="ww-card-sm min-h-[320px] border-border/80 lg:sticky lg:top-36">
              {!selectedId ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Select a client"
                  description="View linked projects, payment totals, and communication history. Or create a new client to tie client work to your builds."
                  action={
                    <button type="button" onClick={openCreate} className="ww-btn-outline text-sm">
                      <Plus className="w-4 h-4" /> Add client
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
                  <Skeleton className="h-32 rounded-xl" />
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold">{detail.client.name}</h2>
                      {detail.client.company ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Building2 className="w-4 h-4" />
                          {detail.client.company}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                        {detail.client.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {detail.client.email}
                          </span>
                        ) : null}
                        {detail.client.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {detail.client.phone}
                          </span>
                        ) : null}
                      </div>
                      {detail.client.notes ? (
                        <p className="text-sm mt-3 text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                          {detail.client.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={recordPayment}
                        className="text-sm px-3 py-2 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 inline-flex items-center gap-1.5"
                      >
                        <Wallet className="w-4 h-4" />
                        Record payment
                      </button>
                      <button
                        type="button"
                        onClick={openEdit}
                        className="p-2 rounded-xl border border-border hover:bg-muted"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedId)}
                        className="p-2 rounded-xl border border-border hover:bg-muted text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                        Total paid
                      </div>
                      <div className="font-mono text-lg text-primary mt-0.5 tabular-nums">
                        {formatMoney(detail.summary?.totalPaid ?? 0)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                        Outstanding
                      </div>
                      <div className="font-mono text-lg mt-0.5 tabular-nums">
                        {formatMoney(Math.max(0, detail.summary?.pendingAmount ?? 0))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">Budget minus recorded income</p>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                      Linked projects
                      <Link
                        to={`/user/profile/org/${orgId}`}
                        className="text-xs text-primary hover:underline font-normal"
                      >
                        Manage in org →
                      </Link>
                    </h3>
                    {detail.projects?.length ? (
                      <ul className="space-y-2">
                        {detail.projects.map((p) => (
                          <li
                            key={p._id}
                            className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/20 transition"
                          >
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                                {p.status || "active"} · {p.project_type?.replace("_", " ") || "product"}
                              </div>
                            </div>
                            <span className="font-mono text-sm text-muted-foreground tabular-nums">
                              {p.budget != null ? formatMoney(p.budget) : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-4">
                        No projects linked. Edit a project and assign this client under project settings.
                      </p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold mb-3">Communication log</h3>
                    <form onSubmit={handleAddLog} className="flex gap-2 mb-4">
                      <textarea
                        className="ww-input flex-1 min-h-[44px] max-h-32 resize-y"
                        placeholder="Meeting notes, scope changes, feedback…"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={submitting || !logNote.trim()}
                        className="shrink-0 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 self-end"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                      </button>
                    </form>
                    {detail.client.communicationLogs?.length > 0 ? (
                      <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {detail.client.communicationLogs.map((log) => (
                          <li
                            key={log._id}
                            className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm"
                          >
                            <time className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                              {new Date(log.loggedAt).toLocaleString()}
                            </time>
                            <p className="mt-1.5 leading-relaxed">{log.note}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No notes yet.</p>
                    )}
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
        description="Light CRM — tied to projects and payments, not a full sales pipeline."
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <Field label="Name *">
            <input
              className="ww-input w-full"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
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
          <Field label="Company">
            <input
              className="ww-input w-full"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="ww-input w-full min-h-[80px]"
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
