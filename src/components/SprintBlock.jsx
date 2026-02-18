import React from 'react'
import { convertDate } from '../utils/utils'
function SprintBlock({ sprint = {}, onEdit, onDelete, onView, total_task, completed_task }) {
    const {
        name = 'Sprint 1',
        startDate = '23th Jan 2025',
        endDate = '30th Jan 2025',
        isActive = true,
        tasks = 10,
        completedTasks = 10,
        _id = null
    } = sprint

    const progressPercentage = total_task > 0 ? (completed_task / total_task) * 100 : 0

    const getStatusBadgeColor = () => {
        switch (isActive) {
            case true: return 'bg-green-100 text-green-800'
            case false: return 'bg-blue-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }


    return (
        <div className='w-full bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 mb-3'>
            <div className="grid grid-cols-4 gap-4  items-center">
                {/* Sprint Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600">Sprint Name</h3>
                    <p className="text-lg font-bold text-gray-800">{name}</p>
                </div>

                {/* Dates */}
                <div>
                    <div className="mb-2">
                        <h4 className="text-xs font-semibold text-gray-600">Start Date</h4>
                        <p className="text-sm text-gray-700">{convertDate(startDate)}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-gray-600">End Date</h4>
                        <p className="text-sm text-gray-700">{convertDate(endDate)}</p>
                    </div>
                </div>

                {/* Status & Progress */}
                <div>
                    <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor()}`}>
                            {isActive ? 'Active' : 'In Active'}
                        </span>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-gray-600">Progress</h4>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{completed_task}/{total_task} tasks</p>
                    </div>
                </div>


                {/* Action Buttons */}
                <div className="flex gap-2 justify-end lg:mr-10">
                    {onView && (
                       
                    <button className="text-blue-600 hover:text-blue-800"  onClick = {() => onView(_id)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    )}
                    {onEdit && (
                        <button className="text-green-600 hover:text-green-800" onClick={() => onEdit(_id)}>

                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                    )}
                    {onDelete && (

                        <button className="text-red-600 hover:text-red-800" onClick={() => onDelete(_id)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SprintBlock