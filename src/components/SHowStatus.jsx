import React from 'react'

function SHowStatus({ status }) {
    return (
        <>
            {status === 'Pending' && <span className="bg-muted text-muted-foreground border border-border text-xs font-medium px-2.5 py-0.5 rounded">Pending</span>}
            {status === 'Work In Progress' && <span className="bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-border text-xs font-medium px-2.5 py-0.5 rounded">Work In Progress</span>}
            {status === 'Completed' && <span className="bg-primary/10 text-primary border border-primary/25 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>}
            {status === 'Hold' && <span className="bg-[rgba(255,107,53,0.12)] text-[#ff6b35] border border-border text-xs font-medium px-2.5 py-0.5 rounded">Hold</span>}
            {status === 'Cancelled' && <span className="bg-destructive/10 text-destructive border border-destructive/25 text-xs font-medium px-2.5 py-0.5 rounded">Cancelled</span>}
        </>
    )
}

export default SHowStatus
