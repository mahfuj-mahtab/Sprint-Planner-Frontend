import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import api from "../ApiInception";

function ProjectEdit({ onClose, orgId, project, onUpdated }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    reset({
      name: project?.name || "",
      description: project?.description || "",
    });
  }, [project, reset]);

  const onSubmit = (data) => {
    if (!project?._id) return;
    return api
      .patch(`/api/v1/org/${orgId}/projects/${project._id}`, {
        name: data.name,
        description: data.description,
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

