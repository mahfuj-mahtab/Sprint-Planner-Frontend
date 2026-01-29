import React, { useState,useEffect } from 'react'
import Profileheader from '../components/profileheader'
import OrgCreate from '../components/OrgCreate'
import api from '../ApiInception'
import { Link } from 'react-router'
import LeftSidebar from '../components/LeftSidebar'

function Profile() {
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
    if(!profileDetaile){
      return <div>Loading...</div>
    }
    return (
        <div className="flex h-screen">
            {/* Left Sidebar for Task Management */}
            <div className="w-64 bg-gray-100 p-5 border-r border-gray-300">
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
