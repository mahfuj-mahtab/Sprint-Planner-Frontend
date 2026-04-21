import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ToastContainer } from "react-toastify";
import api from "../ApiInception";
import LeftSidebar from "../components/LeftSidebar";
import MembersShow from "../components/MembersShow";
import Profileheader from "../components/profileheader";
import ProjectCreate from "../components/ProjectCreate";
import SprintBlock from "../components/SprintBlock";
import SprintCreate from "../components/SprintCreate";
import SprintEdit from "../components/SprintEdit";
import TeamCard from "../components/TeamCard";
import TeamCreate from "../components/TeamCreate";
import { useIsMobile } from "../components/CheckMobile";

function ShowOrgDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("sprints");
  const [showLeftSideBar, setShowLeftSideBar] = useState(true);

  const [orgDetails, setOrgDetails] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showTeamCreate, setShowTeamCreate] = useState(false);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [showSprintEdit, setShowSprintEdit] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState(null);

  const tabs = useMemo(
    () => [
      { id: "sprints", label: "Sprints" },
      { id: "team", label: "Team" },
      { id: "member", label: "Members" },
    ],
    []
  );

  const orgFetch = (projectId = selectedProjectId) => {
    api
      .get(`/api/v1/org/fetch/${orgId}`, { params: projectId ? { projectId } : undefined })
      .then((response) => {
        setOrgDetails(response.data);
        setProjects(response.data.projects || []);
        setSelectedProjectId(response.data.selectedProjectId || projectId || null);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };

  useEffect(() => {
    if (isMobile) setShowLeftSideBar(false);
    orgFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab("sprints");
    orgFetch(projectId);
  };

  const handleDeleteSprint = (sprintId) => {
    api
      .delete(`/api/v1/org/delete/sprint/${orgId}/${sprintId}`)
      .then(() => orgFetch())
      .catch((error) => console.error("There was an error!", error));
  };

  const handleViewSprint = (sprintId) => {
    navigate(`/user/profile/org/${orgId}/project/${selectedProjectId}/sprint/${sprintId}`);
  };

  if (!orgDetails) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      {showLeftSideBar && (
        <div className="w-64 bg-sidebar border-r border-border h-full">
          <LeftSidebar />
        </div>
      )}

      <div className="flex-1 bg-background overflow-y-auto">
        <Profileheader />

        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6">
            <div className="flex gap-6 items-center">
              <button
                onClick={() => setShowLeftSideBar((prev) => !prev)}
                className="py-4 px-2 font-medium text-sm transition-colors border-b-2 text-muted-foreground border-transparent hover:text-foreground"
                title="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                  <path d="M9 4v16" strokeWidth="2" />
                  {showLeftSideBar ? (
                    <path d="M13 12l3-3m0 0l-3-3m3 3H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M11 12l-3-3m0 0l3-3m-3 3h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>

              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 font-medium text-sm tracking-tight transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "text-foreground border-foreground"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowProjectCreate(true)}
                className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors"
              >
                + Project
              </button>
              <button
                onClick={() => setShowTeamCreate(true)}
                disabled={!selectedProjectId}
                className="bg-foreground hover:opacity-90 disabled:opacity-40 text-background text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
              >
                + Team
              </button>
              <button
                onClick={() => setShowCreateSprint(true)}
                disabled={!selectedProjectId}
                className="bg-foreground hover:opacity-90 disabled:opacity-40 text-background text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
              >
                + Sprint
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-background">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelectProject(p._id)}
                  className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedProjectId === p._id
                      ? "bg-muted text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title={p.name}
                >
                  <span className="font-mono">{p.name}</span>
                </button>
              ))}
              {projects.length === 0 && <div className="text-sm text-muted-foreground">No projects yet.</div>}
            </div>
            <div className="text-sm text-muted-foreground hidden lg:block">
              {selectedProject ? (
                <span>
                  Project: <span className="font-mono text-foreground">{selectedProject.name}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:p-6 p-2">
          {activeTab === "sprints" && (
            <div>
              <h2 className="lg:text-2xl text-lg font-semibold mb-4">
                Sprints{" "}
                {selectedProject ? (
                  <span className="text-muted-foreground font-normal">
                    / <span className="font-mono">{selectedProject.name}</span>
                  </span>
                ) : null}
              </h2>

              {orgDetails?.sprintDetails?.length > 0 ? (
                orgDetails.sprintDetails.map((sprint) => (
                  <SprintBlock
                    key={sprint.sprint._id}
                    sprint={sprint.sprint}
                    onEdit={() => {
                      setEditingSprintId(sprint.sprint._id);
                      setShowSprintEdit(true);
                    }}
                    onView={() => handleViewSprint(sprint.sprint._id)}
                    onDelete={() => handleDeleteSprint(sprint.sprint._id)}
                    total_task={sprint?.total_tasks}
                    completed_task={sprint?.completed_tasks}
                  />
                ))
              ) : (
                <div className="border border-dashed border-border rounded-lg p-6 bg-card">
                  <div className="text-sm text-muted-foreground">No sprints in this project yet.</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "team" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Team{" "}
                {selectedProject ? (
                  <span className="text-muted-foreground font-normal">
                    / <span className="font-mono">{selectedProject.name}</span>
                  </span>
                ) : null}
              </h2>
              {orgDetails?.teams?.length > 0 ? (
                orgDetails.teams.map((team) => (
                  <TeamCard
                    key={team._id}
                    members={team.members}
                    teamName={team.name}
                    onAddMember={() => orgFetch()}
                    orgId={orgId}
                    teamId={team._id}
                    fetchOrg={() => orgFetch()}
                  />
                ))
              ) : (
                <p className="text-muted-foreground">No teams available for this project.</p>
              )}
            </div>
          )}

          {activeTab === "member" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Members</h2>
              <MembersShow members={orgDetails.organization?.members} orgId={orgId} />
            </div>
          )}
        </div>

        {showCreateSprint && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowCreateSprint(false)}
                className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
              >
                &times;
              </button>
              <SprintCreate onClose={() => { setShowCreateSprint(false); orgFetch(); }} orgId={orgId} projectId={selectedProjectId} />
            </div>
          </div>
        )}

        {showTeamCreate && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowTeamCreate(false)}
                className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
              >
                &times;
              </button>
              <TeamCreate onClose={() => { setShowTeamCreate(false); orgFetch(); }} orgId={orgId} projectId={selectedProjectId} fetchOrg={() => orgFetch()} />
            </div>
          </div>
        )}

        {showProjectCreate && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 relative">
              <button
                onClick={() => setShowProjectCreate(false)}
                className="absolute top-2 right-4 font-bold text-gray-500 hover:text-gray-700 text-3xl"
              >
                &times;
              </button>
              <ProjectCreate
                onClose={() => setShowProjectCreate(false)}
                orgId={orgId}
                onCreated={(project) => {
                  setShowProjectCreate(false);
                  if (project?._id) handleSelectProject(project._id);
                  else orgFetch();
                }}
              />
            </div>
          </div>
        )}

        {showSprintEdit && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowSprintEdit(false)}
                className="absolute top-2 right-5 font-bold text-gray-500 hover:text-gray-700 text-4xl"
              >
                &times;
              </button>
              <SprintEdit onClose={() => setShowSprintEdit(false)} orgId={orgId} sprintId={editingSprintId} orgFetch={() => orgFetch()} />
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="light" />
      </div>
    </div>
  );
}

export default ShowOrgDetails;

