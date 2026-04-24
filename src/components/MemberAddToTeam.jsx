import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
import MemberAddToOrg from './MemberAddToOrg';
import { Skeleton, Spinner } from './ui/Loading';
function MemberAddToTeam({ onClose, orgId, teamId, onAddMember }) {
    const [orgDetails, setOrgDetails] = useState()
    const [memberAddShow, setMemberAddShow] = useState(false)
    const {
        register,
        handleSubmit,
    } = useForm()
    const onSubmit = (data) => {
        console.log(data)
        api.patch(`/api/v1/org/team/${teamId}/member/add/${orgId}`, data).then((response) => {
            console.log(response.data.message)
            onClose();
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
            if (onAddMember) {
                onAddMember();
            }
        }).catch((error) => {
            console.log(error.response.data);
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
            console.error("There was an error!", error);
        });
    }
    const fetchOrgDetails = useCallback(() => {
        api.get(`/api/v1/org/fetch/${orgId}`).then((response) => {
            console.log(response.data)
            setOrgDetails(response.data);
            // setProfileDetaile(response.data);
        }).catch((error) => {
            console.error("There was an error!", error);
        });
    }, [orgId])
    useEffect(() => {
        fetchOrgDetails()
    }, [fetchOrgDetails])
    if (!orgDetails) {
        return (
            <div className="px-0 mx-auto max-w-2xl">
                <div className="mb-4">
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="space-y-4">
                    <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Spinner label="Loading members…" className="pt-2" />
                </div>
            </div>
        )
    }
    return (
        <div><section className="bg-transparent">
            <div className="px-0 mx-auto max-w-2xl">
                <h2 className="mb-4 text-xl font-bold ww-heading">Add a member</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="memberId" className="ww-label">Member</label>
                            <select name="memberId" id="memberId" className="ww-input" required="" {...register("user", { required: true })}>
                                <option>Select Member</option>
                                {orgDetails && orgDetails.organization.members.map((member) => (
                                    <option value={member.user?._id}>{member.user?.fullName}</option>
                                ))}
                            </select>
                            <button type="button" className="mt-2 text-sm font-semibold text-primary hover:opacity-80" onClick={() => setMemberAddShow(true)}>
                                + Add Member
                            </button>
                        </div>

                        <div className="sm:col-span-2 mt-[-30px]">
                            <label htmlFor="role" className="ww-label">Role</label>
                            <select name="role" id="role" className="ww-input" required="" {...register("role", { required: true })}>
                                <option value="">Select a role</option>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>


                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Add Member
                    </button>
                </form>
                {memberAddShow && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
                            <button
                                onClick={() => setMemberAddShow(false)}
                                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
                            >
                                &times;
                            </button>
                            {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
                            <MemberAddToOrg onClose={() => setMemberAddShow(false)} orgId={orgId} onTeamCreated={() => onAddMember()} fetchOrgDetails={fetchOrgDetails} />
                        </div>
                    </div>
                )}
            </div>
        </section></div>
    )
}

export default MemberAddToTeam
