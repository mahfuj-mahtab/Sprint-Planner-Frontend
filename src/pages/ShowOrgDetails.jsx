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
import OrgTaskBoard from "../components/OrgTaskBoard";
import { OrgProjectBoard } from "../components/OrgProjectBoard";
import { ArrowLeft, BarChart3, BookOpen, Flag, Lock, Pencil, Trash2, UserPlus, Users, Wallet } from "lucide-react";
import { Link } from "react-router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ListPagination } from "@/components/org/ListPagination";
import { Field, SelectInput } from "@/components/org/Field";
import { PROJECT_BOARD_COLUMNS, PROJECT_STATUS_LABELS, normalizeProjectStatus } from "@/lib/projectWorkflow";
import { ReadOnlyBanner } from "@/components/org/ReadOnlyBanner";

function ShowOrgDetails() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState("tasks"); // "tasks" | "projects" | "details" | "members"
  const [activeTab, setActiveTab] = useState("sprints");

  const [orgDetails, setOrgDetails] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectPagination, setProjectPagination] = useState(null);
  const [projectPage, setProjectPage] = useState(1);
  const [projectFilters, setProjectFilters] = useState({
    search: "",
    status: "",
    project_type: "",
    archived: "false",
  });
  const [sprintDetails, setSprintDetails] = useState([]);
  const [sprintPagination, setSprintPagination] = useState(null);
  const [sprintPage, setSprintPage] = useState(1);
  const [sprintFilters, setSprintFilters] = useState({ search: "", active: "" });
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);
  const [sprintLoading, setSprintLoading] = useState(false);

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
    ],
    []
  );

  const orgLevelTabs = useMemo(
    () => [
      { id: "tasks", label: "Tasks" },
      { id: "projects", label: "Projects" },
      { id: "members", label: "Members" },
    ],
    []
  );

  const loadProjects = (page = projectPage) => {
    const params = { page, limit: 100, archived: projectFilters.archived || "false" };
    if (projectFilters.search.trim()) params.search = projectFilters.search.trim();
    if (projectFilters.status) params.status = projectFilters.status;
    if (projectFilters.project_type) params.project_type = projectFilters.project_type;

    return api
      .get(`/api/v1/org/${orgId}/projects`, { params })
      .then((response) => {
        setProjects(response.data.projects || []);
        setProjectPagination(response.data.pagination || null);
        setProjectPage(page);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      });
  };

  const loadSprints = (projectId, page = sprintPage) => {
    if (!projectId) return Promise.resolve();
    setSprintLoading(true);
    setSprintDetails([]);
    setSprintPagination(null);
    const params = { page, limit: 10 };
    if (sprintFilters.search.trim()) params.search = sprintFilters.search.trim();
    if (sprintFilters.active) params.active = sprintFilters.active;

    return api
      .get(`/api/v1/org/${orgId}/projects/${projectId}/sprints`, { params })
      .then((response) => {
        setSprintDetails(response.data.sprintDetails || []);
        setSprintPagination(response.data.pagination || null);
        setSprintPage(page);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      })
      .finally(() => setSprintLoading(false));
  };

  const orgFetch = (projectId, options = {}) => {
    if (options.showProjectLoader) setProjectDetailsLoading(true);
    return api
      .get(`/api/v1/org/fetch/${orgId}`, { params: projectId ? { projectId } : undefined })
      .then((response) => {
        setOrgDetails(response.data);
        setSelectedProjectId(response.data.selectedProjectId || projectId || null);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      })
      .finally(() => {
        if (options.showProjectLoader) setProjectDetailsLoading(false);
      });
  };

  useEffect(() => {
    // Reset view/state when switching organizations to avoid leaking previous org's selected project
    setView("tasks");
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
    setProjectPagination(null);
    setProjectPage(1);
    setSprintDetails([]);
    setSprintPagination(null);
    setProjectDetailsLoading(false);
    setSprintLoading(false);
    setOrgDetails(null);
    const sp = new URLSearchParams(location.search);
    const qView = sp.get("view");
    const qProjectId = sp.get("projectId");
    const qTab = sp.get("tab");
    const membersRoute = location.pathname.replace(/\/$/, "").endsWith("/members");

    if (membersRoute || qView === "members") {
      setView("members");
      orgFetch();
      if (membersRoute && qView !== "members") {
        navigate(`/user/profile/org/${orgId}?view=members`, { replace: true });
      }
    } else if (qView === "details" && qProjectId) {
      setView("details");
      setActiveTab(qTab || "sprints");
      orgFetch(qProjectId);
    } else {
      setView("tasks");
      loadProjects(1);
      orgFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (view === "projects") loadProjects(projectPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilters]);

  useEffect(() => {
    if (view === "details" && activeTab === "sprints" && selectedProjectId) {
      loadSprints(selectedProjectId, sprintPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintFilters, activeTab, selectedProjectId, view]);

  useEffect(() => {
    if (view === "details" && activeTab === "sprints" && selectedProjectId) {
      loadSprints(selectedProjectId, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const qView = sp.get("view");
    const qProjectId = sp.get("projectId");
    const qTab = sp.get("tab");
    const membersRoute = location.pathname.replace(/\/$/, "").endsWith("/members");

    if (membersRoute || qView === "members") {
      setView("members");
    } else if (qView === "details" && qProjectId) {
      setView("details");
      if (qTab) setActiveTab(qTab);
      if (qProjectId !== selectedProjectId) handleSelectProject(qProjectId);
    } else if (qView === "projects") {
      setView("projects");
      if (!projects.length) loadProjects(1);
    } else if (qView === "tasks") {
      setView("tasks");
      if (!projects.length) loadProjects(1);
    } else if (!qView && view !== "tasks" && view !== "projects" && view !== "members") {
      setView("tasks");
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
    setSprintPage(1);
    setProjectDetailsLoading(true);
    setSprintDetails([]);
    setSprintPagination(null);
    setOrgDetails((current) => (current ? { ...current, teams: [] } : current));
    orgFetch(projectId, { showProjectLoader: true });
    loadSprints(projectId, 1);
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

  const handleOpenOrgMembers = () => {
    setView("members");
    navigate(`/user/profile/org/${orgId}?view=members`);
  };

  const handleOpenOrgProjects = () => {
    setView("projects");
    navigate(`/user/profile/org/${orgId}?view=projects`);
    loadProjects(projectPage);
  };

  const handleOpenOrgTasks = () => {
    setView("tasks");
    navigate(`/user/profile/org/${orgId}?view=tasks`);
    if (!projects.length) loadProjects(1);
  };

  const handleDeleteProject = (projectId) => {
    if (!window.confirm("Delete this project? This will also delete its sprints, teams, and tasks.")) return;
    api
      .delete(`/api/v1/org/${orgId}/projects/${projectId}`)
      .then((response) => {
        toast.success(response.data.message || "Project deleted", { position: "top-right", autoClose: 4000, theme: "dark" });
        if (selectedProjectId === projectId) setSelectedProjectId(null);
        if (view === "details" && selectedProjectId === projectId) setView("projects");
        loadProjects(projectPage);
      })
      .catch((error) => {
        const message = error?.response?.data?.message || "Failed to delete project";
        toast.error(message, { position: "top-right", autoClose: 5000, theme: "dark" });
      });
  };

  const handleDeleteSprint = (sprintId) => {
    api
      .delete(`/api/v1/org/delete/sprint/${orgId}/${sprintId}`)
      .then(() => loadSprints(selectedProjectId, sprintPage))
      .catch((error) => console.error("There was an error!", error));
  };

  const handleViewSprint = (sprintId) => {
    navigate(`/user/profile/org/${orgId}/project/${selectedProjectId}/sprint/${sprintId}`);
  };

  const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />
  );

  const ProjectDetailsSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-52 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-9 w-24 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const orgMemberCount = orgDetails?.organization?.members?.length ?? 0;
  const canManageMembers = orgDetails?.access?.canManageMembers ?? false;
  const accessRole = String(orgDetails?.access?.role || "").toLowerCase();
  const isViewer =
    accessRole === "viewer" ||
    (!orgDetails?.access?.canWrite &&
      !orgDetails?.access?.canManageMembers &&
      !orgDetails?.access?.canSeeExactAmounts);
  const canWriteDelivery = orgDetails?.deliveryAccess?.canWrite ?? true;
  const deliveryReadOnlyReason = orgDetails?.deliveryAccess?.reason;
  const needsTeamInvite = canManageMembers && orgMemberCount === 0;

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
              <button
                type="button"
                onClick={handleOpenOrgMembers}
                className="border border-border hover:bg-muted text-foreground text-sm font-medium py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Members
              </button>
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

              {canWriteDelivery ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Organization</div>
              <div className="text-base font-semibold tracking-tight">{orgName}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                {orgLevelTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.id === "members") handleOpenOrgMembers();
                      else if (tab.id === "projects") handleOpenOrgProjects();
                      else handleOpenOrgTasks();
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      view === tab.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.id === "members" && orgMemberCount > 0 ? (
                      <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">({orgMemberCount})</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {view === "projects" ? (
                <button
                  onClick={() => setShowProjectCreate(true)}
                  className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors"
                >
                  + Project
                </button>
              ) : canManageMembers ? (
                <button
                  type="button"
                  onClick={() => document.getElementById("org-members-add-btn")?.click()}
                  className="bg-primary hover:brightness-95 text-primary-foreground text-sm font-semibold py-1.5 px-3 rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="lg:p-6 p-2">
          {view === "members" ? (
            <div className="space-y-4 max-w-5xl" id="org-members-invite">
              <div>
                <h2 className="text-xl font-semibold ww-heading">Organization members</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Invite people here first — they need an account and must be added before they can work on projects, sprints, or finance.
                </p>
              </div>
              <MembersShow
                members={orgDetails.organization?.members}
                orgId={orgId}
                ownerId={orgDetails.organization?.owner_id}
                access={orgDetails.access}
                onRefresh={() => orgFetch()}
              />
            </div>
          ) : null}

          {view === "projects" ? (
            <div>
              {needsTeamInvite ? (
                <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Invite your team before creating projects
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only you have access right now. Add members by email so they can join sprints, tasks, CRM, and finance.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenOrgMembers}
                    className="shrink-0 ww-btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Add members
                  </button>
                </div>
              ) : null}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 text-left">
                <button
                  type="button"
                  onClick={handleOpenOrgMembers}
                  className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 text-left hover:border-primary/40 transition w-full"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold group-hover:text-primary">Members</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {orgMemberCount > 0 ? `${orgMemberCount} invited · manage access` : "Invite team — start here"}
                    </p>
                  </div>
                </button>
                {isViewer ? (
                  <>
                    <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3 opacity-75 cursor-not-allowed pointer-events-none select-none">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Dashboard
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Locked for viewer role</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3 opacity-75 cursor-not-allowed pointer-events-none select-none">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          CRM
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Locked for viewer role</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3 opacity-75 cursor-not-allowed pointer-events-none select-none">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Finance
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Locked for viewer role</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                      to={`/user/profile/org/${orgId}/crm`}
                      className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-[#00d4ff]/30 transition"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/30 bg-[#00d4ff]/10">
                        <Users className="w-4 h-4 text-[#00d4ff]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold group-hover:text-[#00d4ff]">CRM</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Pipeline, follow-ups, clients</p>
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
                    <Link
                      to={`/user/profile/org/${orgId}/learning`}
                      className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-[#a78bfa]/40 transition"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/10">
                        <BookOpen className="w-4 h-4 text-[#a78bfa]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold group-hover:text-[#a78bfa]">Learning</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Topics, assignments, progress</p>
                      </div>
                    </Link>
                    <Link
                      to={`/user/profile/org/${orgId}/strategy`}
                      className="group rounded-xl border border-border bg-card p-4 flex items-start gap-3 no-underline text-inherit hover:border-[#f59e0b]/40 transition sm:col-span-2 lg:col-span-1"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10">
                        <Flag className="w-4 h-4 text-[#f59e0b]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold group-hover:text-[#f59e0b]">Goals</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Year & quarter goals — simple plan</p>
                      </div>
                    </Link>
                  </>
                )}
              </div>

              <h2 className="lg:text-2xl text-lg font-semibold mb-1">Projects</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Drag projects across columns to update status — Backlog → Planning → In progress → Review → Delivered → Billed
              </p>

              <div className="mb-4 flex flex-wrap gap-3 items-end text-left">
                <Field label="Search" className="min-w-[10rem] flex-1">
                  <input
                    className="ww-input ww-input-sm w-full"
                    placeholder="Project name…"
                    value={projectFilters.search}
                    onChange={(e) => setProjectFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </Field>
                <Field label="Status">
                  <SelectInput
                    value={projectFilters.status}
                    onChange={(e) => setProjectFilters((f) => ({ ...f, status: e.target.value }))}
                    className="min-w-[8rem]"
                  >
                    <option value="">All on board</option>
                    {PROJECT_BOARD_COLUMNS.map((s) => (
                      <option key={s} value={s}>
                        {PROJECT_STATUS_LABELS[s]}
                      </option>
                    ))}
                    <option value="cancelled">{PROJECT_STATUS_LABELS.cancelled}</option>
                  </SelectInput>
                </Field>
                <Field label="Type">
                  <SelectInput
                    value={projectFilters.project_type}
                    onChange={(e) => setProjectFilters((f) => ({ ...f, project_type: e.target.value }))}
                    className="min-w-[8rem]"
                  >
                    <option value="">All types</option>
                    <option value="product">Product</option>
                    <option value="client_work">Client work</option>
                    <option value="internal">Internal</option>
                  </SelectInput>
                </Field>
                <Field label="Archived">
                  <SelectInput
                    value={projectFilters.archived}
                    onChange={(e) => setProjectFilters((f) => ({ ...f, archived: e.target.value }))}
                    className="min-w-[7rem]"
                  >
                    <option value="false">Hidden</option>
                    <option value="true">Only archived</option>
                    <option value="all">Include archived</option>
                  </SelectInput>
                </Field>
              </div>

              {projects.length > 0 ? (
                <>
                  {projectFilters.status === "cancelled" ? (
                    <div className="grid gap-3 mb-4">
                      {projects.map((p) => (
                        <div key={p._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{p.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Cancelled</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenProjectDetails(p._id)}
                            className="text-sm px-3 py-1.5 rounded-md border border-primary text-primary"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <OrgProjectBoard
                      orgId={orgId}
                      projects={
                        projectFilters.status
                          ? projects.filter((p) => normalizeProjectStatus(p.status) === projectFilters.status)
                          : projects.filter((p) => normalizeProjectStatus(p.status) !== "cancelled")
                      }
                      canWrite={orgDetails?.access?.canWrite ?? true}
                      onRefresh={() => loadProjects(projectPage)}
                      onEdit={(p) => {
                        setEditingProject(p);
                        setShowProjectEdit(true);
                      }}
                      onDelete={handleDeleteProject}
                      onOpenDetails={handleOpenProjectDetails}
                    />
                  )}
                </>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-6 bg-card">
                  <div className="text-sm text-muted-foreground">No projects match your filters.</div>
                </div>
              )}
              <ListPagination
                pagination={projectPagination}
                onPageChange={(p) => loadProjects(p)}
              />
            </div>
          ) : null}

          {view === "tasks" ? (
            <OrgTaskBoard orgId={orgId} canWrite={orgDetails?.access?.canWrite ?? true} />
          ) : null}

          {view === "details" && projectDetailsLoading ? (
            <ProjectDetailsSkeleton />
          ) : null}

          {view === "details" && !projectDetailsLoading && !canWriteDelivery && deliveryReadOnlyReason ? (
            <ReadOnlyBanner reason={deliveryReadOnlyReason} />
          ) : null}

          {view === "details" && !projectDetailsLoading && activeTab === "sprints" && (
            <div>
              <h2 className="lg:text-2xl text-lg font-semibold mb-4">
                Sprints{" "}
                {selectedProject ? (
                  <span className="text-muted-foreground font-normal">
                    / <span className="font-mono">{selectedProject.name}</span>
                  </span>
                ) : null}
              </h2>

              <div className="mb-4 flex flex-wrap gap-3 items-end text-left">
                <Field label="Search" className="min-w-[10rem] flex-1">
                  <input
                    className="ww-input ww-input-sm w-full"
                    placeholder="Sprint name…"
                    value={sprintFilters.search}
                    onChange={(e) => setSprintFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </Field>
                <Field label="Status">
                  <SelectInput
                    value={sprintFilters.active}
                    onChange={(e) => setSprintFilters((f) => ({ ...f, active: e.target.value }))}
                    className="min-w-[7rem]"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </SelectInput>
                </Field>
              </div>

              {sprintLoading ? (
                <ProjectDetailsSkeleton />
              ) : sprintDetails.length > 0 ? (
                sprintDetails.map((sprint) => (
                  <SprintBlock
                    key={sprint.sprint._id}
                    sprint={sprint.sprint}
                    onEdit={
                      canWriteDelivery
                        ? () => {
                            setEditingSprintId(sprint.sprint._id);
                            setShowSprintEdit(true);
                          }
                        : undefined
                    }
                    onView={() => handleViewSprint(sprint.sprint._id)}
                    onDelete={canWriteDelivery ? () => handleDeleteSprint(sprint.sprint._id) : undefined}
                    total_task={sprint?.total_tasks}
                    completed_task={sprint?.completed_tasks}
                  />
                ))
              ) : (
                <div className="border border-dashed border-border rounded-lg p-6 bg-card">
                  <div className="text-sm text-muted-foreground">No sprints match your filters.</div>
                </div>
              )}
              <ListPagination
                pagination={sprintPagination}
                onPageChange={(p) => loadSprints(selectedProjectId, p)}
              />
            </div>
          )}

          {view === "details" && !projectDetailsLoading && activeTab === "team" && (
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
                      canWrite={canWriteDelivery}
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

          {view === "details" && !projectDetailsLoading && activeTab === "features" && (
            <FeatureAnalysis orgId={orgId} projectId={selectedProjectId} canWrite={canWriteDelivery} />
          )}

          {view === "details" && !projectDetailsLoading && activeTab === "versions" && (
            <ProjectVersions orgId={orgId} projectId={selectedProjectId} />
          )}

          {view === "details" && !projectDetailsLoading && activeTab === "docs" && (
            <ProjectDocs orgId={orgId} projectId={selectedProjectId} />
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
              <SprintCreate
                onClose={() => {
                  setShowCreateSprint(false);
                  loadSprints(selectedProjectId, 1);
                }}
                orgId={orgId}
                projectId={selectedProjectId}
              />
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
              <TeamCreate onClose={() => { setShowTeamCreate(false); orgFetch(selectedProjectId); }} orgId={orgId} projectId={selectedProjectId} fetchOrg={() => orgFetch(selectedProjectId)} />
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
                  loadProjects(1);
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
                onUpdated={() => {
                  loadProjects(projectPage);
                  orgFetch(selectedProjectId);
                }}
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
              <SprintEdit onClose={() => setShowSprintEdit(false)} orgId={orgId} sprintId={editingSprintId} orgFetch={() => orgFetch(selectedProjectId)} />
            </div>
          </div>
        )}

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick={false} pauseOnHover theme="dark" />
    </DashboardLayout>
  );
}

export default ShowOrgDetails;
