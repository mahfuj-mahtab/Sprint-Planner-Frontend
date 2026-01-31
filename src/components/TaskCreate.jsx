import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import api from '../ApiInception';
function TaskCreate({ onClose, orgId, sprintId }) {
    const [sprintName, setSprintName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedMembers, setSelectedMembers] = useState([])
    const [teamDetails, setTeamDetails] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()
    const handleMemberToggle = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }
    const handleTeamMembers = (teamId) => {
        const team = teamDetails.teams.find(t => t._id === teamId);
        if (team) {
            const members = team.members.map(m => ({
                id: m.user._id,
                name: m.user.fullName
            }));
            setTeamMembers(members);
        } else {
            setTeamMembers([]);
        }
    }
    const onSubmit = (data) => {
        console.log(data);
        console.log('Selected Members:', selectedMembers);
        const submitData = { ...data, members: selectedMembers }
        api.post(`/api/v1/org/team/add/task/org/${orgId}/sprint/${sprintId}`, submitData).then((response) => {
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
        api.get(`/api/v1/org/team/fetch/${orgId}`).then((response) => {
            console.log(response.data)
            setTeamDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }, [])

    return (
        <div><section className="bg-white ">
            <div className="py-8 px-4 mx-auto max-w-2xl lg:py-4">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Add a new Task</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label for="name" className="block mb-2 text-sm font-medium text-gray-900">Task Name</label>
                            <input type="text" name="name" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Type task name" required="" {...register("name", { required: true })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label for="description" className="block mb-2 text-sm font-medium text-gray-900">Task Description</label>
                            <textarea type="text" name="description" id="description" className="bg-gray-50 h-40 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Type task description" required="" {...register("description", { required: true })} />
                        </div>

                        <div className="w-full">
                            <label for="brand" className="block mb-2 text-sm font-medium text-gray-900">Start Date</label>
                            <input type="date" name="brand" id="brand" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Product brand" required="" {...register("startDate", { required: true })} />
                        </div>
                        <div className="w-full">
                            <label for="price" className="block mb-2 text-sm font-medium text-gray-900">End Date</label>
                            <input type="date" name="price" id="price" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="$2999" required="" {...register("endDate", { required: true })} />
                        </div>

                        <div className="w-full">
                            <label for="brand" className="block mb-2 text-sm font-medium text-gray-900">Status</label>
                            <select name="status" id="status" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required="" {...register("status", { required: true })}>
                                <option value="">Select Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Work In Progress">Work In Progress</option>
                                <option value="Hold">Hold</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label for="price" className="block mb-2 text-sm font-medium text-gray-900">Priority</label>
                            <select name="priority" id="priority" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required="" {...register("priority", { required: true })}>
                                <option value="">Select Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label for="description" className="block mb-2 text-sm font-medium text-gray-900">Team</label>
                            <select name="team" id="team" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required="" {...register("team", { required: true })} onChange={(e) => { handleTeamMembers(e.target.value) }}>
                                <option value="">Select Team</option>
                                {teamDetails?.teams?.map((team) => (
                                    <option key={team._id} value={team._id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        {teamMembers.length != 0 && (
                            <div className="sm:col-span-2">
                                <label className="block mb-4 text-sm font-medium text-gray-900">Assign To</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`member-${member.id}`}
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleMemberToggle(member.id)}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                            />
                                            <label htmlFor={`member-${member.id}`} className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                                                {member.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        )}
                    </div>
                    <button type="submit" className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-blue-600 rounded-lg focus:ring-4 focus:ring-primary-200 hover:bg-primary-800">
                        Add Task
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default TaskCreate