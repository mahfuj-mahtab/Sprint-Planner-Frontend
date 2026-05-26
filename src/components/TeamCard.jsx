import { useState } from "react";
import { Plus, Trash2, UserMinus, Users } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import MemberAddToTeam from "./MemberAddToTeam";
import { Modal } from "@/components/org/Modal";
import { MemberAvatar } from "./MemberAvatar";
import { EmptyState } from "@/components/org/EmptyState";
import { cn } from "@/lib/utils";

const TEAM_ROLE_STYLES = {
  lead: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-[#a78bfa]/15 text-[#c4b5fd] border-[#a78bfa]/30",
  developer: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30",
  designer: "bg-amber-500/15 text-amber-200 border-amber-500/30",
};

function roleLabel(role) {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function TeamCard({ teamName, members = [], onAddMember, onRemoveMember, orgId, teamId, fetchOrg, canWrite = true }) {
  const [memberAddShow, setMemberAddShow] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    fetchOrg?.();
    onRemoveMember?.();
    onAddMember?.();
  };

  const handleMemberRemove = (memberId) => {
    if (!window.confirm("Remove this member from the team?")) return;
    api
      .patch(`/api/v1/org/team/${teamId}/member/remove/${orgId}/${memberId}`)
      .then((response) => {
        toast.success(response.data.message, { theme: "dark" });
        refresh();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to remove member", { theme: "dark" });
      });
  };

  const handleTeamDelete = () => {
    if (!window.confirm(`Delete team "${teamName}"? Members stay in the org.`)) return;
    setDeleting(true);
    api
      .delete(`/api/v1/org/team/delete/${orgId}/${teamId}`)
      .then((response) => {
        toast.success(response.data.message, { theme: "dark" });
        refresh();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to delete team", { theme: "dark" });
      })
      .finally(() => setDeleting(false));
  };

  return (
    <>
      <article className="rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-0 h-full hover:border-[#00d4ff]/20 transition-shadow hover:shadow-[0_8px_32px_rgba(0,212,255,0.05)]">
        <header className="px-3 py-2.5 border-b border-border bg-gradient-to-r from-[#00d4ff]/10 to-transparent flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/30 bg-[#00d4ff]/10">
              <Users className="w-4 h-4 text-[#00d4ff]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{teamName}</h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {canWrite ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setMemberAddShow(true)}
              className="p-2 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition"
              title="Add member"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleTeamDelete}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition disabled:opacity-50"
              title="Delete team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          ) : null}
        </header>

        <div className="p-2.5 flex-1 min-h-0 flex flex-col">
          {members.length === 0 ? (
            <EmptyState
              className="py-6"
              icon={Users}
              title="No members yet"
              description={
                canWrite
                  ? "Add people from your organization to this project team."
                  : "No members on this team yet."
              }
              action={
                canWrite ? (
                  <button
                    type="button"
                    onClick={() => setMemberAddShow(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
                  >
                    Add member
                  </button>
                ) : null
              }
            />
          ) : (
            <ul className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5 -mr-0.5">
              {members.map((member) => {
                const role = member.role?.toLowerCase?.() || member.role;
                return (
                  <li
                    key={member.user?._id || member._id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-transparent hover:border-border hover:bg-muted/25 transition group/item"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar name={member.user?.fullName} size="sm" accent="cyan" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.user?.fullName || "Unknown"}
                        </p>
                        <span
                          className={cn(
                            "inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded border capitalize",
                            TEAM_ROLE_STYLES[role] || "bg-muted/40 text-muted-foreground border-border"
                          )}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => handleMemberRemove(member.user._id)}
                        className="shrink-0 p-1.5 rounded-md opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        title="Remove from team"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </article>

      <Modal open={memberAddShow} onClose={() => setMemberAddShow(false)} title={`Add to ${teamName}`} size="md">
        <MemberAddToTeam
          onClose={() => setMemberAddShow(false)}
          orgId={orgId}
          teamId={teamId}
          onAddMember={refresh}
          fetchOrg={fetchOrg}
        />
      </Modal>
    </>
  );
}

export default TeamCard;
