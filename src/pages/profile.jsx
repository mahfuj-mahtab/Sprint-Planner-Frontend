import React, { useState, useEffect } from 'react'
import Profileheader from '../components/profileheader'
import { useNavigate } from 'react-router'
import LeftSidebar from '../components/LeftSidebar'
import { useSelector } from 'react-redux'
import { fetchUser } from '../utils/utils'
import { Skeleton, Spinner } from '../components/ui/Loading'
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
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-sidebar border-r border-border h-full">
          <LeftSidebar />
        </div>
        <div className="flex-1 bg-background overflow-y-auto">
          <Profileheader />
          <div className="p-6">
            <div className="max-w-3xl">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Spinner className="mt-4" label="Loading profile…" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
