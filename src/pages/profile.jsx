import React, { useState } from 'react'
import Profileheader from '../components/profileheader'
import OrgCreate from '../components/OrgCreate'

function Profile() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)

    return (
        <div className="flex h-screen">
            {/* Left Sidebar for Task Management */}
            <div className="w-64 bg-gray-100 p-5 border-r border-gray-300">
                <div className="flex justify-between items-center w-full h-10 mb-4">
                    <h3 className="text-lg font-semibold">Organizations</h3>
                    <button
                        className="text-2xl text-blue-600 hover:text-blue-800 font-bold"
                        onClick={() => setShowCreateOrg(true)}
                    >
                        +
                    </button>
                </div>
                <ul className="list-none p-0">
                    <li className="mb-2">
                        <a href="#" className="text-gray-800 no-underline hover:text-blue-600">All Tasks</a>
                    </li>
                    <li className="mb-2">
                        <a href="#" className="text-gray-800 no-underline hover:text-blue-600">Pending Tasks</a>
                    </li>
                    <li className="mb-2">
                        <a href="#" className="text-gray-800 no-underline hover:text-blue-600">Completed Tasks</a>
                    </li>
                    <li className="mb-2">
                        <a href="#" className="text-gray-800 no-underline hover:text-blue-600">Assigned to Me</a>
                    </li>
                </ul>
            </div>
            {/* Right Side - Empty for Tasks */}
            <div className="flex-1 bg-white">
                <Profileheader />
            </div>
            {/* Modal for Create Organization */}
            {showCreateOrg && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
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

export default Profile
