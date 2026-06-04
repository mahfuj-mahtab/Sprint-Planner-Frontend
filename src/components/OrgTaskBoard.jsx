import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import api from "../ApiInception";
import SprintKanban from "./SprintKanban";
import SprintCreate from "./SprintCreate";
import SprintEdit from "./SprintEdit";
import TaskCreate from "./TaskCreate";
import TaskEdit from "./TaskEdit";
import { Field, SelectInput } from "@/components/org/Field";
import { ReadOnlyBanner } from "@/components/org/ReadOnlyBanner";

function Modal({ children, onClose, maxWidth = "max-w-3xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur p-4">
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-lg`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-2 text-2xl font-bold text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default function OrgTaskBoard({ orgId, canWrite = true }) {
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [board, setBoard] = useState(null);
  const [filters, setFilters] = useState({
    projectId: "",
    teamId: "",
    memberId: "",
    status: "",
  });
  const [showSprintCreate, setShowSprintCreate] = useState(false);
  const [showSprintEdit, setShowSprintEdit] = useState(false);
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [showTaskEdit, setShowTaskEdit] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const loadSprints = () =>
    api.get(`/api/v1/org/${orgId}/sprints`, { params: { limit: 100 } }).then((response) => {
      const details = response.data.sprintDetails || [];
      setSprints(details);
      setSelectedSprintId((current) => current || details.find((item) => item.sprint.isActive)?.sprint._id || details[0]?.sprint._id || "");
    });

  const loadBoard = () => {
    if (!selectedSprintId) {
      setBoard(null);
      return Promise.resolve();
    }
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    return api
      .get(`/api/v1/org/${orgId}/sprints/${selectedSprintId}/board`, { params })
      .then((response) => setBoard(response.data))
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Could not load task board", { theme: "dark" });
      });
  };

  useEffect(() => {
    loadSprints().catch((error) => {
      toast.error(error?.response?.data?.message || "Could not load sprints", { theme: "dark" });
    });
  }, [orgId]);

  useEffect(() => {
    loadBoard();
  }, [orgId, selectedSprintId, filters]);

  const projectTeams = useMemo(() => {
    const allTeams = board?.filters?.teams || [];
    return filters.projectId
      ? allTeams.filter((team) => team.project_id?.toString?.() === filters.projectId || team.project_id === filters.projectId)
      : allTeams;
  }, [board, filters.projectId]);

  const memberOptions = useMemo(() => {
    const members = [];
    for (const team of projectTeams) {
      for (const member of team.members || []) {
        const user = member.user;
        if (user?._id && !members.some((m) => m._id === user._id)) members.push(user);
      }
    }
    return members;
  }, [projectTeams]);

  const selectedSprint = sprints.find((item) => item.sprint._id === selectedSprintId)?.sprint;
  const readOnly = !canWrite || !(board?.deliveryAccess?.canWrite ?? true);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold ww-heading">Task board</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedSprint ? `${selectedSprint.name} · ${sprints.find((s) => s.sprint._id === selectedSprintId)?.total_tasks || 0} tasks` : "Create a sprint to start planning tasks."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadBoard} className="border border-border px-3 py-2 rounded-md text-sm inline-flex items-center gap-2 hover:bg-muted">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {selectedSprintId && canWrite ? (
            <button type="button" onClick={() => setShowSprintEdit(true)} className="border border-border px-3 py-2 rounded-md text-sm hover:bg-muted">
              Edit sprint
            </button>
          ) : null}
          {canWrite ? (
            <>
              <button type="button" onClick={() => setShowSprintCreate(true)} className="border border-border px-3 py-2 rounded-md text-sm hover:bg-muted">
                <Plus className="w-4 h-4 inline mr-1" />
                Sprint
              </button>
              <button
                type="button"
                disabled={!selectedSprintId}
                onClick={() => setShowTaskCreate(true)}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-40"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Task
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-5">
        <Field label="Sprint">
          <SelectInput value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)} className="w-full">
            <option value="">No sprint</option>
            {sprints.map((item) => (
              <option key={item.sprint._id} value={item.sprint._id}>
                {item.sprint.name}{item.sprint.isActive ? " (active)" : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Project">
          <SelectInput
            value={filters.projectId}
            onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value, teamId: "", memberId: "" }))}
            className="w-full"
          >
            <option value="">All projects</option>
            {(board?.filters?.projects || []).map((project) => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Team">
          <SelectInput
            value={filters.teamId}
            onChange={(e) => setFilters((f) => ({ ...f, teamId: e.target.value, memberId: "" }))}
            className="w-full"
          >
            <option value="">All teams</option>
            {projectTeams.map((team) => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Member">
          <SelectInput value={filters.memberId} onChange={(e) => setFilters((f) => ({ ...f, memberId: e.target.value }))} className="w-full">
            <option value="">All members</option>
            {memberOptions.map((member) => (
              <option key={member._id} value={member._id}>{member.fullName || member.email}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-full">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Backlog">Backlog</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Blocked">Blocked</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </SelectInput>
        </Field>
      </div>

      {readOnly && board?.deliveryAccess?.reason ? <ReadOnlyBanner reason={board.deliveryAccess.reason} /> : null}

      {selectedSprintId && board?.teams?.length ? (
        <SprintKanban
          teams={board.teams}
          orgId={orgId}
          sprintId={selectedSprintId}
          readOnly={readOnly}
          onRefresh={() => {
            loadSprints();
            loadBoard();
          }}
          onEditTask={(task) => {
            setEditingTaskId(task._id);
            setShowTaskEdit(true);
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
          {selectedSprintId ? "No tasks match these filters." : "Create a sprint, then add tasks for any project/team/member."}
        </div>
      )}

      {showSprintCreate ? (
        <Modal onClose={() => setShowSprintCreate(false)} maxWidth="max-w-2xl">
          <SprintCreate
            onClose={() => {
              setShowSprintCreate(false);
              loadSprints();
            }}
            orgId={orgId}
          />
        </Modal>
      ) : null}

      {showSprintEdit && selectedSprintId ? (
        <Modal onClose={() => setShowSprintEdit(false)} maxWidth="max-w-2xl">
          <SprintEdit
            onClose={() => {
              setShowSprintEdit(false);
              loadSprints();
              loadBoard();
            }}
            orgId={orgId}
            sprintId={selectedSprintId}
            orgFetch={() => {
              loadSprints();
              loadBoard();
            }}
          />
        </Modal>
      ) : null}

      {showTaskCreate && selectedSprintId ? (
        <Modal onClose={() => setShowTaskCreate(false)}>
          <TaskCreate
            onClose={() => setShowTaskCreate(false)}
            orgId={orgId}
            sprintId={selectedSprintId}
            onTaskCreated={() => {
              loadSprints();
              loadBoard();
            }}
          />
        </Modal>
      ) : null}

      {showTaskEdit && editingTaskId ? (
        <Modal onClose={() => setShowTaskEdit(false)}>
          <TaskEdit
            onClose={() => setShowTaskEdit(false)}
            orgId={orgId}
            sprintId={selectedSprintId}
            taskId={editingTaskId}
            onTaskCreated={() => {
              setEditingTaskId(null);
              loadSprints();
              loadBoard();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
