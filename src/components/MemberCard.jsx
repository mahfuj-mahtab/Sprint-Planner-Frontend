import { useState } from "react";
import { Crown, Mail, Pencil, Trash2, User } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import { MemberAvatar } from "./MemberAvatar";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  inactive: "bg-muted/50 text-muted-foreground border-border",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
};

const ROLE_STYLES = {
  owner: "border-primary/40 bg-primary/10 text-primary",
  admin: "border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]",
  editor: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  viewer: "border-border bg-muted/40 text-muted-foreground",
};

const ORG_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const MEMBER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "banned", label: "Banned" },
];

function MemberCard({ member, orgId, ownerId, isOwner: isOwnerProp, canManage, onRemoved, onChanged }) {
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: member?.role || "viewer",
    status: member?.status || "pending",
  });

  const user = member?.user;
  const name = user?.fullName || "Unknown";
  const email = user?.email || "";
  const status = member?.status || "pending";
  const orgRole = isOwnerProp ? "owner" : member?.role || "viewer";
  const ownerKey = ownerId?._id?.toString?.() || ownerId?.toString?.();
  const isOwner = isOwnerProp || (ownerKey && user?._id?.toString() === ownerKey);

  const handleMemberDelete = async () => {
    if (isOwner) {
      toast.error("Cannot remove the organization owner", { theme: "dark" });
      return;
    }
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    setRemoving(true);
    try {
      const response = await api.patch(`/api/v1/users/org/delete/member/${user._id}/${orgId}`);
      toast.success(response.data.message, { theme: "dark" });
      onRemoved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove member", { theme: "dark" });
    } finally {
      setRemoving(false);
    }
  };

  const openEdit = () => {
    setEditForm({ role: member?.role || "viewer", status: member?.status || "pending" });
    setEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch(`/api/v1/users/org/member/${user._id}/${orgId}`, editForm);
      toast.success(response.data.message, { theme: "dark" });
      setEditOpen(false);
      onChanged?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update member", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <article
        className={cn(
          "group relative rounded-xl border bg-card p-4 transition hover:border-[#00d4ff]/25 hover:shadow-[0_8px_32px_rgba(0,212,255,0.06)]",
          isOwner ? "border-primary/30 bg-primary/[0.04]" : "border-border"
        )}
      >
        {isOwner ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-md border border-primary/40 bg-primary/10 text-primary">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        ) : null}

        <div className="flex items-start gap-3">
          <MemberAvatar name={name} size="lg" accent={isOwner ? "primary" : "cyan"} />
          <div className={cn("min-w-0 flex-1", isOwner && "pr-20")}>
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {email ? (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0 opacity-60" />
                {email}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wide font-medium",
                  STATUS_STYLES[status] || STATUS_STYLES.pending
                )}
              >
                {status}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wide font-medium capitalize",
                  ROLE_STYLES[orgRole] || ROLE_STYLES.viewer
                )}
              >
                {orgRole}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 shrink-0" />
            {isOwner || orgRole === "owner"
              ? "Full access · sees all amounts · manages members"
              : orgRole === "admin"
              ? "Full access · sees all amounts · manages members"
              : orgRole === "editor"
              ? "Can edit everything · amounts are hidden"
              : "Read-only · amounts are hidden"}
          </p>
        </div>

        {!isOwner && canManage ? (
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={openEdit}
              className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={handleMemberDelete}
              className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        ) : null}
      </article>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${name}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Org role">
            <SelectInput value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              {ORG_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              {MEMBER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="text-sm px-3 py-2 rounded-lg border border-border">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="ww-btn-primary text-sm disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default MemberCard;
