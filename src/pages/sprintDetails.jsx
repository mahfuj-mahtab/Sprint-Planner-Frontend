import React, { useState, useEffect } from 'react'
import LeftSidebar from '../components/LeftSidebar'
import Profileheader from '../components/profileheader'
import { Link, useParams } from 'react-router'
import api from '../ApiInception'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import TaskCreate from '../components/TaskCreate'
function SprintDetails() {
    const [activeTab, setActiveTab] = useState('sprint')
    const [showTaskCreate, setShowCreateTask] = useState(false)
    const { orgId, sprintId } = useParams();
    const [orgDetails, setorgDetails] = useState()
    const [sprintDetails, setSprintDetails] = useState()
    const tabs = [
        { id: 'sprint', label: 'Sprint' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'team', label: 'Team' },
        { id: 'tasks', label: 'Tasks' }
    ]
    useEffect(() => {
        api.get(`/api/v1/org/sprint/details/${sprintId}`).then((response) => {
            console.log(response.data)
            setSprintDetails(response.data);
            // setorgDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }, [])
    if (!sprintDetails) {
        return <div>Loading...</div>
    }
    return (
        <div>
            <div className="flex h-screen">
                {/* Left Sidebar for Task Management */}
                <div className="w-64 bg-gray-100 p-5 border-r border-gray-300">
                    <LeftSidebar />
                </div>
                {/* Right Side - Empty for Tasks */}
                <div className="flex-1 bg-white">
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
                            <button
                                onClick={() => setShowCreateTask(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                            >
                                + Create Task
                            </button>
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
                                                                <thead className="text-sm text-body bg-neutral-secondary-soft border-b rounded-base border-default">
                                                                    <tr>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            Task Title
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            Assignee
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            Start Date
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            End Date
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            Status
                                                                        </th>
                                                                        <th scope="col" class="px-6 py-3 font-medium">
                                                                            Priority
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr class="bg-neutral-primary border-b border-default">
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
                                                                            {/* <span class="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Low</span>
                                                                   <span class="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium</span> */}
                                                                        </td>
                                                                    </tr>

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
                                <p className="text-gray-600">Team members and details will be displayed here.</p>
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
                        <TaskCreate onClose={() => setShowCreateTask(false)} orgId={orgId} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default SprintDetails