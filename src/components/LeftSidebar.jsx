import React, { useState, useEffect } from 'react'
import OrgCreate from './OrgCreate'
import api from '../ApiInception'
import { Link } from 'react-router'
import { Plus, Building2, User, ChevronDown, ChevronRight, CheckSquare, ListChecks } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify';
import OrgEdit from './OrgEdit'
import { Skeleton } from './ui/Loading'

function LeftSidebar() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [profileDetaile, setProfileDetaile] = useState()
    const [orgsExpanded, setOrgsExpanded] = useState(true)
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
                theme: "dark",

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
                theme: "dark",

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
        return (
            <div className="h-full bg-sidebar border-r border-border p-2 overflow-y-auto">
                <div className="mb-6 p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </div>

                <div className="mb-6 p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-card">
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full bg-sidebar border-r border-border p-2 overflow-y-auto">
            {/* Profile Section */}
            <div className="mb-6">
                <Link to="/user/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{profileDetaile.user?.fullName || 'User'}</p>
                        <p className="text-sm text-muted-foreground">{profileDetaile.user?.email}</p>
                    </div>
                </Link>
            </div>

            {/* My Todos Section */}
            <div className="mb-6">
                <Link to="/user/todos" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <CheckSquare className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">My Tasks</p>
                        <p className="text-sm text-muted-foreground">Daily to-dos</p>
                    </div>
                </Link>
            </div>

            {/* Assigned Sprint Tasks */}
            <div className="mb-6">
                <Link to="/user/assigned-tasks" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">My Task</p>
                        <p className="text-sm text-muted-foreground">Sprint assignments</p>
                    </div>
                </Link>
            </div>

            {/* Organizations Section */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <button
                        onClick={() => setOrgsExpanded(!orgsExpanded)}
                        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground font-medium"
                    >
                        {orgsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Building2 className="w-5 h-5" />
                        <span>Organizations</span>
                    </button>
                    <button
                        className="p-1 text-foreground hover:bg-muted rounded transition-colors"
                        onClick={() => setShowCreateOrg(true)}
                        title="Create Organization"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {orgsExpanded && (
                    <ul className="space-y-1 ml-6">
                        {profileDetaile.organizations.map((org) => {
                            const isOwner = org.owner_id === profileDetaile.user._id
                                || org.owner_id?._id === profileDetaile.user._id;

                            return (
                                <li key={org._id} className="relative flex items-center">
                                    <Link
                                        to={`/user/profile/org/${org._id}`}
                                        className="w-[93%] mr-3 flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                    >
                                        <Building2 className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{org.name}</span>
                                        {/* Badge */}
                                        <span className={`ml-auto shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium
                            ${isOwner
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted text-muted-foreground'}`}>
                                            {isOwner ? 'Owner' : 'Member'}
                                        </span>
                                    </Link>

                                    {/* Only show three-dot menu for owners */}
                                    {isOwner && (
                                        <button
                                            onClick={() =>
                                                setOpenOrgMenu(openOrgMenu === org._id ? null : org._id)
                                            }
                                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="2" cy="4" r="1.5" fill="currentColor" />
                                                <circle cx="2" cy="12" r="1.5" fill="currentColor" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Dropdown (only rendered for owners anyway) */}
                                    {openOrgMenu === org._id && (
                                        <div className="absolute right-0 top-10 z-50 w-32 rounded-xl bg-popover text-popover-foreground shadow-lg border border-border">
                                            <ul className="py-1 text-sm">
                                                <li onClick={() => handleOrgEdit(org)} className="px-3 py-2 hover:bg-muted cursor-pointer">
                                                    Edit
                                                </li>
                                                <li onClick={() => handleOrgDelete(org._id)} className="px-3 py-2 text-destructive hover:bg-muted cursor-pointer">
                                                    Delete
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            );
                        })}

                        {profileDetaile.organizations.length === 0 && (
                            <li className="px-3 py-2 text-muted-foreground text-sm italic">
                                No organizations yet
                            </li>
                        )}
                    </ul>
                )}
            </div>

            {/* Modal for Create Organization */}
            {
                showCreateOrg && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-md w-full mx-4 relative">
                            <button
                                onClick={() => setShowCreateOrg(false)}
                                className="absolute top-2 right-3 text-muted-foreground hover:text-foreground text-2xl"
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
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-md w-full mx-4 relative">
                            <button
                                onClick={() => setOrgEditPopup(false)}
                                className="absolute top-2 right-3 text-muted-foreground hover:text-foreground text-2xl"
                            >
                                &times;
                            </button>
                            <OrgEdit onClose={() => setOrgEditPopup(false)} fetchOrg={() => fetchOrg()} org={editOrgInfo} popupClose={() => setOpenOrgMenu(null)} />
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
                theme="dark"

            />
        </div >
    )
}

export default LeftSidebar
