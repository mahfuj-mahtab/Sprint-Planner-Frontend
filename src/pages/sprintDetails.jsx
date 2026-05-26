import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import api from '../ApiInception'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ToastContainer, toast } from 'react-toastify';

import TaskCreate from '../components/TaskCreate'
import SprintTeamTasks from '../components/SprintTeamTasks'
import SprintKanban from '../components/SprintKanban'
import { LayoutGrid, List } from 'lucide-react'
import TeamCard from '../components/TeamCard'
import TeamCreate from '../components/TeamCreate'
import TaskEdit from '../components/TaskEdit'
import TeamWiseAnalytics from '../components/TeamWiseAnalytics'
import { ArrowLeft } from 'lucide-react'
import { Skeleton, Spinner } from '../components/ui/Loading'
import DashboardLayout from "@/components/layout/DashboardLayout";
function SprintDetails({ fetchOrg }) {
    const [activeTab, setActiveTab] = useState('board')
    const [showTaskCreate, setShowCreateTask] = useState(false)
    const [createTaskTeamId, setCreateTaskTeamId] = useState(null)
    const [showTeamCreate, setShowCreateTeam] = useState(false)
    const [showTaskEdit, setShowTaskEdit] = useState(false)
    const [editingTaskId, setEditingTaskId] = useState(null)
    const { orgId, projectId, sprintId } = useParams();
    const navigate = useNavigate();
    const [sprintDetails, setSprintDetails] = useState()
    const tabs = [
        { id: 'board', label: 'Board', icon: LayoutGrid },
        { id: 'list', label: 'List', icon: List },
        { id: 'analytics', label: 'Analytics' },
        { id: 'team', label: 'Team' },
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
        if (!window.confirm("Delete this task?")) return;
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
                <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
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
            <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
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
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${activeTab === tab.id
                                            ? 'bg-muted text-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                            }`}
                                    >
                                        {tab.icon ? <tab.icon className="w-3.5 h-3.5" /> : null}
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
                            onClick={() => {
                              setCreateTaskTeamId(null);
                              setShowCreateTask(true);
                            }}
                            className="bg-primary hover:brightness-95 text-sm text-primary-foreground font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            + Task (full form)
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'analytics' ? (
                <TeamWiseAnalytics teams={sprintDetails?.teams} sprint={sprintDetails?.sprint} />
            ) : (
            <div className="p-4 sm:p-6 ww-page-full max-w-none">
                    {activeTab === 'board' && (
                        <div className="space-y-4">
                            <div>
                              <h2 className="text-2xl font-bold ww-heading">{sprintDetails?.sprint?.name}</h2>
                              <p className="text-sm text-muted-foreground mt-1">Drag cards across columns to advance work toward shipped.</p>
                            </div>
                            {sprintDetails?.teams?.length > 0 ? (
                              <SprintKanban
                                teams={sprintDetails.teams}
                                orgId={orgId}
                                sprintId={sprintId}
                                onRefresh={fetchSprintDetails}
                                onEditTask={(task) => {
                                  setEditingTaskId(task._id);
                                  setShowTaskEdit(true);
                                }}
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">Create a team to add tasks to the board.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 ww-heading">{sprintDetails?.sprint?.name}</h2>
                            {sprintDetails?.teams?.length > 0 ? (
                              <Accordion
                                type="single"
                                collapsible
                                defaultValue={sprintDetails.teams[0]?._id}
                                className="space-y-3"
                              >
                                {sprintDetails.teams.map((team) => (
                                  <div key={team._id} className="rounded-xl border border-border bg-card overflow-hidden">
                                    <AccordionItem value={team._id} className="border-0">
                                      <AccordionTrigger className="text-base font-semibold px-4 hover:no-underline">
                                        {team.name}
                                        <span className="ml-2 text-xs font-normal text-muted-foreground font-mono">
                                          {(team.tasks || []).length} tasks
                                        </span>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <SprintTeamTasks
                                          team={team}
                                          orgId={orgId}
                                          sprintId={sprintId}
                                          sprint={sprintDetails.sprint}
                                          onRefresh={fetchSprintDetails}
                                          onEditTask={(task) => {
                                            setEditingTaskId(task._id);
                                            setShowTaskEdit(true);
                                          }}
                                          onDeleteTask={handleTaskDelete}
                                          onOpenFullCreate={() => {
                                            setCreateTaskTeamId(team._id);
                                            setShowCreateTask(true);
                                          }}
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  </div>
                                ))}
                              </Accordion>
                            ) : (
                              <p className="text-muted-foreground text-sm">No teams for this sprint. Create a team first.</p>
                            )}



                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div>
                            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                              <div>
                                <h2 className="text-2xl font-bold ww-heading">Teams</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {sprintDetails?.teams?.length || 0} team{(sprintDetails?.teams?.length || 0) !== 1 ? "s" : ""} on this project
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowCreateTeam(true)}
                                className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-95"
                              >
                                + Create team
                              </button>
                            </div>
                            {sprintDetails?.teams?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sprintDetails.teams.map((team) => (
                                        <TeamCard
                                          key={team._id}
                                          members={team.members}
                                          teamName={team.name}
                                          onAddMember={() => fetchSprintDetails()}
                                          onRemoveMember={() => fetchSprintDetails()}
                                          orgId={orgId}
                                          teamId={team._id}
                                          fetchOrg={fetchOrg}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm rounded-xl border border-dashed border-border p-8 text-center">
                                  No teams yet. Create a team to add members and assign sprint tasks.
                                </p>
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
            )}
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
                        <TaskCreate
                          onClose={() => {
                            setShowCreateTask(false);
                            setCreateTaskTeamId(null);
                          }}
                          orgId={orgId}
                          projectId={effectiveProjectId}
                          sprintId={sprintId}
                          defaultTeamId={createTaskTeamId}
                          onTaskCreated={() => fetchSprintDetails()}
                        />
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
