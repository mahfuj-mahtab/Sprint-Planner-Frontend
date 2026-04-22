import React, { useState, useEffect } from 'react'
import Profileheader from '../components/profileheader'
import { useNavigate } from 'react-router'
import LeftSidebar from '../components/LeftSidebar'
import { useSelector } from 'react-redux'
import { fetchUser } from '../utils/utils'
function Profile() {
  const [profileDetaile, setProfileDetaile] = useState()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/user/login")
      return
    }
    let cancelled = false
    ;(async () => {
      const user = await fetchUser()
      if (!cancelled) setProfileDetaile(user)
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, navigate])
  if (!profileDetaile) {
    return <div>Loading...</div>
  }
  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar for Task Management */}
      <div className="w-64 bg-sidebar border-r border-border h-full">
        <LeftSidebar />
      </div>
      {/* Right Side - Empty for Tasks */}
      <div className="flex-1 bg-background overflow-y-auto">
        <Profileheader />
      </div>

    </div>
  )
}

export default Profile
