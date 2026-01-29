import React, { useState, useEffect } from 'react'
import OrgCreate from './OrgCreate'
import api from '../ApiInception'
import { Link } from 'react-router'
function LeftSidebar() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [profileDetaile, setProfileDetaile] = useState()
    useEffect(() => {
        api.get('/api/v1/users/profile').then((response) => {
            console.log(response.data)
            setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }, [])
    if (!profileDetaile) {
        return <div>Loading...</div>
    }
    return (
        <div>
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
                {profileDetaile.organizations.map((org) => (
                    <li key={org._id} className="mb-2">
                        <Link to={`/user/profile/org/${org._id}`} className="text-gray-800 no-underline hover:text-blue-600">{org.name}</Link>
                    </li>
                ))}


            </ul>
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

export default LeftSidebar