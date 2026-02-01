import React, { useState,useEffect } from 'react'
import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import api from '../ApiInception';
function MemberAddToTeam({ onClose, orgId,teamId , onAddMember}) {
    const [orgDetails, setOrgDetails] = useState()
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()
    const onSubmit = (data) => {
        console.log(data)
        api.patch(`/api/v1/org/team/${teamId}/member/add/${orgId}`, data).then((response) => {
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
            if (onAddMember) {
                onAddMember();
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
    useEffect(() => {
      api.get(`/api/v1/org/fetch/${orgId}`).then((response) => {
          console.log(response.data)
          setOrgDetails(response.data);
          // setProfileDetaile(response.data);
      }).catch((error) => {
          console.error("There was an error!", error);
      });
    }, [])
    if(!orgDetails){
        return <div>Loading...</div>
    }
    return (
        <div><section className="bg-white ">
            <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Add a new Team</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label for="name" className="block mb-2 text-sm font-medium text-gray-900">Member</label>
                           <select name="memberId" id="memberId" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required="" {...register("user", { required: true })}>
                            {orgDetails && orgDetails.organization.members.map((member)=>(
                                <option value={member.user?._id}>{member.user?.fullName}</option>
                            ))}
                           </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label for="name" className="block mb-2 text-sm font-medium text-gray-900">Role</label>
                           <select name="role" id="role" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required="" {...register("role", { required: true })}>
                            <option value="">Select a role</option>
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                           </select>
                        </div>


                    </div>
                    <button type="submit" className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-blue-600 rounded-lg focus:ring-4 focus:ring-primary-200 hover:bg-primary-800">
                        Add Team
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default MemberAddToTeam