import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Edit3, Users, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import {
  getPlatformIcon,
  PLATFORM_TYPE_LABEL,
  PLATFORM_ICON_OPTIONS,
  PLATFORM_TYPE_OPTIONS,
  PLATFORM_TYPE_COLORS,
  formatCmsDate,
  formatNumber,
  statusBadgeStyle,
} from "@/lib/cms";

function Sparkline({ points = [], color = "#ec4899", height = 36 }) {
  if (!points.length) {
    return (
      <div className="h-9 flex items-center text-[10px] text-muted-foreground">
        No follower history yet.
      </div>
    );
  }
  const values = points.map((p) => Number(p.count) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const w = 100;
  const h = height;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const path = points
    .map((p, i) => {
      const y = h - ((Number(p.count) - min) / range) * h;
      const x = i * step;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity="0.18" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CmsPlatformCard({
  orgId,
  platform,
  statuses = [],
  content = [],
  onEdit,
  onRefresh,
}) {
  const Icon = getPlatformIcon(platform.icon);
  const color = platform.color || "#a78bfa";
  const [followerModal, setFollowerModal] = useState(false);
  const [followerForm, setFollowerForm] = useState({ at: "", count: 0 });
  const [savingFollower, setSavingFollower] = useState(false);

  const sortedHistory = useMemo(() => {
    const list = Array.isArray(platform.follower_history) ? [...platform.follower_history] : [];
    list.sort((a, b) => new Date(a.at) - new Date(b.at));
    return list;
  }, [platform.follower_history]);

  const firstCount = sortedHistory[0]?.count ?? platform.current_followers ?? 0;
  const lastCount = sortedHistory[sortedHistory.length - 1]?.count ?? platform.current_followers ?? 0;
  const delta = lastCount - firstCount;
  const deltaPct = firstCount > 0 ? ((delta / firstCount) * 100).toFixed(1) : "0.0";

  const platformStatuses = useMemo(
    () => statuses.filter((s) => (s.platform_id?._id || s.platform_id) === platform._id),
    [statuses, platform._id]
  );
  const platformContent = useMemo(
    () => content.filter((c) => (c.platform_id?._id || c.platform_id) === platform._id),
    [content, platform._id]
  );

  const addFollowerSnapshot = async () => {
    if (!followerForm.count && followerForm.count !== 0) {
      toast.error("Follower count is required", { theme: "dark" });
      return;
    }
    setSavingFollower(true);
    try {
      const payload = {
        name: platform.name,
        description: platform.description,
        color: platform.color,
        icon: platform.icon,
        platform_type: platform.platform_type,
        account_handle: platform.account_handle,
        account_url: platform.account_url,
        niche: platform.niche,
        current_followers: Number(followerForm.count) || 0,
        engagement_rate_target: platform.engagement_rate_target,
        sort_order: platform.sort_order,
        is_active: platform.is_active,
        follower_history_append: {
          at: followerForm.at || new Date().toISOString(),
          count: Number(followerForm.count) || 0,
        },
      };
      await api.patch(`/api/v1/org/${orgId}/cms/platforms/${platform._id}`, payload);
      toast.success("Follower snapshot added", { theme: "dark" });
      setFollowerModal(false);
      setFollowerForm({ at: "", count: 0 });
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed", { theme: "dark" });
    } finally {
      setSavingFollower(false);
    }
  };

  const typeClass = PLATFORM_TYPE_COLORS[platform.platform_type] || PLATFORM_TYPE_COLORS.mixed;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 space-y-3",
        typeClass
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}33`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-semibold truncate">{platform.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background/40">
              {PLATFORM_TYPE_LABEL[platform.platform_type] || platform.platform_type}
            </span>
            {!platform.is_active ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/30 text-muted-foreground">
                archived
              </span>
            ) : null}
          </div>
          {platform.account_handle ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <span>@{platform.account_handle}</span>
              {platform.account_url ? (
                <a
                  href={platform.account_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          ) : null}
          {platform.niche ? (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {platform.niche}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit?.(platform)}
            className="p-1.5 rounded border border-border hover:border-primary/40"
            aria-label="Edit platform"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-background/40 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> Followers
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {formatNumber(platform.current_followers || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {delta >= 0 ? "+" : ""}
            {formatNumber(delta)} ({deltaPct}%) all-time
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Content
          </div>
          <div className="text-lg font-semibold tabular-nums">{platformContent.length}</div>
          <div className="text-[10px] text-muted-foreground">
            {platformStatuses.length} workflow status
            {platformStatuses.length === 1 ? "" : "es"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/40 p-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Growth
          </div>
          <button
            type="button"
            onClick={() => setFollowerModal(true)}
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-primary/40"
          >
            <Plus className="w-3 h-3" /> snapshot
          </button>
        </div>
        <Sparkline points={sortedHistory} color={color} />
      </div>

      {platformStatuses.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap">
          {platformStatuses.map((s) => (
            <span
              key={s._id}
              className="text-[10px] px-1.5 py-0.5 rounded border"
              style={statusBadgeStyle(s.color)}
            >
              {s.name}
            </span>
          ))}
        </div>
      ) : null}

      <Modal
        open={followerModal}
        onClose={() => setFollowerModal(false)}
        title={`Add follower snapshot — ${platform.name}`}
        size="sm"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Count">
              <input
                type="number"
                className="ww-input w-full"
                value={followerForm.count}
                onChange={(e) => setFollowerForm({ ...followerForm, count: e.target.value })}
                placeholder={String(platform.current_followers || 0)}
              />
            </Field>
            <Field label="Date" hint="Defaults to now">
              <input
                type="date"
                className="ww-input w-full"
                value={followerForm.at}
                onChange={(e) => setFollowerForm({ ...followerForm, at: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFollowerModal(false)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addFollowerSnapshot}
              disabled={savingFollower}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              {savingFollower ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
