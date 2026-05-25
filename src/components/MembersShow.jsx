import { Users } from "lucide-react";
import MemberCard from "./MemberCard";
import { EmptyState } from "@/components/org/EmptyState";

function MembersShow({ members = [], orgId, ownerId, onRefresh }) {
  const activeCount = members.filter((m) => m.status === "active").length;

  if (!members.length) {
    return (
      <EmptyState
        icon={Users}
        className="py-14"
        title="No members yet"
        description="Invite teammates to collaborate on projects, sprints, and tasks."
      />
    );
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground font-medium">{members.length}</span> in organization
          {activeCount > 0 ? (
            <>
              {" "}
              · <span className="text-primary">{activeCount} active</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((member) => (
          <MemberCard
            key={member.user?._id}
            member={member}
            orgId={orgId}
            ownerId={ownerId}
            onRemoved={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

export default MembersShow;
