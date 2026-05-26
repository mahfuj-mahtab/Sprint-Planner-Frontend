import { useNavigate } from "react-router";
import { BarChart3, LayoutDashboard, User, Wallet } from "lucide-react";
import { OrgSubnav } from "@/components/org/OrgSubnav";

const TAB_PATHS = {
  dashboard: (orgId) => `/user/profile/org/${orgId}/crm`,
  clients: (orgId) => `/user/profile/org/${orgId}/clients`,
};

export function CrmSubnav({ orgId, active, title = active === "dashboard" ? "Dashboard" : "Clients", actions }) {
  const navigate = useNavigate();

  return (
    <OrgSubnav
      orgId={orgId}
      eyebrow="Indie CRM"
      title={title}
      icon={User}
      accent="cyan"
      links={[
        { to: `/user/profile/org/${orgId}/dashboard`, label: "Org", icon: BarChart3 },
        { to: `/user/profile/org/${orgId}/finance`, label: "Finance", icon: Wallet },
      ]}
      actions={actions}
      tabs={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "clients", label: "Clients", icon: User },
      ]}
      activeTab={active}
      onTabChange={(id) => {
        const path = TAB_PATHS[id]?.(orgId);
        if (path) navigate(path);
      }}
    />
  );
}
