import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import api from "@/ApiInception";

/** Redirect client-role users away from org admin routes. */
export function useBlockClientOrgRoutes() {
  const { orgId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orgId) return;
    api
      .get(`/api/v1/org/${orgId}/access`)
      .then((r) => {
        if (r.data?.access?.role === "client") {
          navigate(`/user/profile/org/${orgId}?view=projects`, { replace: true });
        }
      })
      .catch(() => {});
  }, [orgId, navigate]);
}
