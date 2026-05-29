import { useEffect, useState } from "react";
import api from "../ApiInception";

const DEFAULT_ACCESS = {
  role: null,
  canSeeExactAmounts: false,
  canAccessFinance: false,
  canManageMembers: false,
  canWrite: false,
  isOrgOwner: false,
};

export function useOrgAccess(orgId) {
  const [access, setAccess] = useState(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(Boolean(orgId));

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    api
      .get(`/api/v1/org/${orgId}/access`)
      .then((r) => setAccess(r.data.access || DEFAULT_ACCESS))
      .catch(() => setAccess(DEFAULT_ACCESS))
      .finally(() => setLoading(false));
  }, [orgId]);

  return { access, loading };
}
