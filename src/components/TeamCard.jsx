import React, { useState } from "react";
import MemberAddToTeam from "./MemberAddToTeam";
import api from "../ApiInception";
import { toast } from 'react-toastify';
function TeamCard({ teamName, members, onAddMember, onRemoveMember, orgId, teamId , fetchOrg}) {
  const [memberAddShow, setMemberAddShow] = useState(false)
  const handleMemberRemove = (memberId) => {
    // Call API to remove member from team
    api.patch(`/api/v1/org/team/${teamId}/member/remove/${orgId}/${memberId}`).then((response) => {
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
      console.log(response.data.message)
      // Refresh team details after removal
      fetchOrg()
      if (onRemoveMember) {
        onRemoveMember();
      }
    }).catch((error) => {
      toast.error(error.response.data, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",

      });
      console.log(error.response.data);
      console.error("There was an error!", error);
    });
  }
  const handleTeamDelete = () => {
    api.delete(`/api/v1/org/team/delete/${orgId}/${teamId}`).then((response) => {
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
      console.log(response.data.message)
      // Refresh team details after removal
      if (onRemoveMember) {
        onRemoveMember();
      }
    }).catch((error) => {
      toast.error(error.response.data, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",

      });
      console.log(error.response.data);
      console.error("There was an error!", error);
    });

  }
  return (
    <div className="bg-card border border-border rounded-xl p-5 max-w-md w-full float-left mr-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {teamName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 && "s"}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setMemberAddShow(true)}
            className="flex items-center space-x-1 text-sm text-primary hover:opacity-80 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>Add</span>
          </button>
          <button className="text-[#00d4ff] hover:opacity-80" title="Edit team">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button className="text-destructive hover:opacity-80" onClick={() => { handleTeamDelete() }} title="Delete team">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Members */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No members yet
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member, index) => (
            <li
              key={index}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition"
            >
              <div className="flex items-center gap-3">

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-muted border border-border text-foreground flex items-center justify-center text-sm font-medium">
                  {member.user.fullName?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </p>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => handleMemberRemove(member.user._id)}
                className="text-xs text-muted-foreground hover:text-destructive transition"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
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
            <MemberAddToTeam onClose={() => setMemberAddShow(false)} orgId={orgId} teamId={teamId} onAddMember={() => onAddMember()} fetchOrg = {fetchOrg} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamCard;
