import {
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Music2,
  Mic2,
  Rss,
  Globe,
  Pin,
} from "lucide-react";

export const CONTENT_PRIORITIES = ["low", "medium", "high", "urgent"];

export const CONTENT_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const CONTENT_PRIORITY_CLASS = {
  low: "bg-muted/40 text-muted-foreground border-border",
  medium: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  high: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};

export const formatCmsDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const formatCmsDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatNumber = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

export const statusBadgeStyle = (color) => ({
  borderColor: `${color}55`,
  backgroundColor: `${color}18`,
  color: color || "#94a3b8",
});

/* ── Platform icons ───────────────────────────────────────────────────── */

export const PLATFORM_ICON_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "podcast", label: "Podcast" },
  { value: "blog", label: "Blog" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
  { value: "other", label: "Other" },
];

const ICON_MAP = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music2,
  x: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  podcast: Mic2,
  blog: Rss,
  threads: Twitter,
  pinterest: Pin,
  other: Globe,
};

export function getPlatformIcon(key) {
  return ICON_MAP[key] || Globe;
}

export const PLATFORM_TYPE_OPTIONS = [
  { value: "video", label: "Long-form video" },
  { value: "short", label: "Short-form video" },
  { value: "photo", label: "Photo" },
  { value: "text", label: "Text" },
  { value: "audio", label: "Audio" },
  { value: "mixed", label: "Mixed" },
];

export const PLATFORM_TYPE_LABEL = PLATFORM_TYPE_OPTIONS.reduce((acc, o) => {
  acc[o.value] = o.label;
  return acc;
}, {});

export const PLATFORM_TYPE_COLORS = {
  video: "from-red-500/20 to-transparent border-red-500/30",
  short: "from-fuchsia-500/20 to-transparent border-fuchsia-500/30",
  photo: "from-sky-500/20 to-transparent border-sky-500/30",
  text: "from-emerald-500/20 to-transparent border-emerald-500/30",
  audio: "from-amber-500/20 to-transparent border-amber-500/30",
  mixed: "from-violet-500/20 to-transparent border-violet-500/30",
};

export const CONTENT_FORMAT_OPTIONS = [
  { value: "video", label: "Long video" },
  { value: "short", label: "Short video" },
  { value: "reel", label: "Reel / Short" },
  { value: "post", label: "Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "thread", label: "Thread" },
  { value: "article", label: "Article" },
  { value: "podcast", label: "Podcast episode" },
  { value: "live", label: "Live stream" },
  { value: "newsletter", label: "Newsletter" },
];

export const CONTENT_FORMAT_LABEL = CONTENT_FORMAT_OPTIONS.reduce((acc, o) => {
  acc[o.value] = o.label;
  return acc;
}, {});

/** Frontend mirror of backend PLATFORM_PRESETS keys. */
export const PLATFORM_PRESET_LIST = [
  { key: "youtube", label: "YouTube", color: "#ff0000", platform_type: "video" },
  { key: "instagram", label: "Instagram", color: "#e1306c", platform_type: "photo" },
  { key: "tiktok", label: "TikTok", color: "#00f2ea", platform_type: "short" },
  { key: "linkedin", label: "LinkedIn", color: "#0a66c2", platform_type: "text" },
  { key: "x", label: "X", color: "#e7e9ea", platform_type: "text" },
  { key: "facebook", label: "Facebook", color: "#1877f2", platform_type: "mixed" },
  { key: "podcast", label: "Podcast", color: "#a855f7", platform_type: "audio" },
  { key: "blog", label: "Blog", color: "#22c55e", platform_type: "text" },
  { key: "threads", label: "Threads", color: "#ffffff", platform_type: "text" },
  { key: "pinterest", label: "Pinterest", color: "#e60023", platform_type: "photo" },
  { key: "other", label: "Other", color: "#a78bfa", platform_type: "mixed" },
];

export function buildPlatformFormFromPreset(key) {
  const preset = PLATFORM_PRESET_LIST.find((p) => p.key === key) || PLATFORM_PRESET_LIST.at(-1);
  return {
    name: preset.label === "Other" ? "" : preset.label,
    description: "",
    color: preset.color,
    icon: preset.key,
    platform_type: preset.platform_type,
    account_handle: "",
    account_url: "",
    niche: "",
    current_followers: 0,
    engagement_rate_target: 4,
  };
}

export const calcEngagementRate = (analytics) => {
  if (!analytics) return 0;
  const views = Number(analytics.views) || 0;
  if (!views) return 0;
  const eng =
    (Number(analytics.likes) || 0) +
    (Number(analytics.comments) || 0) +
    (Number(analytics.shares) || 0) +
    (Number(analytics.clicks) || 0);
  return (eng / views) * 100;
};
