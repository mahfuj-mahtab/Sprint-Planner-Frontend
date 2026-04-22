import React from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
function MemberAddToOrg({onClose,orgId, onTeamCreated,fetchOrgDetails}) {
    const {
        register,
        handleSubmit,
    } = useForm()
    const onSubmit = (data) => {
        api.patch(`/api/v1/users/org/add/member/${orgId}`, data).then((response) => {
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
            fetchOrgDetails()
            if (onTeamCreated) {
                onTeamCreated();
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
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a member</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="ww-label">User email</label>
                            <input type="email" id="email" className="ww-input" placeholder="member@company.com" required="" {...register("email", { required: true })} />
                        </div>
                       



                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Add Member
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default MemberAddToOrg
