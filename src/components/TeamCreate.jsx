import React from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
function TeamCreate({ onClose, orgId, projectId, onTeamCreated, fetchOrg }) {
    const {
        register,
        handleSubmit,
    } = useForm()
    const onSubmit = (data) => {
        const url = projectId
            ? `/api/v1/org/project/${projectId}/team/add/${orgId}`
            : `/api/v1/org/team/add/${orgId}`;
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
            if (onTeamCreated) {
                onTeamCreated();
                if (fetchOrg) fetchOrg()
            }
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
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a new Team</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className="ww-label">Team Name</label>
                            <input type="text" name="name" id="name" className="ww-input" placeholder="Type team name" required="" {...register("name", { required: true })} />
                        </div>
                       



                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Add Team
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default TeamCreate
