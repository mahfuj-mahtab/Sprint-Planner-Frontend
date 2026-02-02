import React, { useState, useEffect } from 'react';
import api from '../ApiInception';

function TeamWiseAnalytics({ teams }) {

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Team Wise Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{team.name}</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasks Assigned:</span>
                <span className="font-medium text-blue-600">{team.tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasks Completed:</span>
                <span className="font-medium text-green-600">{team.completed_task.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate:</span>
                <span className="font-medium text-purple-600">
                  {team.tasks.length > 0 ? Math.round((team.completed_task.length / team.tasks.length) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${team.tasks.length > 0 ? (team.completed_task.length / team.tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {teams.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No teams found for this organization.
        </div>
      )}
    </div>
  );
}

export default TeamWiseAnalytics;