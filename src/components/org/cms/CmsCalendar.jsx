import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalIcon } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/ApiInception";
import { cn } from "@/lib/utils";
import { formatCmsDateTime, getPlatformIcon } from "@/lib/cms";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const KIND_OPTIONS = [
  { value: "all", label: "Scheduled + published" },
  { value: "scheduled", label: "Scheduled only" },
  { value: "published", label: "Published only" },
];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isoDate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

export function CmsCalendar({ orgId, platforms = [] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]);
  const [platformId, setPlatformId] = useState("");
  const [kind, setKind] = useState("all");

  useEffect(() => {
    if (!platforms.length) {
      setPlatformId("");
      return;
    }
    setPlatformId((prev) => {
      if (prev && platforms.some((p) => p._id === prev)) return prev;
      return platforms[0]._id;
    });
  }, [platforms]);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  useEffect(() => {
    if (!orgId || !platformId) {
      setDays([]);
      return;
    }
    let active = true;
    setLoading(true);
    const start = isoDate(monthStart);
    const end = isoDate(monthEnd);
    api
      .get(`/api/v1/org/${orgId}/cms/calendar`, {
        params: { start, end, platform_id: platformId, kind },
      })
      .then((r) => {
        if (!active) return;
        setDays(r.data?.days || []);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err?.response?.data?.message || "Failed to load calendar", { theme: "dark" });
        setDays([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orgId, monthStart, monthEnd, platformId, kind]);

  const dayMap = useMemo(() => {
    const m = new Map();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const grid = useMemo(() => {
    const first = new Date(monthStart);
    const firstWeekday = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      const d = new Date(first);
      d.setDate(first.getDate() - (firstWeekday - i));
      cells.push({ date: d, inMonth: false });
    }
    const last = monthEnd;
    for (let day = 1; day <= last.getDate(); day += 1) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), inMonth: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const lastCell = cells[cells.length - 1].date;
      const next = new Date(lastCell);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [monthStart, monthEnd, cursor]);

  const selectedPlatform = useMemo(
    () => platforms.find((p) => p._id === platformId) || null,
    [platforms, platformId]
  );

  const monthLabel = useMemo(
    () => cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [cursor]
  );

  if (!platforms.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <CalIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Add a platform first to use the content calendar.</p>
      </div>
    );
  }

  const PlatformIcon = selectedPlatform ? getPlatformIcon(selectedPlatform.icon) : CalIcon;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <CalIcon className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-semibold truncate">{monthLabel}</h3>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform</label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background min-w-[140px]"
            >
              {platforms.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Show</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background min-w-[150px]"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="p-1.5 rounded border border-border hover:border-primary/40"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="text-xs px-2 py-1 rounded border border-border"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="p-1.5 rounded border border-border hover:border-primary/40"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedPlatform ? (
        <div className="px-4 py-2 border-b border-border/40 bg-muted/10 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
            style={{
              borderColor: `${selectedPlatform.color || "#ec4899"}55`,
              color: selectedPlatform.color || "#ec4899",
            }}
          >
            <PlatformIcon className="w-3.5 h-3.5" />
            {selectedPlatform.name}
          </span>
          <span>· calendar shows content for this platform only</span>
        </div>
      ) : null}

      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/20">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 text-center"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map(({ date, inMonth }, idx) => {
          const key = isoDate(date);
          const data = dayMap.get(key);
          const items = data?.items || [];
          const isToday = isoDate(new Date()) === key;
          const color = selectedPlatform?.color || "#ec4899";
          return (
            <div
              key={idx}
              className={cn(
                "min-h-[96px] border-b border-r border-border/40 p-1.5 align-top",
                !inMonth && "bg-muted/10 text-muted-foreground/60"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isToday && "rounded-full bg-primary text-primary-foreground px-1.5"
                  )}
                >
                  {date.getDate()}
                </span>
                {items.length ? (
                  <span className="text-[9px] text-muted-foreground">{items.length}</span>
                ) : null}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((it) => (
                  <div
                    key={`${it._id}-${it.kind}`}
                    className="text-[10px] truncate rounded border px-1.5 py-0.5"
                    style={{
                      borderColor: `${color}66`,
                      backgroundColor: `${color}18`,
                      color,
                    }}
                    title={`${it.title} — ${formatCmsDateTime(it.at)} (${it.kind})`}
                  >
                    <span className="opacity-70 mr-1">{it.kind === "published" ? "●" : "○"}</span>
                    {it.title}
                  </div>
                ))}
                {items.length > 3 ? (
                  <div className="text-[10px] text-muted-foreground">+{items.length - 3} more</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
