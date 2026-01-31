import React from 'react'

function PriorityShow({ status }) {
    return (
        <>
            {status === 'Low' && <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Low</span>}
            {status === 'Medium' && <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium</span>}
            {status === 'High' && <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">High</span>}
        </>

        
    )
}

export default PriorityShow