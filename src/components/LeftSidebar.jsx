import React, { useState, useEffect } from 'react'
import OrgCreate from './OrgCreate'
import api from '../ApiInception'
import { Link } from 'react-router'
import { Plus, Building2, User, ChevronDown, ChevronRight } from 'lucide-react'

function LeftSidebar() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [profileDetaile, setProfileDetaile] = useState()
    const [orgsExpanded, setOrgsExpanded] = useState(true)

    useEffect(() => {
        api.get('/api/v1/users/profile').then((response) => {
            console.log(response.data)
            setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }, [])

    if (!profileDetaile) {
        return <div className="p-4">Loading...</div>
    }

    return (
        <div className="h-full bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            {/* Profile Section */}
            <div className="mb-6">
                <Link to="/user/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{profileDetaile.user?.fullName || 'User'}</p>
                        <p className="text-sm text-gray-500">{profileDetaile.user?.email}</p>
                    </div>
                </Link>
            </div>

            {/* Organizations Section */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <button
                        onClick={() => setOrgsExpanded(!orgsExpanded)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
                    >
                        {orgsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Building2 className="w-5 h-5" />
                        <span>Organizations</span>
                    </button>
                    <button
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        onClick={() => setShowCreateOrg(true)}
                        title="Create Organization"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {orgsExpanded && (
                    <ul className="space-y-1 ml-6">
                        {profileDetaile.organizations.map((org) => (
                            <li key={org._id}>
                                <Link
                                    to={`/user/profile/org/${org._id}`}
                                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="truncate">{org.name}</span>
                                </Link>
                            </li>
                        ))}
                        {profileDetaile.organizations.length === 0 && (
                            <li className="px-3 py-2 text-gray-500 text-sm italic">
                                No organizations yet
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* Modal for Create Organization */}
            {showCreateOrg && (
                <div className="fixed inset-0 flex items-center justify-center z-50  bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
                        <button
                            onClick={() => setShowCreateOrg(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            &times;
                        </button>
                        <OrgCreate onClose={() => setShowCreateOrg(false)} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeftSidebar