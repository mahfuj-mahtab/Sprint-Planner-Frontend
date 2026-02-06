import React from 'react'
import MemberCard from './MemberCard'

function MembersShow({ members,orgId }) {
    return (
        <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {members.length != 0 ?

                members.map((member) => (

                    <MemberCard name={member.user?.fullName} id = {member.user?._id} role = {member.user?.role} orgId={orgId}/>
                ))

                :
                <p>No Members Available</p>
            }


        </div>
    )
}

export default MembersShow