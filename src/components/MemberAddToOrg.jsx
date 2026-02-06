import React, { useState } from 'react'
import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import api from '../ApiInception';
function MemberAddToOrg({onClose,orgId, onTeamCreated,fetchOrgDetails}) {
    const [sprintName, setSprintName] = useState('')
    const [description, setDescription] = useState('')
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
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
                theme: "light",

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
                theme: "light",

            });
            console.error("There was an error!", error);
        });
    }
    return (
        <div><section className="bg-white ">
            <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Add a new Team</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label for="name" className="block mb-2 text-sm font-medium text-gray-900">Team Name</label>
                            <input type="email" name="name" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Type team name" required="" {...register("email", { required: true })} />
                        </div>
                       



                    </div>
                    <button type="submit" className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-blue-600 rounded-lg focus:ring-4 focus:ring-primary-200 hover:bg-primary-800">
                        Add Member
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default MemberAddToOrg