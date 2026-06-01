import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import api from "../ApiInception";

export function useStrategyPage(orgId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    return api
      .get(`/api/v1/org/${orgId}/strategy/overview`)
      .then((r) => {
        setData(r.data);
        return r.data;
      })
      .catch(() => {
        setData(null);
        toast.error("Could not load strategy");
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const patchProfile = async (body) => {
    await api.patch(`/api/v1/org/${orgId}/strategy/profile`, body);
    toast.success("Saved");
    await load();
  };

  const saveGoal = async (goalId, body) => {
    if (goalId) {
      await api.patch(`/api/v1/org/${orgId}/strategy/goals/${goalId}`, body);
      toast.success("Goal updated");
    } else {
      await api.post(`/api/v1/org/${orgId}/strategy/goals`, body);
      toast.success("Goal added");
    }
    await load();
  };

  const deleteGoal = async (goal) => {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;
    await api.delete(`/api/v1/org/${orgId}/strategy/goals/${goal._id}`);
    toast.success("Removed");
    await load();
  };

  const updateKeyResult = async (goalId, krId, patch) => {
    await api.patch(`/api/v1/org/${orgId}/strategy/goals/${goalId}/key-results`, {
      kr_id: krId,
      ...patch,
    });
    await load();
  };

  const saveKpi = async (kpiId, body) => {
    if (kpiId) {
      await api.patch(`/api/v1/org/${orgId}/strategy/kpis/${kpiId}`, body);
      toast.success("Metric updated");
    } else {
      await api.post(`/api/v1/org/${orgId}/strategy/kpis`, body);
      toast.success("Metric added");
    }
    await load();
  };

  const recordKpi = async (kpiId, value) => {
    await api.post(`/api/v1/org/${orgId}/strategy/kpis/${kpiId}/entries`, { value: Number(value) });
    toast.success("Logged");
    await load();
  };

  const deleteKpi = async (kpiId) => {
    if (!window.confirm("Delete this metric?")) return;
    await api.delete(`/api/v1/org/${orgId}/strategy/kpis/${kpiId}`);
    toast.success("Removed");
    await load();
  };

  const savePillar = async (pillarId, body) => {
    if (pillarId) {
      await api.patch(`/api/v1/org/${orgId}/strategy/pillars/${pillarId}`, body);
    } else {
      await api.post(`/api/v1/org/${orgId}/strategy/pillars`, body);
    }
    toast.success("Saved");
    await load();
  };

  const saveReview = async (body) => {
    await api.put(`/api/v1/org/${orgId}/strategy/reviews`, body);
    toast.success("Review saved");
    await load();
  };

  return {
    data,
    loading,
    load,
    patchProfile,
    saveGoal,
    deleteGoal,
    updateKeyResult,
    saveKpi,
    recordKpi,
    deleteKpi,
    savePillar,
    saveReview,
  };
}
