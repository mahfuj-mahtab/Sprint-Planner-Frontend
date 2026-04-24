import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
function TaskCreate({ onClose, orgId, projectId, sprintId, onTaskCreated }) {
    const [selectedMembers, setSelectedMembers] = useState([])
    const [teamDetails, setTeamDetails] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const [featureModules, setFeatureModules] = useState([])
    const {
        register,
        handleSubmit,
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
                theme: "dark",

            });
            if (onTaskCreated) {
                onTaskCreated();
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
    useEffect(() => {
        const url = projectId
            ? `/api/v1/org/project/${projectId}/team/fetch/${orgId}`
            : `/api/v1/org/team/fetch/${orgId}`;
        api.get(url).then((response) => {
            console.log(response.data)
            setTeamDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });

        if (projectId) {
            api.get(`/api/v1/org/${orgId}/projects/${projectId}/features/summary`).then((r) => {
                if (r.data?.success) setFeatureModules(r.data.modules || []);
            }).catch(() => {
                setFeatureModules([]);
            });
        }
    }, [])

    return (
        <div><section className="bg-transparent">
            <div className="px-0 mx-auto max-w-2xl">
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a new Task</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="name" className="ww-label">Task Name</label>
                            <input type="text" name="name" id="name" className="ww-input" placeholder="Type task name" required="" {...register("name", { required: true })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="description" className="ww-label">Task Description</label>
                            <textarea type="text" name="description" id="description" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 h-40" placeholder="Type task description" required="" {...register("description", { required: true })} />
                        </div>

                        <div className="w-full">
                            <label htmlFor="startDate" className="ww-label">Start Date</label>
                            <input type="date" id="startDate" className="ww-input" required="" {...register("startDate", { required: true })} />
                        </div>
                        <div className="w-full">
                            <label htmlFor="endDate" className="ww-label">End Date</label>
                            <input type="date" id="endDate" className="ww-input" required="" {...register("endDate", { required: true })} />
                        </div>

                        <div className="w-full">
                            <label htmlFor="status" className="ww-label">Status</label>
                            <select name="status" id="status" className="ww-input" required="" {...register("status", { required: true })}>
                                <option value="">Select Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Work In Progress">Work In Progress</option>
                                <option value="Hold">Hold</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="priority" className="ww-label">Priority</label>
                            <select name="priority" id="priority" className="ww-input" required="" {...register("priority", { required: true })}>
                                <option value="">Select Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="featureId" className="ww-label">Feature (optional)</label>
                            <select name="featureId" id="featureId" className="ww-input" {...register("featureId")}>
                                <option value="">Unassigned</option>
                                {featureModules.map((m) => (
                                    <optgroup key={m._id} label={m.name}>
                                        {(m.features || []).map((f) => (
                                            <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {featureModules.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-2">No features found for this project (add them in Project → Features).</p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="team" className="ww-label">Team</label>
                            <select name="team" id="team" className="ww-input" required="" {...register("team", { required: true })} onChange={(e) => { handleTeamMembers(e.target.value) }}>
                                <option value="">Select Team</option>
                                {teamDetails?.teams?.map((team) => (
                                    <option key={team._id} value={team._id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                        {teamMembers.length != 0 && (
                            <div className="sm:col-span-2">
                                <label className="ww-label mb-4">Assign To</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`member-${member.id}`}
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleMemberToggle(member.id)}
                                                className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary/30 focus:ring-2 cursor-pointer"
                                            />
                                            <label htmlFor={`member-${member.id}`} className="ml-2 text-sm font-medium text-muted-foreground cursor-pointer">
                                                {member.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        )}
                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Add Task
                    </button>
                </form>
            </div>
        </section></div>
    )
}

export default TaskCreate
