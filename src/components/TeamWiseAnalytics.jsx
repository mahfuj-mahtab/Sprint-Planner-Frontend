import React from 'react';

function TeamWiseAnalytics({ teams }) {

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold ww-heading mb-6">Team Wise Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="bg-card border border-border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">{team.name}</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tasks Assigned:</span>
                <span className="font-medium text-foreground">{team.tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tasks Completed:</span>
                <span className="font-medium text-primary">{team.completed_task.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completion Rate:</span>
                <span className="font-medium text-foreground">
                  {team.tasks.length > 0 ? Math.round((team.completed_task.length / team.tasks.length) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${team.tasks.length > 0 ? (team.completed_task.length / team.tasks.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {teams.length === 0 && (
        <div className="text-center text-muted-foreground mt-10">
          No teams found for this organization.
        </div>
      )}
    </div>
  );
}

export default TeamWiseAnalytics;
