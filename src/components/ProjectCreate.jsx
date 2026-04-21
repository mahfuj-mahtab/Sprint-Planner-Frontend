import React from "react";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import api from "../ApiInception";

function ProjectCreate({ onClose, orgId, onCreated }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    api
      .post(`/api/v1/org/${orgId}/projects`, data)
      .then((response) => {
        toast.success(response.data.message, { position: "top-right", autoClose: 4000, theme: "light" });
        if (onCreated) onCreated(response.data.project);
        onClose();
      })
      .catch((error) => {
        const message = error?.response?.data?.message || "Failed to create project";
        toast.error(message, { position: "top-right", autoClose: 5000, theme: "light" });
      });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Project</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            placeholder="e.g. Mobile App"
            {...register("name", { required: true })}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">Project name is required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            placeholder="Optional"
            {...register("description")}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="light" />
    </div>
  );
}

export default ProjectCreate;

