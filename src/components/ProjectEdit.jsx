import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import api from "../ApiInception";

function ProjectEdit({ onClose, orgId, project, onUpdated }) {
  const [clients, setClients] = useState([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    api.get(`/api/v1/org/${orgId}/clients`).then((r) => setClients(r.data.clients || [])).catch(() => {});
  }, [orgId]);

  useEffect(() => {
    reset({
      name: project?.name || "",
      description: project?.description || "",
      project_type: project?.project_type || "product",
      status: project?.status || "active",
      client_id: project?.client_id || "",
      budget: project?.budget ?? "",
    });
  }, [project, reset]);

  const onSubmit = (data) => {
    if (!project?._id) return;
    return api
      .patch(`/api/v1/org/${orgId}/projects/${project._id}`, {
        name: data.name,
        description: data.description,
        project_type: data.project_type,
        status: data.status,
        client_id: data.client_id || null,
        budget: data.budget,
      })
      .then((response) => {
        toast.success(response.data.message || "Project updated", { position: "top-right", autoClose: 4000, theme: "dark" });
        if (onUpdated) onUpdated(response.data.project);
        onClose();
      })
      .catch((error) => {
        const message = error?.response?.data?.message || "Failed to update project";
        toast.error(message, { position: "top-right", autoClose: 5000, theme: "dark" });
      });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold ww-heading mb-4">Edit Project</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="ww-label mb-1">Project Name</label>
          <input className="ww-input" placeholder="e.g. Mobile App" {...register("name", { required: true })} />
          {errors.name && <p className="text-xs text-destructive mt-2">Project name is required</p>}
        </div>

        <div>
          <label className="ww-label mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            placeholder="Optional"
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ww-label mb-1">Type</label>
            <select className="ww-input w-full" {...register("project_type")}>
              <option value="product">Product</option>
              <option value="client_work">Client work</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div>
            <label className="ww-label mb-1">Status</label>
            <select className="ww-input w-full" {...register("status")}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {clients.length > 0 && (
          <div>
            <label className="ww-label mb-1">Client</label>
            <select className="ww-input w-full" {...register("client_id")}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="ww-label mb-1">Budget</label>
          <input type="number" step="0.01" className="ww-input w-full" {...register("budget")} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:brightness-95 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="dark" />
    </div>
  );
}

export default ProjectEdit;

