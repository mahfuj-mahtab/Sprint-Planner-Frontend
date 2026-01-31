import React, { useEffect, useState } from "react";
import MemberAddToTeam from "./MemberAddToTeam";

function TeamCard({ teamName, members, onAddMember, onRemoveMember, orgId, teamId }) {
  const [memberAddShow, setMemberAddShow] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-md w-full border-2 float-left mr-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {teamName}
          </h2>
          <p className="text-sm text-gray-500">
            {members.length} member{members.length !== 1 && "s"}
          </p>
        </div>

        <button
          onClick={() => setMemberAddShow(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add
        </button>
      </div>

      {/* Members */}
      {members.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No members yet
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((member, index) => (
            <li
              key={index}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium">
                  {member.user.fullName?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {member.user.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </p>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemoveMember(index)}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {memberAddShow && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => setMemberAddShow(false)}
              className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
            >
              &times;
            </button>
            {/* <OrgCreate onClose={() => setShowCreateOrg(false)} /> */}
            <MemberAddToTeam onClose={() => setMemberAddShow(false)} orgId={orgId}  teamId = {teamId}/>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamCard;
