import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ToastContainer, toast } from "react-toastify";
import api from "../ApiInception";
import MembersShow from "../components/MembersShow";
import ProjectCreate from "../components/ProjectCreate";
import ProjectEdit from "../components/ProjectEdit";
import FeatureAnalysis from "../components/FeatureAnalysis";
import ProjectDocs from "../components/ProjectDocs";
import ProjectVersions from "../components/ProjectVersions";
import SprintBlock from "../components/SprintBlock";
import SprintCreate from "../components/SprintCreate";
import SprintEdit from "../components/SprintEdit";
import TeamCard from "../components/TeamCard";
import TeamCreate from "../components/TeamCreate";
import { ArrowLeft, BarChart3, Pencil, Trash2, Users, Wallet } from "lucide-react";
import { Link } from "react-router";
import DashboardLayout from "@/components/layout/DashboardLayout";

function ShowOrgDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState("projects"); // "projects" | "details"
  const [activeTab, setActiveTab] = useState("sprints");

  const [orgDetails, setOrgDetails] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showTeamCreate, setShowTeamCreate] = useState(false);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [showProjectEdit, setShowProjectEdit] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showSprintEdit, setShowSprintEdit] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState(null);

  const tabs = useMemo(
    () => [
      { id: "sprints", label: "Sprints" },
      { id: "features", label: "Features" },
      { id: "versions", label: "Versions" },
      { id: "docs", label: "Docs" },
      { id: "team", label: "Team" },
      { id: "member", label: "Members" },
    ],
    []
  );

  const orgFetch = (projectId) => {
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
    // Reset view/state when switching organizations to avoid leaking previous org's selected project
    setView("projects");
    setActiveTab("sprints");
    setShowCreateSprint(false);
    setShowTeamCreate(false);
    setShowProjectCreate(false);
    setShowProjectEdit(false);
    setShowSprintEdit(false);
    setEditingSprintId(null);
    setEditingProject(null);
    setSelectedProjectId(null);
    setProjects([]);
    setOrgDetails(null);
    const sp = new URLSearchParams(location.search);
    const qView = sp.get("view");
    const qProjectId = sp.get("projectId");
    const qTab = sp.get("tab");

    if (qView === "details" && qProjectId) {
      setView("details");
      setActiveTab(qTab || "sprints");
      orgFetch(qProjectId);
    } else {
      orgFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const qView = sp.get("view");
    const qProjectId = sp.get("projectId");
    const qTab = sp.get("tab");

    if (qView === "details" && qProjectId) {
      setView("details");
      if (qTab) setActiveTab(qTab);
      if (qProjectId !== selectedProjectId) handleSelectProject(qProjectId);
    } else if (!qView && view !== "projects") {
      setView("projects");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab("sprints");
    orgFetch(projectId);
  };

  const handleOpenProjectDetails = (projectId) => {
    navigate(`/user/profile/org/${orgId}?view=details&projectId=${projectId}&tab=sprints`);
  };

  const handleBackToProjects = () => {
    setView("projects");
    setActiveTab("sprints");
    setShowCreateSprint(false);
    setShowTeamCreate(false);
    setShowProjectCreate(false);
    setShowProjectEdit(false);
    setShowSprintEdit(false);
    setEditingSprintId(null);
    setEditingProject(null);
    navigate(`/user/profile/org/${orgId}`);
  };

  const handleDeleteProject = (projectId) => {
    if (!window.confirm("Delete this project? This will also delete its sprints, teams, and tasks.")) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}`)
      .then((response) => {
        toast.success(response.data.message || "Project deleted", { position: "top-right", autoClose: 4000, theme: "dark" });
        if (selectedProjectId === projectId) setSelectedProjectId(null);
        if (view === "details" && selectedProjectId === projectId) setView("projects");
        orgFetch();
      })
      .catch((error) => {
        const message = error?.response?.data?.message || "Failed to delete project";
        toast.error(message, { position: "top-right", autoClose: 5000, theme: "dark" });
      });
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

  const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
  );

  if (!orgDetails) {
    return (
      <DashboardLayout>
        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <div className="lg:p-6 p-2">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 w-full">
                  <Skeleton className="h-5 w-52 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="dark" />
      </DashboardLayout>
    );
  }

  const orgName = orgDetails?.organization?.name || "Organization";

  return (
    <DashboardLayout>
      {view === "details" ? (
        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={handleBackToProjects}
                className="shrink-0 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Back to projects"
              >
                <ArrowLeft className="w-4 h-4" />
                Projects
              </button>

              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (selectedProjectId) {
                          navigate(`/user/profile/org/${orgId}?view=details&projectId=${selectedProjectId}&tab=${tab.id}`, { replace: true });
                        }
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="hidden lg:block text-sm text-muted-foreground mr-2">
                {selectedProject ? (
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    <span>
                      {orgName} / <span className="font-mono text-foreground">{selectedProject.name}</span>
                    </span>
                    {selectedProject.currentVersion ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary">
                        {selectedProject.currentVersion.name}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span>{orgName}</span>
                )}
              </div>

              {selectedProject ? (
                <>
                  <Link
                    to={`/user/profile/org/${orgId}/project/${selectedProjectId}/dashboard`}
                    className="border border-[#a78bfa]/40 bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#c4b5fd] text-sm font-semibold py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setEditingProject(selectedProject); setShowProjectEdit(true); }}
                    className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                    title="Edit project"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(selectedProject._id)}
                    className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    Delete
                  </button>
                </>
              ) : null}

              <button
                onClick={() => setShowTeamCreate(true)}
                disabled={!selectedProjectId}
                className="bg-primary hover:brightness-95 disabled:opacity-40 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
              >
                + Team
              </button>
              <button
                onClick={() => setShowCreateSprint(true)}
                disabled={!selectedProjectId}
                className="bg-primary hover:brightness-95 disabled:opacity-40 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
              >
                + Sprint
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div>
              <div className="text-sm text-muted-foreground">Organization</div>
              <div className="text-base font-semibold tracking-tight">{orgName}</div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setShowProjectCreate(true)}
                className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
              >
                + Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:p-6 p-2">
          {view === "projects" ? (
            <div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 text-left">
                <Link
                  to={`/user/profile/org/${orgId}/dashboard`}
                  className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-[#a78bfa]/40 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/10">
                    <BarChart3 className="w-4 h-4 text-[#a78bfa]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold group-hover:text-[#a78bfa]">Dashboard</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Income, tasks, projects, charts</p>
                  </div>
                </Link>
                <Link
                  to={`/user/profile/org/${orgId}/clients`}
                  className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-[#00d4ff]/30 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/30 bg-[#00d4ff]/10">
                    <Users className="w-4 h-4 text-[#00d4ff]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold group-hover:text-[#00d4ff]">Clients</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">CRM, budgets, payments</p>
                  </div>
                </Link>
                <Link
                  to={`/user/profile/org/${orgId}/finance`}
                  className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-primary/30 transition"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold group-hover:text-primary">Finance</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Accounts, income, expense</p>
                  </div>
                </Link>
              </div>

              <h2 className="lg:text-2xl text-lg font-semibold mb-4">Projects</h2>

              {projects.length > 0 ? (
                <div className="grid gap-3">
                  {projects.map((p) => (
                    <div key={p._id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{p.name}</h3>
                          {p.currentVersion ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-md border border-primary/40 bg-primary/10 text-primary font-mono">
                              {p.currentVersion.name} · {p.currentVersion.status}
                            </span>
                          ) : null}
                          {p.isArchived ? (
                            <span className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground">Archived</span>
                          ) : null}
                        </div>
                        {p.description ? <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p> : null}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Link
                          to={`/user/profile/org/${orgId}/project/${p._id}/dashboard`}
                          className="border border-[#a78bfa]/40 bg-[#a78bfa]/10 hover:bg-[#a78bfa]/20 text-[#c4b5fd] text-sm font-semibold py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-1.5"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => handleOpenProjectDetails(p._id)}
                          className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => { setEditingProject(p); setShowProjectEdit(true); }}
                          className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                          title="Edit project"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p._id)}
                          className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-6 bg-card">
                  <div className="text-sm text-muted-foreground">No projects yet.</div>
                </div>
              )}
            </div>
          ) : null}

          {view === "details" && activeTab === "sprints" && (
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

          {view === "details" && activeTab === "team" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold ww-heading">
                  Teams{" "}
                  {selectedProject ? (
                    <span className="text-muted-foreground font-normal text-base">
                      / <span className="font-mono">{selectedProject.name}</span>
                    </span>
                  ) : null}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Project squads — assign org members with roles for this build.
                </p>
              </div>
              {orgDetails?.teams?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {orgDetails.teams.map((team) => (
                    <TeamCard
                      key={team._id}
                      members={team.members}
                      teamName={team.name}
                      onAddMember={() => orgFetch()}
                      orgId={orgId}
                      teamId={team._id}
                      fetchOrg={() => orgFetch(selectedProjectId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-8 bg-card text-center text-sm text-muted-foreground">
                  No teams for this project yet. Use <strong className="text-foreground">+ Team</strong> in the header to create one.
                </div>
              )}
            </div>
          )}

          {view === "details" && activeTab === "features" && (
            <FeatureAnalysis orgId={orgId} projectId={selectedProjectId} />
          )}

          {view === "details" && activeTab === "versions" && (
            <ProjectVersions orgId={orgId} projectId={selectedProjectId} />
          )}

          {view === "details" && activeTab === "docs" && (
            <ProjectDocs orgId={orgId} projectId={selectedProjectId} />
          )}

          {view === "details" && activeTab === "member" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold ww-heading">Organization members</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Everyone with access to this org. Owners cannot be removed.
                </p>
              </div>
              <MembersShow
                members={orgDetails.organization?.members}
                orgId={orgId}
                ownerId={orgDetails.organization?.owner_id}
                onRefresh={() => orgFetch(selectedProjectId)}
              />
            </div>
          )}
      </div>

        {showCreateSprint && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowCreateSprint(false)}
                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
              >
                &times;
              </button>
              <SprintCreate onClose={() => { setShowCreateSprint(false); orgFetch(); }} orgId={orgId} projectId={selectedProjectId} />
            </div>
          </div>
        )}

        {showTeamCreate && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowTeamCreate(false)}
                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
              >
                &times;
              </button>
              <TeamCreate onClose={() => { setShowTeamCreate(false); orgFetch(); }} orgId={orgId} projectId={selectedProjectId} fetchOrg={() => orgFetch()} />
            </div>
          </div>
        )}

        {showProjectCreate && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-lg w-full mx-4 relative">
              <button
                onClick={() => setShowProjectCreate(false)}
                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
              >
                &times;
              </button>
              <ProjectCreate
                onClose={() => setShowProjectCreate(false)}
                orgId={orgId}
                onCreated={(project) => {
                  setShowProjectCreate(false);
                  if (project?._id) handleOpenProjectDetails(project._id);
                  else orgFetch();
                }}
              />
            </div>
          </div>
        )}

        {showProjectEdit && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-lg w-full mx-4 relative">
              <button
                onClick={() => { setShowProjectEdit(false); setEditingProject(null); }}
                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
              >
                &times;
              </button>
              <ProjectEdit
                onClose={() => { setShowProjectEdit(false); setEditingProject(null); }}
                orgId={orgId}
                project={editingProject}
                onUpdated={() => orgFetch(selectedProjectId)}
              />
            </div>
          </div>
        )}

        {showSprintEdit && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 backdrop-blur">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => setShowSprintEdit(false)}
                className="absolute top-2 right-4 font-bold text-muted-foreground hover:text-foreground text-3xl"
              >
                &times;
              </button>
              <SprintEdit onClose={() => setShowSprintEdit(false)} orgId={orgId} sprintId={editingSprintId} orgFetch={() => orgFetch()} />
            </div>
          </div>
        )}

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="dark" />
    </DashboardLayout>
  );
}

export default ShowOrgDetails;
