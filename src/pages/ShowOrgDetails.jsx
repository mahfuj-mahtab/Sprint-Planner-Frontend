import React, { useState, useEffect } from 'react'
import Profileheader from '../components/profileheader'
import SprintCreate from '../components/SprintCreate'
import api from '../ApiInception'
import { useNavigate, useParams } from 'react-router'
import SprintBlock from '../components/SprintBlock'
import LeftSidebar from '../components/LeftSidebar'
import { ToastContainer, toast } from 'react-toastify';
import TaskCreate from '../components/TaskCreate'
import TeamCreate from '../components/TeamCreate'
import MembersShow from '../components/MembersShow'
import TeamCard from '../components/TeamCard'


function ShowOrgDetails() {
    const [activeTab, setActiveTab] = useState('sprint')
    const [showCreateSprint, setShowCreateSprint] = useState(false)
    const [showTeamCreate, setShowCreateTeam] = useState(false)

    const [orgDetails, setorgDetails] = useState()
    const { orgId } = useParams();
    const navigate = useNavigate()
    const tabs = [
        { id: 'sprint', label: 'Sprint' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'team', label: 'Team' },
        { id: 'member', label: 'Members' },
        // { id: 'tasks', label: 'Tasks' }
    ]
    const orgFetch = () => {
        api.get(`/api/v1/org/fetch/${orgId}`).then((response) => {
            console.log(response.data)
            setorgDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }
    useEffect(() => {
        orgFetch()
    }, [])

    const handleDeleteSprint = (sprintId) => {
        api.delete(`/api/v1/org/delete/sprint/${orgId}/${sprintId}`).then((response) => {
            console.log(response.data)
            // Refresh organization details after deletion
            return api.get(`/api/v1/org/fetch/${orgId}`);
        }).then((response) => {
            setorgDetails(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }
    const handleViewSprint = (sprintId) => {
        // Logic to view sprint details can be implemented here
        navigate(`/user/profile/org/${orgId}/sprint/${sprintId}`);
    }
    if (!orgDetails) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <div className="flex h-screen">
                {/* Left Sidebar for Task Management */}
                <div className="w-64 bg-gray-100 border-r border-gray-300 h-full">
                    <LeftSidebar />
                </div>
                {/* Right Side - Tab Content */}
                <div className="flex-1 bg-white">
                    <Profileheader />

                    {/* Tab Navigation */}
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
                                    onClick={() => setShowCreateSprint(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                                >
                                    + Create Sprint
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'sprint' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Sprints</h2>
                                {orgDetails && orgDetails.sprintDetails && orgDetails.sprintDetails.map((sprint) => (
                                    <SprintBlock
                                        key={sprint.sprint._id}
                                        sprint={sprint.sprint}
                                        onEdit={() => { }}
                                        onView={() => handleViewSprint(sprint.sprint._id)}
                                        onDelete={() => { handleDeleteSprint(sprint.sprint._id) }}
                                        fetchOrg={() => fetchOrg()}
                                        total_task={sprint?.total_tasks}
                                        completed_task={sprint?.completed_tasks}
                                    />
                                ))}
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
                                {orgDetails?.teams && orgDetails?.teams.length > 0 ?
                                    orgDetails?.teams.map((team, index) => (
                                        <TeamCard key={index} members={team.members} teamName={team.name} onAddMember={() => { orgFetch() }} onRemoveMember={() => { fetchSprintDetails() }} orgId={orgId} teamId={team._id} fetchOrg={orgFetch} />
                                    ))
                                    : (
                                        <p className="text-gray-500">No teams available for this Organizations.</p>
                                    )}
                            </div>
                        )}
                        {activeTab === 'member' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Members</h2>
                                <MembersShow members={orgDetails.organization?.members} orgId={orgId} />
                            </div>
                        )}
                        {activeTab === 'tasks' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Tasks</h2>
                                <p className="text-gray-600">Tasks and activities will be displayed here.</p>
                            </div>
                        )}
                    </div>

                    {/* Create Sprint Modal */}
                    {showCreateSprint && (
                        <div className="fixed inset-0 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
                                <button
                                    onClick={() => setShowCreateSprint(false)}
                                    className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
                                >
                                    &times;
                                </button>
                                {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                                <SprintCreate onClose={() => setShowCreateSprint(false)} orgId={orgId} />
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
                                <TeamCreate onClose={() => setShowCreateTeam(false)} orgId={orgId} onTeamCreated={() => fetchSprintDetails()} fetchOrg={() => fetchOrg()} />
                            </div>
                        </div>
                    )}
                </div>
                {/* Modal for Create Organization */}
            </div>
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

export default ShowOrgDetails