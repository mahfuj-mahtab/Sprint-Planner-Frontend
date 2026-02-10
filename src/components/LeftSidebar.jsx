import React, { useState, useEffect } from 'react'
import OrgCreate from './OrgCreate'
import api from '../ApiInception'
import { Link } from 'react-router'
import { Plus, Building2, User, ChevronDown, ChevronRight } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify';
import OrgEdit from './OrgEdit'

function LeftSidebar() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [profileDetaile, setProfileDetaile] = useState()
    const [orgsExpanded, setOrgsExpanded] = useState(true)
    const [orgCrudOption, setOrgCrudOption] = useState(false)
    const [openOrgMenu, setOpenOrgMenu] = useState(null);
    const [orgEditPopup, setOrgEditPopup] = useState(false)
    const [editOrgInfo, setEditOrgInfo] = useState({})

    const fetchOrg = () => {

        api.get('/api/v1/users/profile').then((response) => {
            console.log(response.data)
            setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }
    useEffect(() => {
        fetchOrg()
    }, [])

    const handleOrgDelete = (org_id) => {
        api.delete(`/api/v1/users/org/delete/${org_id}`).then((response) => {
            console.log(response)
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
            fetchOrg()


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
    const handleOrgEdit = (org) => {
        setOrgEditPopup(true)
        setEditOrgInfo({
            name: org?.name,
            description: org?.description,
            id: org?._id
        })
    }
    if (!profileDetaile) {
        return <div className="p-4">Loading...</div>
    }

    return (
        <div className="h-full bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto">
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
                            <li
                                key={org._id}
                                className="relative flex items-center"
                            >
                                <Link
                                    to={`/user/profile/org/${org._id}`}
                                    className="w-[93%] mr-3 flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="truncate">{org.name}</span>
                                </Link>

                                {/* Three dots button */}
                                <button
                                    onClick={() =>
                                        setOpenOrgMenu(openOrgMenu === org._id ? null : org._id)
                                    }
                                    className="p-1 rounded hover:bg-gray-200"
                                >
                                    <svg
                                        width="4"
                                        height="16"
                                        viewBox="0 0 4 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle cx="2" cy="4" r="1.5" fill="currentColor" />
                                        <circle cx="2" cy="12" r="1.5" fill="currentColor" />
                                    </svg>
                                </button>

                                {/* Dropdown */}
                                {openOrgMenu === org._id && (
                                    <div className="absolute right-0 top-10 z-50 w-28 rounded-md bg-white shadow-lg border">
                                        <ul className="py-1 text-sm">
                                            <li onClick={() => handleOrgEdit(org)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                                Edit

                                            </li>
                                            <li onClick={() => handleOrgDelete(org._id)} className="px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer">
                                                Delete
                                            </li>
                                        </ul>
                                    </div>
                                )}
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
            {
                showCreateOrg && (
                    <div className="fixed inset-0 flex items-center justify-center z-50  bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
                            <button
                                onClick={() => setShowCreateOrg(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                            <OrgCreate onClose={() => setShowCreateOrg(false)} fetchOrg={() => fetchOrg()} />
                        </div>
                    </div>
                )
            }
            {
                orgEditPopup && (
                    <div className="fixed inset-0 flex items-center justify-center z-50  bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
                            <button
                                onClick={() => setOrgEditPopup(false)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                            <OrgEdit onClose={() => setOrgEditPopup(false)} fetchOrg={() => fetchOrg()} org={editOrgInfo} popupClose={()=>setOpenOrgMenu(null)} />
                        </div>
                    </div>
                )
            }
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
        </div >
    )
}

export default LeftSidebar