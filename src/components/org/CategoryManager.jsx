import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tags } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { categoriesForType } from "@/lib/financeCategories";
import { cn } from "@/lib/utils";

export function CategoryColumn({ title, type, items, orgId, onRefresh, accent, canWrite = true }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/finance/categories`, { name: name.trim(), type });
      setName("");
      toast.success("Category added", { theme: "dark" });
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (categoryId) => {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/org/${orgId}/finance/categories/${categoryId}`, { name: editName.trim() });
      setEditingId(null);
      toast.success("Category updated", { theme: "dark" });
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm("Delete this category?")) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/v1/org/${orgId}/finance/categories/${categoryId}`);
      toast.success("Category removed", { theme: "dark" });
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-left">
      <h3 className={cn("text-sm font-semibold mb-3", accent)}>{title}</h3>
      {canWrite ? (
        <form onSubmit={handleCreate} className="flex gap-2 mb-3">
          <input
            className="ww-input ww-input-md flex-1"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="shrink-0 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </form>
      ) : null}
      <ul className="space-y-1.5 max-h-64 overflow-y-auto">
        {items.map((c) => (
          <li
            key={c._id}
            className="flex items-center gap-2 rounded-lg border border-border/80 px-3 py-2 text-sm hover:bg-muted/20"
          >
            {editingId === c._id ? (
              <>
                <input
                  className="ww-input ww-input-md flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(c._id)}
                  disabled={submitting}
                  className="text-xs font-medium text-primary px-2"
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs text-muted-foreground px-1">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate">{c.name}</span>
                {c.is_default ? (
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">default</span>
                ) : null}
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c._id);
                        setEditName(c.name);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id)}
                      disabled={submitting}
                      className="p-1.5 rounded-md hover:bg-muted text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryManager({ orgId, categories, onRefresh, canWrite = true }) {
  const income = categoriesForType(categories, "income");
  const expense = categoriesForType(categories, "expense");
  const subscription = categoriesForType(categories, "subscription");

  return (
    <div className="max-w-6xl text-left space-y-4">
      <div className="flex items-center gap-2">
        <Tags className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Income, expense, and subscription labels. Transactions and subscriptions must use a category from this list.
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CategoryColumn
          title="Income categories"
          type="income"
          items={income}
          orgId={orgId}
          onRefresh={onRefresh}
          accent="text-primary"
          canWrite={canWrite}
        />
        <CategoryColumn
          title="Expense categories"
          type="expense"
          items={expense}
          orgId={orgId}
          onRefresh={onRefresh}
          accent="text-destructive"
          canWrite={canWrite}
        />
        <CategoryColumn
          title="Subscription categories"
          type="subscription"
          items={subscription}
          orgId={orgId}
          onRefresh={onRefresh}
          accent="text-[#a78bfa]"
          canWrite={canWrite}
        />
      </div>
    </div>
  );
}
