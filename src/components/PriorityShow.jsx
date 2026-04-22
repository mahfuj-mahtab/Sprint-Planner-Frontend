import React from 'react'

function PriorityShow({ status }) {
    return (
        <>
            {status === 'Low' && <span className="bg-muted text-muted-foreground border border-border text-xs font-medium px-2.5 py-0.5 rounded">Low</span>}
            {status === 'Medium' && <span className="bg-[rgba(255,107,53,0.12)] text-[#ff6b35] border border-border text-xs font-medium px-2.5 py-0.5 rounded">Medium</span>}
            {status === 'High' && <span className="bg-destructive/10 text-destructive border border-destructive/25 text-xs font-medium px-2.5 py-0.5 rounded">High</span>}
        </>
    )
}

export default PriorityShow
