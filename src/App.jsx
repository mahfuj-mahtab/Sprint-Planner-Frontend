import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/branding/Logo";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  GitBranch,
  Kanban,
  Layers,
  LineChart,
  Repeat,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, className }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Modules", href: "#modules" },
  { label: "Weekly loop", href: "#weekly-loop" },
  { label: "Built for", href: "#built-for" },
];

const SCATTERED_STACK = [
  { need: "Clients", tool: "Random CRM" },
  { need: "Projects", tool: "Notion / Jira" },
  { need: "Releases", tool: "Spreadsheets" },
  { need: "Subscriptions", tool: "Another billing app" },
  { need: "Cashflow", tool: "Google Sheets" },
  { need: "Goals", tool: "Manual notes" },
  { need: "Weekly planning", tool: "Trello / sticky notes" },
];

const PRODUCT_MODULES = [
  {
    id: "clients",
    label: "Clients",
    color: "#ff6b35",
    icon: Users,
    headline: "CRM tied to the work you ship",
    description:
      "Track leads, follow-ups, activity logs, and payment history — linked to projects and finance, not a separate spreadsheet.",
    points: ["Pipeline & follow-ups", "Client-linked projects", "Payment history"],
  },
  {
    id: "projects",
    label: "Projects",
    color: "#00d4ff",
    icon: Layers,
    headline: "Every engagement in one hub",
    description:
      "Run sprints, features, versions, docs, and teams per project from a single workspace sidebar.",
    points: ["Project dashboards", "Feature modules", "Team assignments"],
  },
  {
    id: "releases",
    label: "Releases",
    color: "#a78bfa",
    icon: GitBranch,
    headline: "Plan and ship with version control",
    description:
      "Lock versions, snapshot features, and move work through sprints on a Kanban board built for shipping.",
    points: ["Version snapshots", "Sprint boards", "Release progress"],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    color: "#f87171",
    icon: Repeat,
    headline: "See recurring burn clearly",
    description:
      "Track SaaS and infra subscriptions by month — planned vs running burn, right next to your cashflow.",
    points: ["Monthly recurring costs", "Burn forecasting", "Partition-aware"],
  },
  {
    id: "cashflow",
    label: "Cashflow",
    color: "#00ff94",
    icon: Wallet,
    headline: "Founder finance in context",
    description:
      "Multi-account money with business vs personal partitions, income, expenses, transfers, and P&L by scope.",
    points: ["Partitioned accounts", "Income & expenses", "Business-only P&L"],
  },
  {
    id: "goals",
    label: "Goals",
    color: "#eab308",
    icon: Target,
    headline: "Save toward what matters",
    description:
      "Set financial goals, allocate from partitions, and see reserved balances as you plan the month.",
    points: ["Goal allocations", "Reserved balances", "Progress tracking"],
  },
  {
    id: "weekly-planning",
    label: "Weekly Planning",
    color: "#38bdf8",
    icon: CalendarClock,
    headline: "Win every week with a sprint rhythm",
    description:
      "Plan sprints, assign tasks to your team, and track personal todos with capacity — all in one operational view.",
    points: ["Sprint planning", "Kanban workflow", "Personal capacity"],
  },
];

const WORKSPACE_LAYERS = [
  { label: "Organization", desc: "One workspace for your whole business" },
  { label: "Projects", desc: "Delivery, releases, and docs per product or client" },
  { label: "Finance & CRM", desc: "Cash, subscriptions, goals, and clients together" },
  { label: "Weekly execution", desc: "Sprints, tasks, and personal todos" },
];

const WEEKLY_LOOP = [
  {
    step: "01",
    title: "Plan the week",
    color: "#00d4ff",
    icon: CalendarClock,
    description: "Pick sprint scope, review cash and subscriptions, set follow-ups.",
  },
  {
    step: "02",
    title: "Run delivery",
    color: "#00ff94",
    icon: Kanban,
    description: "Move tasks on the board, log client activity, record expenses.",
  },
  {
    step: "03",
    title: "Ship releases",
    color: "#a78bfa",
    icon: GitBranch,
    description: "Close versions, update features, chase payments due this week.",
  },
  {
    step: "04",
    title: "Review the business",
    color: "#ff6b35",
    icon: LineChart,
    description: "Check org dashboards — delivery, CRM revenue, burn, and goals in one place.",
  },
];

const BUILT_FOR = [
  "Solo developers",
  "Indie founders",
  "Freelancers",
  "Technical founders",
  "2–8 person studios",
];

function HeroWorkspaceVisual() {
  const [active, setActive] = useState("weekly-planning");

  const previews = {
    clients: (
      <div className="space-y-2 text-[11px]">
        {[
          ["Acme Studio", "Follow-up Fri", "#ff6b35"],
          ["Northwind", "Paid · v2.1", "#00ff94"],
          ["Beta lead", "Proposal sent", "#00d4ff"],
        ].map(([name, status, color]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="font-medium">{name}</span>
            <span className="font-mono text-[10px]" style={{ color }}>
              {status}
            </span>
          </div>
        ))}
      </div>
    ),
    projects: (
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          ["Client app", "3 sprints"],
          ["SaaS core", "v1.4 active"],
          ["Internal tool", "2 members"],
          ["Docs site", "Ship week"],
        ].map(([name, meta]) => (
          <div key={name} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="font-medium">{name}</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">{meta}</div>
          </div>
        ))}
      </div>
    ),
    releases: (
      <div className="flex items-center gap-2 text-[11px]">
        {["v1.3 Plan", "Sprint 14", "Auth ship"].map((t, i) => (
          <div
            key={t}
            className={cn(
              "flex-1 rounded-lg border px-2 py-3 text-center",
              i === 1 ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
            )}
          >
            {t}
          </div>
        ))}
      </div>
    ),
    subscriptions: (
      <div className="space-y-2 text-[11px]">
        {[
          ["AWS", "−৳ 12k/mo"],
          ["Figma", "−৳ 800/mo"],
          ["Stripe", "−৳ 2.1k/mo"],
        ].map(([name, amt]) => (
          <div key={name} className="flex justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">{name}</span>
            <span className="font-mono text-destructive/90">{amt}</span>
          </div>
        ))}
        <div className="pt-1 font-mono text-[10px] text-primary">Burn · ৳ 38k / mo</div>
      </div>
    ),
    cashflow: (
      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Business cash</span>
          <span className="text-primary">৳ 842k</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">This month net</span>
          <span className="text-primary">+৳ 64k</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[72%] rounded-full bg-primary" />
        </div>
      </div>
    ),
    goals: (
      <div className="space-y-2 text-[11px]">
        {[
          ["New laptop fund", "68%"],
          ["Tax reserve", "41%"],
        ].map(([name, pct]) => (
          <div key={name} className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{name}</span>
              <span className="font-mono text-[#eab308]">{pct}</span>
            </div>
            <div className="h-1 rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#eab308]" style={{ width: pct }} />
            </div>
          </div>
        ))}
      </div>
    ),
    "weekly-planning": (
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {[
          ["Backlog", "2 tasks", "#64748b"],
          ["Building", "API billing", "#00d4ff"],
          ["Done", "UI polish", "#00ff94"],
        ].map(([col, task, color]) => (
          <div key={col} className="rounded-lg border border-border bg-muted/30 p-2">
            <div className="font-mono text-[9px] uppercase mb-1.5" style={{ color }}>
              {col}
            </div>
            <div className="leading-snug">{task}</div>
          </div>
        ))}
      </div>
    ),
  };

  const activeModule = PRODUCT_MODULES.find((m) => m.id === active);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
        </div>
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          WeekWins · Your org workspace
        </span>
      </div>

      <div className="grid lg:grid-cols-[180px_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r border-border bg-secondary/40 p-3">
          <div className="mb-3 px-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Modules
          </div>
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {PRODUCT_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = active === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActive(mod.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition",
                    isActive
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? mod.color : undefined }} />
                  <span className="whitespace-nowrap">{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 min-h-[220px]">
          {activeModule && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: activeModule.color }}>
                    {activeModule.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{activeModule.headline}</div>
                </div>
                <div
                  className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border"
                  style={{ borderColor: `${activeModule.color}40`, background: `${activeModule.color}12`, color: activeModule.color }}
                >
                  <activeModule.icon className="h-4 w-4" />
                </div>
              </div>
              {previews[activeModule.id]}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={cn(
          "ww-glass fixed inset-x-0 top-0 z-50 border-b transition-all",
          scrolled ? "border-border bg-background/90" : "border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1140px] items-center justify-between px-6">
          <Logo to="/" />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/user/login"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-[13px] font-semibold text-foreground transition hover:border-primary/40"
              >
                Log in
              </Link>
              <Link
                to="/user/register"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground transition hover:brightness-95 hover:shadow-[0_8px_24px_rgba(0,255,148,0.35)]"
              >
                Start Free
              </Link>
            </div>
            <button
              type="button"
              className="flex flex-col gap-1.5 rounded-md border border-border p-2 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-0.5 w-5 rounded bg-muted-foreground"
                  style={{
                    transform:
                      open && i === 0
                        ? "rotate(45deg) translate(5px, 5px)"
                        : open && i === 2
                          ? "rotate(-45deg) translate(5px, -5px)"
                          : "none",
                    opacity: open && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-1 overflow-y-auto border-t border-border bg-background px-6 py-4 transition md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {NAV.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="border-b border-border py-3 text-sm font-medium text-muted-foreground"
          >
            {l.label}
          </a>
        ))}
        <div className="flex gap-2 pt-3">
          <Link to="/user/login" onClick={() => setOpen(false)} className="flex-1 ww-btn-outline text-center text-sm py-2">
            Log in
          </Link>
          <Link to="/user/register" onClick={() => setOpen(false)} className="flex-1 ww-btn-primary text-center text-sm py-2">
            Start Free
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="ww-dot-bg relative overflow-hidden px-6 pb-20 pt-28 md:pb-28 md:pt-32">
        <div className="pointer-events-none absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,255,148,0.08)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute right-[-5%] top-[15%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.07)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1140px]">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="ww-tag mb-5 border-primary/25 bg-primary/10 text-primary">
                One workspace · seven modules
              </div>
              <h1 className="ww-heading text-[clamp(2rem,5.5vw,3.35rem)] leading-[1.06] tracking-tight">
                Run Your Software Business In One Place
              </h1>
              <p className="mt-5 max-w-[540px] text-[1.05rem] leading-relaxed text-muted-foreground">
                Manage clients, projects, releases, subscriptions, cashflow, goals, and weekly planning
                without switching between five different tools.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/user/register" className="ww-btn-primary inline-flex items-center gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#modules" className="ww-btn-outline inline-flex items-center gap-2">
                  See all modules
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {PRODUCT_MODULES.map((mod) => (
                  <span
                    key={mod.id}
                    className="rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-mono text-muted-foreground"
                  >
                    {mod.label}
                  </span>
                ))}
              </div>
            </div>
            <HeroWorkspaceVisual />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-secondary px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="max-w-2xl">
              <div className="ww-tag mb-4 border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]">The problem</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)] leading-tight">
                Five different tools. One scattered week.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                You already juggle clients, delivery, money, and planning — but each lives in a different tab.
                WeekWins replaces that stack with one org-scoped workspace built for software businesses.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <FadeIn delay={80}>
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
                  <X className="h-3.5 w-3.5 text-destructive/80" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Today · five different tools
                  </span>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {SCATTERED_STACK.map((row) => (
                      <tr key={row.need} className="border-t border-border/60">
                        <td className="px-4 py-3 text-foreground/90">{row.need}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{row.tool}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>

            <FadeIn delay={140} className="flex items-center justify-center py-2 lg:py-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <ArrowRight className="h-5 w-5 hidden lg:block" />
                <ArrowRight className="h-5 w-5 lg:hidden rotate-90" />
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="h-full overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[0_0_40px_rgba(0,255,148,0.08)]">
                <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-3">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">With WeekWins</span>
                </div>
                <div className="p-6">
                  <Logo size="sm" />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    One login. One sidebar.{" "}
                    <strong className="text-foreground">Clients, projects, releases, subscriptions, cashflow, goals,</strong>{" "}
                    and <strong className="text-foreground">weekly planning</strong> — linked to the same org and projects.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {PRODUCT_MODULES.map((mod) => (
                      <li key={mod.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {mod.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="ww-dot-bg px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="max-w-2xl">
              <div className="ww-tag mb-4 border-primary/25 bg-primary/10 text-primary w-fit">The platform</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)] leading-tight">
                Everything rolls up to one organization.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                WeekWins is not a bundle of unrelated apps. Projects, CRM, finance, and weekly execution share
                the same data — so a client payment, a sprint task, and a subscription all make sense together.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {WORKSPACE_LAYERS.map((layer, i) => (
              <FadeIn key={layer.label} delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-border bg-card p-5">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                    Layer {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold">{layer.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
                  {i < WORKSPACE_LAYERS.length - 1 && (
                    <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary lg:block" />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={320}>
            <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-secondary/60 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                How data connects
              </div>
              <div className="grid gap-px bg-border sm:grid-cols-3">
                {[
                  ["Client payment", "→ Income in finance", "→ Linked project P&L"],
                  ["Sprint task", "→ Feature status", "→ Release progress"],
                  ["Subscription", "→ Monthly burn", "→ Cashflow forecast"],
                ].map(([a, b, c]) => (
                  <div key={a} className="bg-card p-5 text-sm">
                    <div className="font-medium text-foreground">{a}</div>
                    <div className="mt-2 text-muted-foreground">{b}</div>
                    <div className="mt-1 text-primary font-mono text-[11px]">{c}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-t border-border bg-secondary px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <div className="ww-tag mb-4 border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa] mx-auto w-fit">
                Product modules
              </div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)]">
                Seven areas. One connected workspace.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Each module maps to real screens inside WeekWins — not marketing fluff on a landing page.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {PRODUCT_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <FadeIn key={mod.id} delay={i * 60}>
                  <div className="ww-card ww-card-hover h-full flex flex-col">
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${mod.color}40`, background: `${mod.color}12`, color: mod.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: mod.color }}>
                      {mod.label}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{mod.headline}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                    <ul className="mt-4 space-y-1.5 mt-auto pt-4">
                      {mod.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="h-1 w-1 rounded-full shrink-0" style={{ background: mod.color }} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Weekly loop */}
      <section id="weekly-loop" className="ww-dot-bg px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <div className="ww-tag mb-4 border-primary/25 bg-primary/10 text-primary mx-auto w-fit">Weekly loop</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)]">
                How founders actually run the week.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Plan, deliver, ship, and review — without leaving the workspace.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WEEKLY_LOOP.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.step} delay={i * 90}>
                  <div className="ww-card h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Step {step.step}
                      </span>
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg border"
                        style={{ borderColor: `${step.color}40`, background: `${step.color}12`, color: step.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for */}
      <section id="built-for" className="border-t border-border bg-secondary px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
              <div>
                <div className="ww-tag mb-3 border-border bg-muted text-muted-foreground w-fit">Built for</div>
                <h2 className="ww-heading text-2xl md:text-3xl">
                  Software businesses run by small teams — not enterprises.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
                  WeekWins is opinionated on purpose: delivery, money, clients, and weekly planning in one place
                  for people who ship code and run the business at the same time.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {BUILT_FOR.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground/90"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[760px] text-center">
          <FadeIn>
            <h2 className="ww-heading text-[clamp(1.5rem,4vw,2.5rem)] leading-tight">
              Run Your Software Business In One Place
            </h2>
            <p className="mt-4 text-muted-foreground text-[1.05rem] leading-relaxed">
              Manage clients, projects, releases, subscriptions, cashflow, goals, and weekly planning
              without switching between five different tools.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/user/register" className="ww-btn-primary inline-flex items-center gap-2">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/user/login" className="ww-btn-outline">
                Log in
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-border bg-secondary px-6 py-8">
        <div className="mx-auto max-w-[1140px] flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo to="/" size="sm" />
          <p className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} WeekWins · Clients · Projects · Releases · Cashflow · Weekly planning
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#modules" className="hover:text-primary">
              Modules
            </a>
            <Link to="/user/register" className="hover:text-primary">
              Start Free
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
