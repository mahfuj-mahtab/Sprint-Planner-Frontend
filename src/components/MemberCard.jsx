import { useState } from "react";
import { Crown, Mail, Trash2, User } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  inactive: "bg-muted/50 text-muted-foreground border-border",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
};

function MemberCard({ member, orgId, ownerId, onRemoved }) {
  const [removing, setRemoving] = useState(false);
  const user = member?.user;
  const name = user?.fullName || "Unknown";
  const email = user?.email || "";
  const status = member?.status || "pending";
  const isOwner = ownerId && user?._id?.toString() === ownerId?.toString();

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

  return (
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
            {user?.role ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md border border-border text-muted-foreground capitalize">
                {user.role}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!isOwner ? (
        <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
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
      ) : (
        <div className="mt-4 pt-3 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Organization owner — full access
          </p>
        </div>
      )}
    </article>
  );
}

export default MemberCard;
