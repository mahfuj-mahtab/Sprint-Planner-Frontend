import React, { useState, useEffect } from 'react'
import LeftSidebar from '../components/LeftSidebar'
import Profileheader from '../components/profileheader'
import { Link, useParams } from 'react-router'
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
import StatusShow from '../components/PriorityShow'
import PriorityShow from '../components/PriorityShow'
import SHowStatus from '../components/SHowStatus'
import TeamCard from '../components/TeamCard'
import TeamCreate from '../components/TeamCreate'
function SprintDetails() {
    const [activeTab, setActiveTab] = useState('sprint')
    const [showTaskCreate, setShowCreateTask] = useState(false)
    const [showTeamCreate, setShowCreateTeam] = useState(false)

    const { orgId, sprintId } = useParams();
    const [orgDetails, setorgDetails] = useState()
    const [sprintDetails, setSprintDetails] = useState()
    const tabs = [
        { id: 'sprint', label: 'Sprint' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'team', label: 'Team' },
        { id: 'tasks', label: 'Tasks' }
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
                theme: "light",

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
                theme: "light",

            });
        });
    }
    useEffect(() => {
        fetchSprintDetails();
    }, [sprintId, orgId]);
    if (!sprintDetails) {
        return <div>Loading...</div>
    }
    return (
        <div>
            <div className="flex h-screen">
                {/* Left Sidebar for Task Management */}
                <div className="w-64 bg-gray-100 p-5 border-r border-gray-300 h-full">
                    <LeftSidebar />
                </div>
                {/* Right Side - Empty for Tasks */}
                <div className="flex-1 bg-white h-full overflow-y-auto">
                    <Profileheader />
                    <div className="border-b border-gray-300 bg-gray-50">
                        <div className="flex items-center justify-between px-6">
                            <div className="flex gap-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === tab.id
                                            ? 'text-blue-600 border-blue-600'
                                            : 'text-gray-600 border-transparent hover:text-gray-800'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">

                                <button
                                    onClick={() => setShowCreateTeam(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                                >
                                    + Create Team
                                </button>
                                <button
                                    onClick={() => setShowCreateTask(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                                >
                                    + Create Task
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'sprint' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">{sprintDetails?.sprint?.name}</h2>
                                {sprintDetails?.teams?.map((team) =>
                                    <div className='w-full mr-10 border-2 h-auto mb-10 p-5 rounded-lg'>

                                        <Accordion type="single" collapsible defaultValue="item-1">
                                            <AccordionItem value="item-1">
                                                <AccordionTrigger className="text-lg font-semibold pl-2">{team.name} Team</AccordionTrigger>
                                                <AccordionContent>

                                                    {team.tasks.length === 0 ? <div className="p-4 text-gray-600">No tasks available for this team.</div> :

                                                        <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
                                                            <table className="w-full text-sm text-left rtl:text-right text-body">
                                                                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 font-semibold">
                                                                    <tr>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Task Title
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Assignee
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Start Date
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            End Date
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Status
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Priority
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3">
                                                                            Actions
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {team.tasks.map((task) => (
                                                                        <tr key={task._id} class="bg-neutral-primary border-b border-default">
                                                                            <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">
                                                                                {task.title}
                                                                            </th>
                                                                            <td class="px-6 py-4">
                                                                                {task.assignee.length > 0 ? task.assignee.map((assignee) => assignee.fullName).join(", ") : "Unassigned"}
                                                                                {/* {task.assignee?.name || "Unassigned"} */}
                                                                            </td>
                                                                            <td class="px-6 py-4">
                                                                                {convertDate(task.startDate)}
                                                                            </td>
                                                                            <td class="px-6 py-4">
                                                                                {convertDate(task.endDate)}
                                                                            </td>
                                                                            <td class="px-6 py-4">
                                                                                <SHowStatus status={task.status} />
                                                                            </td>
                                                                            <td class="px-6 py-4">
                                                                                {/* {task.priority}
                                                                                 */}
                                                                                <PriorityShow status={task.priority} />
                                                                            </td>
                                                                            <td class="">
                                                                                <button className="text-blue-600 hover:text-blue-800">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                                </button>
                                                                                <button className="ml-4 text-green-600 hover:text-green-800">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                                </button>
                                                                                <button 
                                                                                onClick = {() => {handleTaskDelete(task._id, team._id)}}
                                                                                className="ml-4 text-red-600 hover:text-red-800">
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
                                        <button onClick={() => setShowCreateTask(true)} className="inline-block mt-4 ml-5 text-gray-900 font-semibold hover:underline"> + Add Task</button>
                                    </div>
                                )}



                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Analytics</h2>
                                <p className="text-gray-600">Analytics and reports will be displayed here.</p>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Team</h2>
                                {sprintDetails?.teams && sprintDetails?.teams.length > 0 ?
                                    sprintDetails?.teams.map((team, index) => (
                                        <TeamCard key={index} members={team.members} teamName={team.name} onAddMember={() => { fetchSprintDetails() }} onRemoveMember={() => { fetchSprintDetails() }} orgId={orgId} teamId={team._id} />
                                    ))
                                    : (
                                        <p className="text-gray-500">No teams available for this sprint.</p>
                                    )}
                            </div>
                        )}

                        {activeTab === 'tasks' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Tasks</h2>
                                <p className="text-gray-600">Tasks and activities will be displayed here.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {showTaskCreate && (
                <div className="fixed inset-0 flex items-center justify-center z-50 ">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setShowCreateTask(false)}
                            className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <TaskCreate onClose={() => setShowCreateTask(false)} orgId={orgId} sprintId={sprintId} onTaskCreated={() => fetchSprintDetails()} />
                    </div>
                </div>
            )}
            {showTeamCreate && (
                <div className="fixed inset-0 flex items-center justify-center z-50 ">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setShowCreateTeam(false)}
                            className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <TeamCreate onClose={() => setShowCreateTeam(false)} orgId={orgId} onTeamCreated={() => fetchSprintDetails()} />
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
                theme="light"

            />
        </div>
    )
}

export default SprintDetails