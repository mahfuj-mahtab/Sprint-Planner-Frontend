import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { Field, SelectInput } from "@/components/org/Field";
import { Modal } from "@/components/org/Modal";
import { statusLabel } from "@/lib/incomeSources";

export function LinkedEntityField({
  label,
  hint,
  value,
  onChange,
  items = [],
  clients = [],
  placeholder = "None",
  orgId,
  entityType,
  onEntityCreated,
  className,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", client_id: "" });

  const isClient = entityType === "client";
  const isProject = entityType === "project";
  const isIncomeSource = entityType === "income_source";

  const openCreate = () => {
    setForm({ name: "", company: "", client_id: "", status: "started" });
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required", { theme: "dark" });
      return;
    }
    setSubmitting(true);
    try {
      if (isClient) {
        const r = await api.post(`/api/v1/org/${orgId}/clients`, {
          name: form.name.trim(),
          company: form.company.trim(),
        });
        const client = r.data.client;
        onEntityCreated?.(client);
        onChange(client._id);
        toast.success("Client created", { theme: "dark" });
      } else if (isProject) {
        const r = await api.post(`/api/v1/org/${orgId}/projects`, {
          name: form.name.trim(),
          client_id: form.client_id || undefined,
          project_type: "product",
          status: "active",
        });
        const project = r.data.project;
        onEntityCreated?.(project);
        onChange(project._id);
        toast.success("Project created", { theme: "dark" });
      } else if (isIncomeSource) {
        const r = await api.post(`/api/v1/org/${orgId}/finance/income-sources`, {
          name: form.name.trim(),
          status: form.status || "started",
          type: "content",
        });
        const source = r.data.source;
        onEntityCreated?.(source);
        onChange(source._id);
        toast.success("Income source created — add investment & forecast under Income sources tab", {
          theme: "dark",
        });
      }
      setCreateOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Field label={label} hint={hint}>
        <div className="flex gap-2">
          <SelectInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={className}
          >
            <option value="">{placeholder}</option>
            {items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
                {item.company ? ` (${item.company})` : ""}
                {item.status ? ` · ${statusLabel(item.status)}` : ""}
              </option>
            ))}
          </SelectInput>
          <button
            type="button"
            onClick={openCreate}
            title={`New ${entityType}`}
            className="shrink-0 px-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </Field>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          isClient ? "New client" : isIncomeSource ? "New income source" : "New project"
        }
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name">
            <input
              className="ww-input ww-input-md w-full"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isClient ? "Acme Corp" : isIncomeSource ? "YouTube channel" : "My SaaS"}
            />
          </Field>
          {isIncomeSource ? (
            <p className="text-xs text-muted-foreground">
              Add investment, forecasts, and timeline under Finance → Income sources.
            </p>
          ) : null}
          {isClient ? (
            <Field label="Company (optional)">
              <input
                className="ww-input ww-input-md w-full"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </Field>
          ) : (
            <Field label="Client (optional)">
              <SelectInput
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              >
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
          </button>
        </form>
      </Modal>
    </>
  );
}
