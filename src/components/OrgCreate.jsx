import React from 'react'
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from 'react-toastify';
import api from '../ApiInception';
function OrgCreate({ onClose,fetchOrg }) {
  const {
    register,
    handleSubmit,
  } = useForm()
  const onSubmit = (data) => {
    api.post(`/api/v1/users/org/create`, data).then((response) => {
      console.log(response.data.message)
      onClose();
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",

      });
      fetchOrg()
    }).catch((error) => {
      console.log(error.response.data);
      toast.error(error.response.data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",

      });
      console.error("There was an error!", error);
    });

  }
  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-center ww-heading">Create Organization</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="mb-4">
          <label htmlFor="orgName" className="ww-label">
            Organization Name
          </label>
          <input
            type="text"
            id="orgName"
            className="ww-input"
            required
            {...register("name")}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="ww-label">
            Description
          </label>
          <textarea
            id="description"
            rows="4"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            required
            {...register("description")}
          />
        </div>
        <button
          type="submit"
          className="ww-btn-primary w-full"
        >
          Create Organization
        </button>
      </form>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"

      />
    </div>
  )
}

export default OrgCreate
