import React, { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux';
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
import { fetchUser } from '../utils/utils';
import Logo from '@/components/branding/Logo'
function Profileheader() {
    const [profileEditShow, setProfileEditShow] = useState(false)
    // const user = userDetails?.user
    const [userDetails, setUserDetails] = useState()
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const refreshUser = async () => {
        const user = await fetchUser()
        setUserDetails(user)
    }
    const handleLogout = () => {
        api.post("/api/v1/users/logout/").then(() => {

            dispatch(logout());
            navigate('/user/login');
        }).catch((error) => {
            console.log(error)
        })
    };
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const user = await fetchUser()
            if (!cancelled) setUserDetails(user)
        })()
        return () => {
            cancelled = true
        }
    }, [])
    if(!userDetails){
        return <p>loading</p>
    }
    return (
        <div className="w-full h-14 bg-background/80 ww-glass flex items-center justify-between px-6 border-b border-border sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <Logo to="/user/profile" size="sm" />
                <div className="hidden sm:block text-sm text-muted-foreground" style={{ fontFamily: "DM Mono, monospace" }}>
                    Sprint Planner
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
                    <svg className="w-4 h-4 text-foreground/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition">
                            <span className="hidden sm:block">
                                {userDetails?.user.fullName || userDetails?.user?.email || 'User'}
                            </span>
                            <span className="sm:hidden">Account</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover text-popover-foreground border border-border">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProfileEditShow(true)}>Edit Profile</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>Team</DropdownMenuItem>
                            <DropdownMenuItem>Subscription</DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-destructive transition">
                    Logout
                </button>
            </div>
            {profileEditShow && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
                        <button
                            onClick={() => setProfileEditShow(false)}
                            className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
                        >
                            &times;
                        </button>
                        {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                        <UserEdit onClose={() => setProfileEditShow(false)} userDetails={userDetails} fetchUser={() => refreshUser()} />
                    </div>
                </div>
            )}
        </div>



    )
}

export default Profileheader
