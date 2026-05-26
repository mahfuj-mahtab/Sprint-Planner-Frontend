import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import MemberCard from "./MemberCard";
import { EmptyState } from "@/components/org/EmptyState";
import { Field, SelectInput } from "@/components/org/Field";
import { Modal } from "@/components/org/Modal";

const ORG_ROLES = [
  { value: "admin", label: "Admin — full data & member management" },
  { value: "editor", label: "Editor — can edit, amounts hidden" },
  { value: "viewer", label: "Viewer — read-only, amounts hidden" },
];

const MEMBER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "banned", label: "Banned" },
];

const emptyInvite = { email: "", role: "viewer", status: "active" };

function MembersShow({ orgId, ownerId: ownerIdProp, members: initialMembers, access: initialAccess, onRefresh }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [owner, setOwner] = useState(null);
  const [ownerId, setOwnerId] = useState(ownerIdProp);
  const [access, setAccess] = useState(initialAccess || null);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/users/org/fetch/all/members/${orgId}`);
      setMembers(response.data.members || []);
      setOwner(response.data.owner || null);
      setOwnerId(response.data.owner_id || ownerIdProp);
      setAccess(response.data.access || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load members", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  }, [orgId, ownerIdProp]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (initialMembers?.length) setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    if (initialAccess) setAccess(initialAccess);
  }, [initialAccess]);

  const canManage = access?.canManageMembers ?? false;
  const activeCount = members.filter((m) => m.status === "active").length;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invite.email.trim()) {
      toast.error("Email is required", { theme: "dark" });
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch(`/api/v1/users/org/add/member/${orgId}`, invite);
      toast.success(response.data.message, { theme: "dark" });
      setMembers(response.data.members || []);
      setInviteOpen(false);
      setInvite(emptyInvite);
      onRefresh?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add member", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !members.length && !owner) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground font-medium">{members.length + (owner ? 1 : 0)}</span> in organization
          {activeCount > 0 ? (
            <>
              {" "}
              · <span className="text-primary">{activeCount} active members</span>
            </>
          ) : null}
        </p>
        {canManage ? (
          <button
            id="org-members-add-btn"
            type="button"
            onClick={() => setInviteOpen(true)}
            className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add member
          </button>
        ) : null}
      </div>

      {!access?.canSeeExactAmounts && access?.role ? (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2">
          Your role ({access.role}) can use finance and CRM, but exact amounts are hidden.
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {owner ? (
          <MemberCard member={{ user: owner, status: "active", role: "owner" }} orgId={orgId} ownerId={ownerId} isOwner />
        ) : null}
        {members.map((member) => (
          <MemberCard
            key={member.user?._id || member._id}
            member={member}
            orgId={orgId}
            ownerId={ownerId}
            canManage={canManage}
            onChanged={loadMembers}
            onRemoved={() => {
              loadMembers();
              onRefresh?.();
            }}
          />
        ))}
      </div>

      {!owner && !members.length ? (
        <EmptyState
          icon={Users}
          className="py-14"
          title="No members yet"
          description="Invite teammates to collaborate on projects, sprints, and tasks."
          action={
            canManage ? (
              <button type="button" onClick={() => setInviteOpen(true)} className="ww-btn-primary text-sm">
                Add first member
              </button>
            ) : null
          }
        />
      ) : null}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add organization member">
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              className="ww-input w-full"
              placeholder="user@example.com"
            />
          </Field>
          <Field label="Role">
            <SelectInput value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              {ORG_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={invite.status} onChange={(e) => setInvite({ ...invite, status: e.target.value })}>
              {MEMBER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setInviteOpen(false)} className="text-sm px-3 py-2 rounded-lg border border-border">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="ww-btn-primary text-sm disabled:opacity-50">
              {saving ? "Adding…" : "Add member"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MembersShow;
