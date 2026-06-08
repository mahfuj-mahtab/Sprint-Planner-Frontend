import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
import { flattenFeatureGroups } from "@/lib/featureTree";
import { Plus, X } from 'lucide-react';
function TaskCreate({ onClose, orgId, projectId, sprintId, onTaskCreated, defaultTeamId }) {
    const [selectedMembers, setSelectedMembers] = useState([])
    const [teamDetails, setTeamDetails] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const [featureModules, setFeatureModules] = useState([])
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || "")
    const [orgMembers, setOrgMembers] = useState([])
    const [showInlineTeamCreate, setShowInlineTeamCreate] = useState(false)
    const [inlineTeamName, setInlineTeamName] = useState("")
    const [inlineTeamMembers, setInlineTeamMembers] = useState([])
    const [inlineTeamRoles, setInlineTeamRoles] = useState({})
    const [creatingTeam, setCreatingTeam] = useState(false)
    const {
        register,
        handleSubmit,
        setValue,
    } = useForm({
        defaultValues: {
            projectId: projectId || "",
            team: defaultTeamId || "",
            status: "Pending",
            task_type: "feature",
            priority: "Medium",
        },
    })
    const handleMemberToggle = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }
    const handleTeamMembers = (teamId) => {
        const team = teamDetails?.teams?.find(t => t._id === teamId);
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
    const loadProjectTeams = (nextProjectId, selectTeamId = "") => {
        setTeamMembers([]);
        setSelectedMembers([]);
        if (!selectTeamId) setValue("team", "");
        if (!nextProjectId) {
            setTeamDetails({ teams: [] });
            setFeatureModules([]);
            return;
        }
        api.get(`/api/v1/org/project/${nextProjectId}/team/fetch/${orgId}`).then((response) => {
            setTeamDetails(response.data);
            const teamToSelect = selectTeamId || defaultTeamId;
            if (teamToSelect) {
                const defaultTeam = response.data?.teams?.find((t) => t._id === teamToSelect);
                setValue("team", teamToSelect);
                setTeamMembers((defaultTeam?.members || []).map((m) => ({
                    id: m.user._id,
                    name: m.user.fullName,
                })));
                setSelectedMembers((defaultTeam?.members || []).map((m) => m.user._id));
            }
        }).catch((error) => {
            console.error("There was an error!", error);
        });

        api.get(`/api/v1/org/${orgId}/projects/${nextProjectId}/features/summary`).then((r) => {
            if (r.data?.success) setFeatureModules(r.data.modules || []);
        }).catch(() => {
            setFeatureModules([]);
        });
    }
    const handleInlineTeamMemberToggle = (memberId) => {
        setInlineTeamMembers(prev => {
            if (prev.includes(memberId)) {
                const nextRoles = { ...inlineTeamRoles };
                delete nextRoles[memberId];
                setInlineTeamRoles(nextRoles);
                return prev.filter(id => id !== memberId);
            }
            setInlineTeamRoles((roles) => ({ ...roles, [memberId]: "editor" }));
            return [...prev, memberId];
        })
    }
    const handleCreateTeamInsideTask = async () => {
        const currentProjectId = projectId || selectedProjectId;
        if (!currentProjectId) {
            toast.error("Select a project first", { theme: "dark" });
            return;
        }
        const name = inlineTeamName.trim();
        if (!name) {
            toast.error("Team name is required", { theme: "dark" });
            return;
        }
        setCreatingTeam(true);
        try {
            const teamResponse = await api.post(`/api/v1/org/project/${currentProjectId}/team/add/${orgId}`, { name });
            const teamId = teamResponse.data?.team?._id;
            for (const memberId of inlineTeamMembers) {
                await api.patch(`/api/v1/org/team/${teamId}/member/add/${orgId}`, {
                    user: memberId,
                    role: inlineTeamRoles[memberId] || "editor",
                });
            }
            toast.success("Team ready for this task", { theme: "dark" });
            setInlineTeamName("");
            setInlineTeamMembers([]);
            setInlineTeamRoles({});
            setShowInlineTeamCreate(false);
            await loadProjectTeams(currentProjectId, teamId);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to create team", { theme: "dark" });
        } finally {
            setCreatingTeam(false);
        }
    }
    const onSubmit = (data) => {
        console.log(data);
        console.log('Selected Members:', selectedMembers);
        const submitData = { ...data, projectId: projectId || data.projectId, members: selectedMembers }
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
        api.get(`/api/v1/org/fetch/${orgId}`).then((response) => {
            setOrgMembers((response.data?.organization?.members || []).filter((member) => member.user?._id));
        }).catch((error) => console.error("There was an error!", error));

        if (projectId) {
            loadProjectTeams(projectId);
        } else {
            api.get(`/api/v1/org/${orgId}/projects`, { params: { limit: 100, archived: "false" } }).then((response) => {
                setProjects(response.data.projects || []);
            }).catch((error) => console.error("There was an error!", error));
        }
    }, [defaultTeamId, orgId, projectId, setValue])

    return (
        <div><section className="bg-transparent">
            <div className="px-0 mx-auto max-w-2xl">
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a new Task</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="projectId" className="ww-label">Project</label>
                            <select
                                name="projectId"
                                id="projectId"
                                className="ww-input"
                                required
                                disabled={Boolean(projectId)}
                                {...register("projectId", { required: true })}
                                value={selectedProjectId}
                                onChange={(e) => {
                                    setSelectedProjectId(e.target.value);
                                    setValue("projectId", e.target.value);
                                    loadProjectTeams(e.target.value);
                                }}
                            >
                                <option value="">Select project</option>
                                {projectId ? <option value={projectId}>Current project</option> : null}
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>{project.name}</option>
                                ))}
                            </select>
                        </div>

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
                            <label htmlFor="task_type" className="ww-label">Type</label>
                            <select name="task_type" id="task_type" className="ww-input" {...register("task_type")}>
                                <option value="feature">Feature</option>
                                <option value="bug">Bug</option>
                                <option value="chore">Chore</option>
                                <option value="spike">Spike</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="status" className="ww-label">Status</label>
                            <select name="status" id="status" className="ww-input" required="" {...register("status", { required: true })}>
                                <option value="Pending">Pending</option>
                                <option value="Backlog">Backlog</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Done">Done</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="priority" className="ww-label">Priority</label>
                            <select name="priority" id="priority" className="ww-input" required="" {...register("priority", { required: true })}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="acceptance_criteria" className="ww-label">Acceptance criteria (optional)</label>
                            <textarea
                                id="acceptance_criteria"
                                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] min-h-[80px]"
                                placeholder="What does done look like?"
                                {...register("acceptance_criteria")}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="featureId" className="ww-label">Feature (optional)</label>
                            <select name="featureId" id="featureId" className="ww-input" {...register("featureId")}>
                                <option value="">Unassigned</option>
                                {flattenFeatureGroups(featureModules).map((g) => (
                                    <optgroup key={g.key} label={g.label}>
                                        {g.features.map((f) => (
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
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <label htmlFor="team" className="ww-label mb-0">Team</label>
                                <button
                                    type="button"
                                    disabled={!selectedProjectId}
                                    onClick={() => setShowInlineTeamCreate((value) => !value)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
                                >
                                    {showInlineTeamCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    {showInlineTeamCreate ? "Cancel" : "Create team"}
                                </button>
                            </div>
                            <select name="team" id="team" className="ww-input" required="" {...register("team", { required: true })} onChange={(e) => { handleTeamMembers(e.target.value) }}>
                                <option value="">Select Team</option>
                                {teamDetails?.teams?.map((team) => (
                                    <option key={team._id} value={team._id}>{team.name}</option>
                                ))}
                            </select>
                            {selectedProjectId && (!teamDetails?.teams || teamDetails.teams.length === 0) && !showInlineTeamCreate ? (
                                <button
                                    type="button"
                                    onClick={() => setShowInlineTeamCreate(true)}
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    No team in this project. Create one now
                                </button>
                            ) : null}
                        </div>
                        {selectedProjectId && showInlineTeamCreate ? (
                            <div className="sm:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-primary" />
                                            Create team
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">Add the team and choose roles, then it will be selected for this task.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowInlineTeamCreate(false)}
                                        className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="Close team creator"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <div className="flex-1">
                                        <label htmlFor="inlineTeamName" className="ww-label">Team name</label>
                                        <input
                                            type="text"
                                            id="inlineTeamName"
                                            className="ww-input"
                                            placeholder="Team name"
                                            value={inlineTeamName}
                                            onChange={(e) => setInlineTeamName(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={creatingTeam}
                                        onClick={handleCreateTeamInsideTask}
                                        className="ww-btn-primary sm:mb-0 disabled:opacity-50"
                                    >
                                        {creatingTeam ? "Creating..." : "Create team"}
                                    </button>
                                </div>
                                {orgMembers.length > 0 ? (
                                    <div className="mt-4">
                                        <label className="ww-label mb-3">Assign members and roles</label>
                                        <div className="space-y-2">
                                            {orgMembers.map((member) => (
                                                <div key={member.user._id} className="grid grid-cols-[1fr_8rem] gap-3 items-center rounded-lg border border-border bg-card px-3 py-2">
                                                    <label className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={inlineTeamMembers.includes(member.user._id)}
                                                            onChange={() => handleInlineTeamMemberToggle(member.user._id)}
                                                            className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary/30 focus:ring-2 cursor-pointer"
                                                        />
                                                        <span className="truncate">{member.user.fullName || member.user.email}</span>
                                                    </label>
                                                    <select
                                                        className="ww-input ww-input-sm text-xs"
                                                        disabled={!inlineTeamMembers.includes(member.user._id)}
                                                        value={inlineTeamRoles[member.user._id] || "editor"}
                                                        onChange={(e) => setInlineTeamRoles((roles) => ({ ...roles, [member.user._id]: e.target.value }))}
                                                    >
                                                        <option value="editor">Editor</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-3">No organization members found to add to this team.</p>
                                )}
                            </div>
                        ) : null}
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
