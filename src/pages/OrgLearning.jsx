import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import api from "../ApiInception";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/org/StatCard";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { Skeleton } from "@/components/ui/Loading";
import { formatDate } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABEL = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

const STATUS_CLASS = {
  draft: "bg-muted/40 text-muted-foreground border-border",
  active: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-muted/30 text-muted-foreground border-border",
  not_started: "bg-muted/40 text-muted-foreground border-border",
  in_progress: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

function ProgressBar({ value, size = "md", className }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={cn("w-full rounded-full bg-muted/80 overflow-hidden", h, className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          pct >= 100 ? "bg-primary" : pct > 0 ? "bg-[#a78bfa]" : "bg-transparent"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function AssignmentRow({ assignment, canUpdate, canManage, onProgressCommit, onDelete }) {
  const [localPct, setLocalPct] = useState(assignment.progress_percent ?? 0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) setLocalPct(assignment.progress_percent ?? 0);
  }, [assignment.progress_percent, dragging]);

  const commit = (value) => {
    const pct = Math.min(100, Math.max(0, value));
    setLocalPct(pct);
    onProgressCommit(assignment, pct);
  };

  return (
    <div className="rounded-lg border border-border bg-background/60 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">
            {assignment.user_id?.name || assignment.user_id?.email || "Member"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
            {assignment.start_date ? <span>Start {formatDate(assignment.start_date)}</span> : null}
            {assignment.due_date ? <span>Due {formatDate(assignment.due_date)}</span> : null}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold shrink-0",
            STATUS_CLASS[assignment.status] || STATUS_CLASS.not_started
          )}
        >
          {STATUS_LABEL[assignment.status] || assignment.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono tabular-nums font-semibold text-[#a78bfa]">{localPct}%</span>
        </div>
        <ProgressBar value={localPct} />
        {canUpdate ? (
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={localPct}
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
            onChange={(e) => setLocalPct(Number(e.target.value))}
            onMouseUp={(e) => {
              setDragging(false);
              commit(Number(e.currentTarget.value));
            }}
            onTouchEnd={(e) => {
              setDragging(false);
              commit(Number(e.currentTarget.value));
            }}
            className="w-full h-2 cursor-pointer accent-[#a78bfa] bg-transparent"
            aria-label="Adjust progress"
          />
        ) : null}
      </div>

      {canManage ? (
        <div className="flex justify-end pt-1 border-t border-border/60">
          <button
            type="button"
            onClick={() => onDelete(assignment)}
            className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TopicCard({
  topic,
  index,
  expanded,
  onToggle,
  canWrite,
  onEdit,
  onDelete,
  onAssign,
  onAssignmentProgress,
  onAssignmentDelete,
  currentUserId,
  dragHandleProps,
  isDragging,
  isDropTarget,
}) {
  const { progress, assignments } = topic;

  return (
    <article
      className={cn(
        "ww-card overflow-hidden transition-all duration-200",
        isDragging && "opacity-50 scale-[0.99] shadow-lg ring-2 ring-[#a78bfa]/50",
        isDropTarget && "ring-2 ring-primary border-primary/40"
      )}
    >
      {isDropTarget ? (
        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          {canWrite ? (
            <div
              {...dragHandleProps}
              className="flex shrink-0 items-center justify-center w-8 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground cursor-grab active:cursor-grabbing hover:border-[#a78bfa]/50 hover:text-[#a78bfa] touch-none"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
              <span className="sr-only">Drag handle</span>
            </div>
          ) : null}

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    #{index + 1}
                  </span>
                  <h3 className="font-semibold text-base">{topic.title}</h3>
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold",
                      STATUS_CLASS[topic.status] || STATUS_CLASS.active
                    )}
                  >
                    {STATUS_LABEL[topic.status] || topic.status}
                  </span>
                </div>
                {topic.description ? (
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{topic.description}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {canWrite ? (
                  <>
                    <button
                      type="button"
                      onClick={onAssign}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Assign
                    </button>
                    <button
                      type="button"
                      onClick={onEdit}
                      className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="p-2 rounded-lg border border-border hover:bg-muted text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {topic.start_date ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start {formatDate(topic.start_date)}
                </span>
              ) : null}
              {topic.due_date ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due {formatDate(topic.due_date)}
                </span>
              ) : null}
              <span>
                {progress.completed}/{progress.total} completed
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Team progress</span>
                <span className="font-mono tabular-nums">{progress.avg_progress}%</span>
              </div>
              <ProgressBar value={progress.avg_progress} />
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border bg-muted/10 px-4 sm:px-5 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignments</p>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No assignments yet.
              {canWrite ? " Use Assign to add team members." : ""}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {assignments.map((a) => {
                const isMine = String(a.user_id?._id || a.user_id) === String(currentUserId);
                return (
                  <AssignmentRow
                    key={a._id}
                    assignment={a}
                    canUpdate={canWrite || isMine}
                    canManage={canWrite}
                    onProgressCommit={onAssignmentProgress}
                    onDelete={onAssignmentDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function OrgLearning() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [access, setAccess] = useState(null);
  const [members, setMembers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [dragTopicId, setDragTopicId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [topicModal, setTopicModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [assignTopic, setAssignTopic] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    status: "active",
    start_date: "",
    due_date: "",
  });
  const [assignForm, setAssignForm] = useState({
    user_id: "",
    start_date: "",
    due_date: "",
    notes: "",
  });

  const authUser = useSelector((state) => state.auth?.user);
  const currentUserId = authUser?._id || authUser?.id || null;
  const canWrite = access?.canWrite ?? false;

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      api.get(`/api/v1/org/${orgId}/learning/overview`),
      api.get(`/api/v1/users/org/fetch/all/members/${orgId}`),
    ])
      .then(([learningRes, membersRes]) => {
        setTopics(learningRes.data.topics || []);
        setSummary(learningRes.data.summary || null);
        setAccess(learningRes.data.access || null);
        setMembers((membersRes.data.members || []).filter((m) => m.status === "active"));
      })
      .catch(() => toast.error("Failed to load learning data", { theme: "dark" }))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const openTopicModal = (topic = null) => {
    setEditingTopic(topic);
    setTopicForm({
      title: topic?.title || "",
      description: topic?.description || "",
      status: topic?.status || "active",
      start_date: topic?.start_date ? new Date(topic.start_date).toISOString().slice(0, 10) : "",
      due_date: topic?.due_date ? new Date(topic.due_date).toISOString().slice(0, 10) : "",
    });
    setTopicModal(true);
  };

  const saveTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      toast.error("Title is required", { theme: "dark" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: topicForm.title.trim(),
        description: topicForm.description,
        status: topicForm.status,
        start_date: topicForm.start_date || null,
        due_date: topicForm.due_date || null,
      };
      if (editingTopic) {
        await api.patch(`/api/v1/org/${orgId}/learning/topics/${editingTopic._id}`, payload);
      } else {
        await api.post(`/api/v1/org/${orgId}/learning/topics`, payload);
      }
      toast.success(editingTopic ? "Topic updated" : "Topic created", { theme: "dark" });
      setTopicModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTopic = async (topic) => {
    if (!window.confirm(`Delete "${topic.title}" and all assignments?`)) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/learning/topics/${topic._id}`);
      toast.success("Topic deleted", { theme: "dark" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const openAssign = (topic) => {
    setAssignTopic(topic);
    setAssignForm({
      user_id: "",
      start_date: topic.start_date ? new Date(topic.start_date).toISOString().slice(0, 10) : "",
      due_date: topic.due_date ? new Date(topic.due_date).toISOString().slice(0, 10) : "",
      notes: "",
    });
    setAssignModal(true);
  };

  const saveAssignment = async (e) => {
    e.preventDefault();
    if (!assignForm.user_id) {
      toast.error("Select a member", { theme: "dark" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/v1/org/${orgId}/learning/topics/${assignTopic._id}/assignments`, {
        user_id: assignForm.user_id,
        start_date: assignForm.start_date || null,
        due_date: assignForm.due_date || null,
        notes: assignForm.notes,
      });
      toast.success("Member assigned", { theme: "dark" });
      setAssignModal(false);
      setExpanded((prev) => ({ ...prev, [assignTopic._id]: true }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateProgress = async (assignment, progress_percent) => {
    const prevTopics = topics;
    setTopics((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: (t.assignments || []).map((a) =>
          a._id === assignment._id
            ? {
                ...a,
                progress_percent,
                status:
                  progress_percent >= 100
                    ? "completed"
                    : progress_percent > 0
                      ? "in_progress"
                      : "not_started",
              }
            : a
        ),
        progress: recalcTopicProgress(
          (t.assignments || []).map((a) =>
            a._id === assignment._id ? { ...a, progress_percent } : a
          )
        ),
      }))
    );
    try {
      await api.patch(`/api/v1/org/${orgId}/learning/assignments/${assignment._id}`, {
        progress_percent,
      });
    } catch (err) {
      setTopics(prevTopics);
      toast.error(err?.response?.data?.message || "Failed to update", { theme: "dark" });
    }
  };

  const recalcTopicProgress = (assignments) => {
    if (!assignments.length) return { avg_progress: 0, completed: 0, total: 0 };
    const completed = assignments.filter(
      (a) => a.status === "completed" || Number(a.progress_percent) >= 100
    ).length;
    const avg =
      assignments.reduce((s, a) => s + Number(a.progress_percent || 0), 0) / assignments.length;
    return { avg_progress: Math.round(avg), completed, total: assignments.length };
  };

  const deleteAssignment = async (assignment) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await api.delete(`/api/v1/org/${orgId}/learning/assignments/${assignment._id}`);
      toast.success("Assignment removed", { theme: "dark" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed", { theme: "dark" });
    }
  };

  const handleDragStart = (e, topicId) => {
    setDragTopicId(topicId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", topicId);
  };

  const handleDragOver = (e, topicId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragTopicId && dragTopicId !== topicId) setDropTargetId(topicId);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!dragTopicId || dragTopicId === targetId || !canWrite) {
      setDragTopicId(null);
      return;
    }
    const ids = topics.map((t) => t._id);
    const from = ids.indexOf(dragTopicId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragTopicId(null);
      return;
    }
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragTopicId);
    const map = Object.fromEntries(topics.map((t) => [t._id, t]));
    setTopics(next.map((id) => map[id]));
    setDragTopicId(null);
    try {
      await api.patch(`/api/v1/org/${orgId}/learning/topics/reorder`, { orderedIds: next });
      toast.success("Order saved", { theme: "dark", autoClose: 1500 });
    } catch {
      toast.error("Reorder failed", { theme: "dark" });
      load();
    }
  };

  const myTopics = useMemo(() => {
    if (!currentUserId) return [];
    return topics
      .map((t) => {
        const mine = t.assignments?.find(
          (a) => String(a.user_id?._id || a.user_id) === String(currentUserId)
        );
        return mine ? { topic: t, assignment: mine } : null;
      })
      .filter(Boolean);
  }, [topics, currentUserId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="ww-page-full space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" theme="dark" />
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-30">
        <div className="ww-page-full py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/user/profile/org/${orgId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Organization
            </button>
            <div>
              <div className="ww-tag border-[#a78bfa]/25 bg-[#a78bfa]/10 text-[#a78bfa] text-[10px] mb-1">
                Growth
              </div>
              <h1 className="ww-heading text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#a78bfa]" />
                Learning
              </h1>
            </div>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() => openTopicModal()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-[#a78bfa] text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> New topic
            </button>
          ) : null}
        </div>
      </div>

      <div className="ww-page-full space-y-6 pb-10 text-left">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Topics"
            value={summary?.topic_count ?? 0}
            sub={`${summary?.active_topics ?? 0} active`}
            variant="neutral"
          />
          <StatCard
            label="Assignments"
            value={summary?.assignment_count ?? 0}
            sub={`${summary?.completed_assignments ?? 0} completed`}
            variant="balance"
          />
          <StatCard
            label="My assignments"
            value={summary?.my_assignments ?? 0}
            sub={`${summary?.my_completed ?? 0} done`}
            variant="income"
          />
          <StatCard label="Team members" value={members.length} sub="Available to assign" variant="neutral" />
        </div>

        {myTopics.length > 0 ? (
          <section className="ww-card p-5 border-[#a78bfa]/20">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#a78bfa]" />
              Your learning path
            </h2>
            <ul className="space-y-4">
              {myTopics.map(({ topic, assignment }) => (
                <li key={topic._id}>
                  <div className="flex justify-between gap-3 mb-1.5">
                    <span className="text-sm font-medium">{topic.title}</span>
                    <span className="text-xs font-mono text-[#a78bfa] tabular-nums">
                      {assignment.progress_percent}%
                    </span>
                  </div>
                  <ProgressBar value={assignment.progress_percent} size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Learning topics</h2>
              {canWrite ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use the grip handle on each card to drag and reorder priority
                </p>
              ) : null}
            </div>
          </div>

          {topics.length === 0 ? (
            <div className="ww-card border-dashed p-12 text-center text-sm text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No learning topics yet.</p>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => openTopicModal()}
                  className="mt-4 text-sm font-semibold text-[#a78bfa] hover:underline"
                >
                  Create first topic
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div
                  key={topic._id}
                  onDragOver={(e) => handleDragOver(e, topic._id)}
                  onDragLeave={() => setDropTargetId((id) => (id === topic._id ? null : id))}
                  onDrop={(e) => handleDrop(e, topic._id)}
                >
                  <TopicCard
                    topic={topic}
                    index={index}
                    expanded={Boolean(expanded[topic._id])}
                    onToggle={() => setExpanded((p) => ({ ...p, [topic._id]: !p[topic._id] }))}
                    canWrite={canWrite}
                    onEdit={() => openTopicModal(topic)}
                    onDelete={() => deleteTopic(topic)}
                    onAssign={() => openAssign(topic)}
                    onAssignmentProgress={updateProgress}
                    onAssignmentDelete={deleteAssignment}
                    currentUserId={currentUserId}
                    isDragging={dragTopicId === topic._id}
                    isDropTarget={dropTargetId === topic._id && dragTopicId !== topic._id}
                    dragHandleProps={
                      canWrite
                        ? {
                            draggable: true,
                            onDragStart: (e) => handleDragStart(e, topic._id),
                            onDragEnd: () => {
                              setDragTopicId(null);
                              setDropTargetId(null);
                            },
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          <Link
            to={`/user/profile/org/${orgId}?view=members`}
            className="text-[#a78bfa] hover:underline inline-flex items-center gap-1"
          >
            <Users className="w-3 h-3" /> Manage members
          </Link>{" "}
          before assigning topics.
        </p>
      </div>

      <Modal
        open={topicModal}
        onClose={() => setTopicModal(false)}
        title={editingTopic ? "Edit topic" : "New learning topic"}
      >
        <form onSubmit={saveTopic} className="space-y-4">
          <Field label="Title">
            <input
              className="ww-input ww-input-md w-full"
              required
              value={topicForm.title}
              onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="ww-input w-full min-h-[80px]"
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={topicForm.start_date}
                onChange={(e) => setTopicForm({ ...topicForm, start_date: e.target.value })}
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={topicForm.due_date}
                onChange={(e) => setTopicForm({ ...topicForm, due_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Status">
            <SelectInput
              value={topicForm.status}
              onChange={(e) => setTopicForm({ ...topicForm, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save topic"}
          </button>
        </form>
      </Modal>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title={`Assign — ${assignTopic?.title || ""}`}>
        <form onSubmit={saveAssignment} className="space-y-4">
          <Field label="Team member">
            <SelectInput
              required
              value={assignForm.user_id}
              onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })}
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                  {m.user?.fullName || m.user?.name || m.user?.email}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={assignForm.start_date}
                onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                className="ww-input ww-input-md w-full"
                value={assignForm.due_date}
                onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes">
            <input
              className="ww-input ww-input-md w-full"
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-sm font-semibold py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Assign"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default OrgLearning;
