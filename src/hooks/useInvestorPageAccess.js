import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgAccess } from "@/hooks/useOrgAccess";

/** Redirect viewers away from finance/investor pages; expose role flags. */
export function useInvestorPageAccess(orgId) {
  const navigate = useNavigate();
  const { access, loading } = useOrgAccess(orgId);

  const canSee = access.canSeeExactAmounts ?? false;
  const canWrite = access.canWrite ?? false;
  const canAccess = access.canAccessFinance ?? access.role !== "viewer";

  useEffect(() => {
    if (!loading && access.role === "viewer") {
      navigate(`/user/profile/org/${orgId}`);
    }
  }, [loading, access.role, navigate, orgId]);

  return {
    access,
    loading,
    canSeeExactAmounts: canSee,
    canWrite,
    canAccessFinance: canAccess,
    accessRole: access.role || "",
  };
}
