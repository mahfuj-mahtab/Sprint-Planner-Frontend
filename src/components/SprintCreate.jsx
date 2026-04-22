import React from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
function SprintCreate({ onClose, orgId, projectId }) {
    const {
        register,
        handleSubmit,
    } = useForm()
    const onSubmit = (data) => {
        const url = projectId
            ? `/api/v1/org/project/${projectId}/add/sprint/${orgId}`
            : `/api/v1/org/add/sprint/${orgId}`;
        api.post(url, data).then((response) => {
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
        <div><section className="bg-transparent">
            <div className="px-0 mx-auto max-w-2xl">
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a new Sprint</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className="ww-label">Sprint Name</label>
                            <input type="text" name="name" id="name" className="ww-input" placeholder="Type sprint name" required="" {...register("name", { required: true })} />
                        </div>
                        <div className="w-full">
                            <label htmlFor="startDate" className="ww-label">Start Date</label>
                            <input type="date" id="startDate" className="ww-input" required="" {...register("startDate", { required: true })} />
                        </div>
                        <div className="w-full">
                            <label htmlFor="endDate" className="ww-label">End Date</label>
                            <input type="date" id="endDate" className="ww-input" required="" {...register("endDate", { required: true })} />
                        </div>



                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Add Sprint
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default SprintCreate
