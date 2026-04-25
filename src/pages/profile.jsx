import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { fetchUser } from '../utils/utils'
import { Skeleton, Spinner } from '../components/ui/Loading'
import DashboardLayout from "@/components/layout/DashboardLayout";
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
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-3xl">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Spinner className="mt-4" label="Loading profile…" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm text-muted-foreground">Signed in as</div>
            <div className="mt-1 text-xl font-semibold ww-heading">{profileDetaile.user?.fullName || "User"}</div>
            <div className="mt-1 text-sm text-muted-foreground">{profileDetaile.user?.email}</div>
            <div className="mt-6 text-sm text-muted-foreground">
              Pick an organization from the sidebar to view projects and sprints.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
