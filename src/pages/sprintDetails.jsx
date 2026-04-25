import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import api from '../ApiInception'
import { convertDate } from '../utils/utils'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ToastContainer, toast } from 'react-toastify';

import TaskCreate from '../components/TaskCreate'
import PriorityShow from '../components/PriorityShow'
import SHowStatus from '../components/SHowStatus'
import TeamCard from '../components/TeamCard'
import TeamCreate from '../components/TeamCreate'
import TaskEdit from '../components/TaskEdit'
import TeamWiseAnalytics from '../components/TeamWiseAnalytics'
import { ArrowLeft } from 'lucide-react'
import { Skeleton, Spinner } from '../components/ui/Loading'
import DashboardLayout from "@/components/layout/DashboardLayout";
function SprintDetails({ fetchOrg }) {
    const [activeTab, setActiveTab] = useState('sprint')
    const [showTaskCreate, setShowCreateTask] = useState(false)
    const [showTeamCreate, setShowCreateTeam] = useState(false)
    const [showTaskEdit, setShowTaskEdit] = useState(false)
    const [editingTaskId, setEditingTaskId] = useState(null)
    const { orgId, projectId, sprintId } = useParams();
    const navigate = useNavigate();
    const [sprintDetails, setSprintDetails] = useState()
    const tabs = [
        { id: 'sprint', label: 'Sprint' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'team', label: 'Team' },
        // { id: 'tasks', label: 'Tasks' }
    ]
    const fetchSprintDetails = () => {
        api.get(`/api/v1/org/sprint/details/${sprintId}`).then((response) => {
            console.log(response.data)
            setSprintDetails(response.data);
            // setorgDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }
    const handleTaskDelete = (taskId, teamId) => {
        api.delete(`/api/v1/org/team/delete/task/org/${orgId}/sprint/${sprintId}/${taskId}/team/${teamId}`).then((response) => {
            console.log(response.data)
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
            // Refresh sprint details after deletion
            fetchSprintDetails();
        }).catch((error) => {
            console.error("There was an error!", error);
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
        });
    }
    useEffect(() => {
        fetchSprintDetails();
    }, [sprintId, orgId]);
    const effectiveProjectId = sprintDetails?.sprint?.project_id || projectId;
    if (!sprintDetails) {
        return (
            <DashboardLayout>
                <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-30">
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-9 w-28" />
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    <Skeleton className="h-7 w-72 mb-4" />
                    <div className="space-y-3">
                        {[0, 1].map((i) => (
                            <div key={i} className="w-full rounded-xl border border-border bg-card p-5">
                                <Skeleton className="h-5 w-48 mb-3" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                    <Spinner className="mt-6" label="Loading sprint…" />
                </div>
            </DashboardLayout>
        )
    }
    return (
        <DashboardLayout>
            <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-30">
                <div className="px-4 sm:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate(`/user/profile/org/${orgId}?view=details&projectId=${effectiveProjectId}&tab=sprints`)}
                            className="shrink-0 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                            title="Back to project"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Project
                        </button>

                        <div className="min-w-0 flex-1 overflow-x-auto">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowCreateTeam(true)}
                            className="border border-border hover:bg-muted text-foreground font-medium text-sm py-1.5 px-4 rounded-md transition-colors"
                        >
                            + Create Team
                        </button>
                        <button
                            onClick={() => setShowCreateTask(true)}
                            className="bg-primary hover:brightness-95 text-sm text-primary-foreground font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            + Create Task
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
                    {activeTab === 'sprint' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 ww-heading">{sprintDetails?.sprint?.name}</h2>
                            {sprintDetails?.teams?.map((team) =>
                                <div key={team._id} className="w-full mb-8 rounded-xl border border-border bg-card p-5">

                                    <Accordion type="single" collapsible defaultValue="item-1">
                                        <AccordionItem value="item-1">
                                            <AccordionTrigger className="text-lg font-semibold pl-2">{team.name} Team</AccordionTrigger>
                                            <AccordionContent>

                                                {team.tasks.length === 0 ? <div className="p-4 text-muted-foreground">No tasks available for this team.</div> :

                                                    <div className="relative overflow-x-auto rounded-xl border border-border bg-card">
                                                        <table className="w-full text-sm text-left rtl:text-right text-foreground">
                                                            <thead className="bg-muted/60 text-muted-foreground border-b border-border font-semibold">
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Task Title
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Assignee
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Start Date
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        End Date
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Status
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Priority
                                                                    </th>
                                                                    <th scope="col" className="px-6 py-3">
                                                                        Actions
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {team.tasks.map((task) => (
                                                                    <tr key={task._id} className="border-b border-border">
                                                                        <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-foreground">
                                                                            {task.title}
                                                                        </th>
                                                                        <td className="px-6 py-4 text-muted-foreground">
                                                                            {task.assignee.length > 0 ? task.assignee.map((assignee) => assignee.fullName).join(", ") : "Unassigned"}
                                                                            {/* {task.assignee?.name || "Unassigned"} */}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-muted-foreground">
                                                                            {convertDate(task.startDate)}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-muted-foreground">
                                                                            {convertDate(task.endDate)}
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <SHowStatus status={task.status} />
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            {/* {task.priority}
                                                                                 */}
                                                                            <PriorityShow status={task.priority} />
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <button className="text-primary hover:opacity-80" title="View">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingTaskId(task._id);
                                                                                    setShowTaskEdit(true);
                                                                                }}
                                                                                className="ml-4 text-[#00d4ff] hover:opacity-80"
                                                                                title="Edit"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => { handleTaskDelete(task._id, team._id) }}
                                                                                className="ml-4 text-destructive hover:opacity-80"
                                                                                title="Delete"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {/* <tr class="bg-neutral-primary border-b border-default">
                                                                        <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">
                                                                            Apple MacBook Pro 17"
                                                                        </th>
                                                                        <td class="px-6 py-4">
                                                                            Silver
                                                                        </td>
                                                                        <td class="px-6 py-4">
                                                                            Laptop
                                                                        </td>
                                                                        <td class="px-6 py-4">
                                                                            $2999
                                                                        </td>
                                                                        <td class="px-6 py-4">
                                                                            Pending
                                                                        </td>
                                                                        <td class="px-6 py-4">
                                                                            <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">High</span>
                                                                           
                                                                        </td>
                                                                    </tr> */}

                                                            </tbody>
                                                        </table>
                                                    </div>
                                                }

                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                    <button onClick={() => setShowCreateTask(true)} className="inline-block mt-4 ml-2 text-primary font-semibold hover:opacity-80"> + Add Task</button>
                                </div>
                            )}



                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div>
                            {/* <h2 className="text-2xl font-bold mb-4">Analytics</h2> */}
                            <TeamWiseAnalytics teams={sprintDetails?.teams} />
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 ww-heading">Team</h2>
                            {sprintDetails?.teams && sprintDetails?.teams.length > 0 ?
                                sprintDetails?.teams.map((team, index) => (
                                    <TeamCard key={index} members={team.members} teamName={team.name} onAddMember={() => { fetchSprintDetails() }} onRemoveMember={() => { fetchSprintDetails() }} orgId={orgId} teamId={team._id} fetchOrg={fetchOrg} />
                                ))
                                : (
                                    <p className="text-muted-foreground">No teams available for this sprint.</p>
                                )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Tasks</h2>
                            <p className="text-muted-foreground">Tasks and activities will be displayed here.</p>
                        </div>
                    )}
                </div>
            {showTaskCreate && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setShowCreateTask(false)}
                            className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <TaskCreate onClose={() => setShowCreateTask(false)} orgId={orgId} projectId={effectiveProjectId} sprintId={sprintId} onTaskCreated={() => fetchSprintDetails()} />
                    </div>
                </div>
            )}
            {showTaskEdit && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setShowTaskEdit(false)}
                            className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <TaskEdit onClose={() => setShowTaskEdit(false)} orgId={orgId} projectId={effectiveProjectId} sprintId={sprintId} onTaskCreated={() => fetchSprintDetails()} taskId={editingTaskId} />
                    </div>
                </div>
            )}
            {showTeamCreate && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setShowCreateTeam(false)}
                            className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <TeamCreate onClose={() => setShowCreateTeam(false)} orgId={orgId} projectId={effectiveProjectId} onTeamCreated={() => fetchSprintDetails()} />
                    </div>
                </div>
            )}
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
        </DashboardLayout>
    )
}

export default SprintDetails
