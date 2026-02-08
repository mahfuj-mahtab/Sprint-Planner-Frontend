import React, { useState,useEffect } from 'react'
import Profileheader from '../components/profileheader'
import OrgCreate from '../components/OrgCreate'
import api from '../ApiInception'
import { Link, useNavigate } from 'react-router'
import LeftSidebar from '../components/LeftSidebar'
import { useSelector } from 'react-redux'

function Profile() {
    const [showCreateOrg, setShowCreateOrg] = useState(false)
    const [profileDetaile, setProfileDetaile] = useState()
    const isAuthenticated = useSelector((state)=>state.auth.isAuthenticated)
    const navigate = useNavigate()
    useEffect(() => {
      if(!isAuthenticated){
        navigate("/user/login")
      }
      api.get('/api/v1/users/profile').then((response) => {
        console.log(response.data)
        setProfileDetaile(response.data);
      }).catch((error) => {
        console.error("There was an error!", error);
      });
    }, [])
    if(!profileDetaile){
      return <div>Loading...</div>
    }
    return (
        <div className="flex h-screen">
            {/* Left Sidebar for Task Management */}
            <div className="w-64 bg-gray-100 p-5 border-r border-gray-300 h-full">
             <LeftSidebar/>
            </div>
            {/* Right Side - Empty for Tasks */}
            <div className="flex-1 bg-white">
                <Profileheader />
            </div>
           
        </div>
    )
}

export default Profile
