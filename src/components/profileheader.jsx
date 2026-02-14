import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router';
import api from '../ApiInception';
// import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import UserEdit from './UserEdit';
function Profileheader(fetchUser,userDetails) {
    const [profileEditShow, setProfileEditShow] = useState(false)
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        api.post("/api/v1/users/logout/").then(() => {

            dispatch(logout());
            navigate('/user/login');
        }).catch((error) => {
            console.log(error)
        })
    };

    return (
        <div className="w-full h-14 bg-gray-50 flex items-center justify-between px-6 border-b-2">
            <div className="text-dark font-medium text-sm">
                Sprint Planner
            </div>

            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button variant="outline"> <span className="text-dark text-sm hidden sm:block"> {user?.fullName || user?.email || 'User'} </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>
                                <button onClick={()=>setProfileEditShow(true)}>Edit Profile</button>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Team</DropdownMenuItem>
                            <DropdownMenuItem>Subscription</DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>


                <button
                    onClick={handleLogout}
                    className="text-dark hover:text-red-400 text-sm transition"
                >
                    Logout
                </button>
            </div>
            {profileEditShow && (
                <div className="fixed inset-0 flex items-center justify-center z-50 ">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setProfileEditShow(false)}
                            className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <UserEdit onClose={() => setProfileEditShow(false)} userDetails={userDetails} fetchUser={() => fetchUser()} />
                    </div>
                </div>
            )}
        </div>



    )
}

export default Profileheader
