import React from 'react'

function SHowStatus({ status }) {
    return (
        <>
            {status === 'Pending' && <span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Pending</span>}
            {status === 'Work In Progress' && <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Work In Progress</span>}
            {status === 'Completed' && <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>}
            {status === 'Hold' && <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Hold</span>}
            {status === 'Cancelled' && <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Cancelled</span>}
        </>
    )
}

export default SHowStatus