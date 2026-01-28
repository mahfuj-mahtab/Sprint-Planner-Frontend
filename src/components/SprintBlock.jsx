import React from 'react'

function SprintBlock({ sprint = {}, onEdit, onDelete, onView }) {
  const {
    name = 'Sprint 1',
    startDate = '23th Jan 2025',
    endDate = '30th Jan 2025',
    isActive = true,
    tasks = 10,
    completedTasks = 10,
    _id = null
  } = sprint

  const progressPercentage = tasks > 0 ? (completedTasks / tasks) * 100 : 0

  const getStatusBadgeColor = () => {
    switch(isActive) {
      case true : return 'bg-green-100 text-green-800'
      case false: return 'bg-blue-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const convertDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, options);
  }

  return (
    <div className='w-full bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 mb-3'>
        <div className="grid grid-cols-4 gap-4 items-center">
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
                    <p className="text-xs text-gray-600 mt-1">{completedTasks}/{tasks} tasks</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
                {onView && (
                    <button
                        onClick={() => onView(_id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                    >
                        View
                    </button>
                )}
                {onEdit && (
                    <button
                        onClick={() => onEdit(_id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                    >
                        Edit
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(_id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}

export default SprintBlock