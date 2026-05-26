import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/branding/Logo";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  GitBranch,
  Kanban,
  Layers,
  LineChart,
  Receipt,
  Repeat,
  Sparkles,
  Target,
  Users,
  Wallet,
  Workflow,
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
  { label: "The problem", href: "#problem" },
  { label: "Workflow", href: "#workflow" },
  { label: "Built for", href: "#built-for" },
  { label: "Outcomes", href: "#outcomes" },
];

const FRAGMENTED_TOOLS = [
  { problem: "Tasks", tool: "Trello / Jira" },
  { problem: "Docs & specs", tool: "Notion" },
  { problem: "Money", tool: "Spreadsheets" },
  { problem: "Clients", tool: "Random CRM" },
  { problem: "Subscriptions", tool: "Another app" },
];

const WORKFLOW_PHASES = [
  {
    phase: "Plan",
    color: "#00d4ff",
    icon: GitBranch,
    items: ["Features", "Versions", "Sprints"],
    line: "Shape what you’re building before the week starts.",
  },
  {
    phase: "Ship",
    color: "#00ff94",
    icon: Target,
    items: ["Tasks", "Reviews", "Releases"],
    line: "Move work across the board with a team that knows who owns what.",
  },
  {
    phase: "Operate",
    color: "#ff6b35",
    icon: Users,
    items: ["Clients", "Payments", "Subscriptions"],
    line: "Follow up, log activity, and see who owes you — next to the work.",
  },
  {
    phase: "Understand",
    color: "#a78bfa",
    icon: LineChart,
    items: ["Cashflow", "Burn", "Profitability"],
    line: "Founder finance tied to projects, not a disconnected sheet.",
  },
];

const BUILT_FOR = [
  "Solo developers",
  "Indie hackers",
  "Freelancers",
  "Tiny software studios",
  "Technical founders",
];

const OUTCOME_GROUPS = [
  {
    title: "Delivery",
    color: "#00d4ff",
    items: ["Sprints & Kanban", "Roadmap & versions", "Project dashboards"],
  },
  {
    title: "Operations",
    color: "#ff6b35",
    items: ["CRM & follow-ups", "Client activity logs", "Pipeline visibility"],
  },
  {
    title: "Finance",
    color: "#00ff94",
    items: ["Partitioned accounts", "Subscriptions & burn", "Income & expenses"],
  },
  {
    title: "Execution",
    color: "#a78bfa",
    items: ["Personal todos", "Team capacity", "Org-wide clarity"],
  },
];

const FOUNDER_PAINS = [
  {
    q: "Where is my money going?",
    a: "Subscription forecasting and founder finance — partitions, burn, and cash by scope.",
    icon: Wallet,
  },
  {
    q: "Which clients haven’t paid?",
    a: "CRM linked to payment history and projects, not a spreadsheet on the side.",
    icon: CircleDollarSign,
  },
  {
    q: "What’s actually shipping?",
    a: "Sprint workflow, versions, and analytics on the same work your team touches daily.",
    icon: Kanban,
  },
  {
    q: "Am I overloaded this week?",
    a: "See sprint load, assignments, and personal todos in one operational picture.",
    icon: CalendarClock,
  },
];

const DEMO_PANELS = [
  {
    caption: "Track founder burn and cash by partition.",
    title: "Finance overview",
    accent: "#00ff94",
    body: (
      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex justify-between text-muted-foreground">
          <span>Business cash</span>
          <span className="text-primary">৳ 842k</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Subscriptions / mo</span>
          <span className="text-destructive">−৳ 38k</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[68%] rounded-full bg-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">This month · business partitions</p>
      </div>
    ),
  },
  {
    caption: "Plan releases visually.",
    title: "Version → Sprint",
    accent: "#00d4ff",
    body: (
      <div className="flex gap-2">
        {["v1.2 Ship", "Sprint 14", "Auth refactor"].map((t, i) => (
          <div
            key={t}
            className={cn(
              "flex-1 rounded-lg border px-2 py-2 text-[10px]",
              i === 1 ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
            )}
          >
            {t}
          </div>
        ))}
      </div>
    ),
  },
  {
    caption: "See project profitability.",
    title: "Project P&L",
    accent: "#a78bfa",
    body: (
      <div className="space-y-1.5 font-mono text-[11px]">
        {[
          ["Client app", "+৳ 120k", "text-primary"],
          ["Internal tool", "−৳ 18k", "text-destructive"],
          ["SaaS core", "+৳ 64k", "text-primary"],
        ].map(([name, amt, cls]) => (
          <div key={name} className="flex justify-between">
            <span className="text-muted-foreground">{name}</span>
            <span className={cls}>{amt}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    caption: "Manage work and money together.",
    title: "Connected workspace",
    accent: "#ff6b35",
    body: (
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg border border-border bg-muted/40 p-2">
          <div className="text-primary font-medium">In progress</div>
          <div className="mt-1 text-muted-foreground">API billing hook</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2">
          <div className="text-[#00d4ff] font-medium">Client</div>
          <div className="mt-1 text-muted-foreground">Acme · follow-up Fri</div>
        </div>
      </div>
    ),
  },
];

function HeroConnectedVisual() {
  return (
    <div className="relative">
      <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-background shadow-[0_0_24px_rgba(0,255,148,0.2)]">
        <Layers className="h-5 w-5 text-primary" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/80 px-4 py-2.5">
            <Target className="h-3.5 w-3.5 text-[#00d4ff]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#00d4ff]">Delivery</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Sprint 14 · Ship week</span>
              <span className="font-mono text-primary">7/9 done</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full w-[78%] rounded-full bg-primary" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Backlog", "2", "#64748b"],
                ["Building", "API routes", "#00d4ff"],
                ["Done", "UI polish", "#00ff94"],
              ].map(([col, task, c]) => (
                <div key={col} className="rounded-lg border border-border bg-muted/30 p-2">
                  <div className="font-mono text-[9px] uppercase mb-1.5" style={{ color: c }}>
                    {col}
                  </div>
                  <div className="text-[11px] text-foreground/90 leading-snug">{task}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/80 px-4 py-2.5">
            <Banknote className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Operations</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">MRR</div>
                <div className="mt-1 font-mono text-lg text-primary">৳ 186k</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Due</div>
                <div className="mt-1 font-mono text-lg text-[#00d4ff]">2 clients</div>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-border/80 p-3 space-y-2">
              {[
                ["Stripe infra", "−৳ 4.2k/mo"],
                ["Figma", "−৳ 800/mo"],
              ].map(([n, amt]) => (
                <div key={n} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> {n}
                  </span>
                  <span className="font-mono text-destructive/90">{amt}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <Receipt className="h-3 w-3" />
              Linked to projects & clients
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground lg:hidden">
        Delivery and operations in one connected workspace.
      </p>
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
                Start free
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
            Start free
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="ww-dot-bg relative overflow-hidden px-6 pb-24 pt-28 md:pt-32">
        <div className="pointer-events-none absolute left-[8%] top-[12%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(0,255,148,0.07)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute right-0 top-[20%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.06)_0%,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1140px]">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="ww-tag mb-5 border-primary/25 bg-primary/10 text-primary">
                For indie founders & tiny studios
              </div>
              <h1 className="ww-heading text-[clamp(2rem,5.5vw,3.25rem)] leading-[1.08] tracking-tight">
                Run your software business in one place.
              </h1>
              <p className="mt-5 max-w-[520px] text-[1.05rem] leading-relaxed text-muted-foreground">
                WeekWins connects sprint planning, founder finance, CRM, and execution — so you stop
                juggling Trello, spreadsheets, and five other tabs to understand if you’re actually winning.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/user/register" className="ww-btn-primary inline-flex items-center gap-2">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#workflow" className="ww-btn-outline inline-flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Explore workflow
                </a>
              </div>
              <p className="mt-6 text-xs text-muted-foreground font-mono">
                Solo devs · freelancers · technical founders · 2–8 person studios
              </p>
            </div>
            <HeroConnectedVisual />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-y border-border bg-secondary px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="max-w-2xl">
              <div className="ww-tag mb-4 border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]">The problem</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)] leading-tight">
                Your startup probably runs across too many tools.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                You ship code in one app, track money in a sheet, chase clients in another — and still wonder
                what’s true this week. That’s operational chaos, not a discipline problem.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <FadeIn delay={80}>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Today · fragmented
                </div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {FRAGMENTED_TOOLS.map((row) => (
                      <tr key={row.problem} className="border-t border-border/60">
                        <td className="px-4 py-3 text-muted-foreground">{row.problem}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-foreground/70">{row.tool}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>

            <FadeIn delay={160} className="flex justify-center py-4 lg:py-0">
              <div className="flex flex-col items-center gap-2 text-primary">
                <ChevronRight className="h-8 w-8 hidden lg:block" />
                <ArrowRight className="h-6 w-6 lg:hidden rotate-90" />
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-[0_0_40px_rgba(0,255,148,0.08)]">
                <div className="border-b border-primary/20 bg-primary/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-primary">
                  With WeekWins
                </div>
                <div className="p-6 space-y-4">
                  <Logo size="sm" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    One workspace for <strong className="text-foreground">delivery, clients, subscriptions, and cash</strong> —
                    tied to the same projects and sprints you ship from.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {["Projects & sprints", "CRM & follow-ups", "Income, expenses & partitions", "Team & personal execution"].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="ww-dot-bg px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <div className="ww-tag mb-4 border-primary/25 bg-primary/10 text-primary mx-auto w-fit">The workflow</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)]">How founders actually run the week.</h2>
              <p className="mt-3 text-muted-foreground">
                Not a feature list — the loop from plan to ship to operate to understand.
              </p>
            </div>
          </FadeIn>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_PHASES.map((w, i) => {
              const Icon = w.icon;
              return (
                <FadeIn key={w.phase} delay={i * 90}>
                  <div className="ww-card h-full flex flex-col">
                    <div
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border"
                      style={{ borderColor: `${w.color}40`, background: `${w.color}12`, color: w.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: w.color }}>
                      {w.phase}
                    </div>
                    <ul className="space-y-1 text-sm font-medium mb-3">
                      {w.items.map((item) => (
                        <li key={item} className="text-foreground/90">
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-auto">{w.line}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for */}
      <section id="built-for" className="bg-secondary px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="ww-tag mb-3 border-border bg-muted text-muted-foreground w-fit">Built for</div>
                <h2 className="ww-heading text-2xl md:text-3xl">Founders who ship software — not enterprises.</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md md:text-right">
                Sharp positioning beats “works for any team.” WeekWins is opinionated on purpose.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {BUILT_FOR.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground/90"
                >
                  {label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Outcomes */}
      <section id="outcomes" className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="text-center max-w-xl mx-auto mb-14">
              <div className="ww-tag mb-4 border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa] mx-auto w-fit">Outcomes</div>
              <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.5rem)]">Modules, organized by what you’re trying to see.</h2>
            </div>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOME_GROUPS.map((g, i) => (
              <FadeIn key={g.title} delay={i * 70}>
                <div className="ww-card ww-card-hover h-full">
                  <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: g.color }}>
                    {g.title}
                  </div>
                  <ul className="space-y-2">
                    {g.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: g.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Founder pains */}
      <section className="ww-dot-bg border-t border-border px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <h2 className="ww-heading text-[clamp(1.5rem,4vw,2.2rem)] text-center max-w-2xl mx-auto">
              The questions that keep you up — answered in one workspace.
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FOUNDER_PAINS.map((card, i) => {
              const Icon = card.icon;
              return (
                <FadeIn key={card.q} delay={i * 80}>
                  <div className="ww-card h-full border-l-2 border-l-primary/50">
                    <Icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="text-lg font-semibold text-foreground">{card.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.a}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo panels */}
      <section className="bg-secondary px-6 py-20 md:py-24">
        <div className="mx-auto max-w-[1140px]">
          <FadeIn>
            <div className="mb-12 max-w-xl">
              <div className="ww-tag mb-3 border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]">See it</div>
              <h2 className="ww-heading text-2xl md:text-3xl">Operational clarity, not dashboard noise.</h2>
            </div>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2">
            {DEMO_PANELS.map((panel, i) => (
              <FadeIn key={panel.title} delay={i * 60}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="p-5 min-h-[140px]">{panel.body}</div>
                  <div className="border-t border-border bg-muted/30 px-5 py-4">
                    <p className="text-xs font-medium text-primary mb-1">{panel.caption}</p>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">{panel.title}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[800px] text-center">
          <FadeIn>
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-4" />
            <div className="ww-tag mb-5 border-primary/25 bg-primary/10 text-primary mx-auto w-fit">
              Philosophy
            </div>
            <h2 className="ww-heading text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
              Built for operational clarity.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Most tools help you create tasks. WeekWins helps you understand your business, ship consistently,
              and reduce the chaos of running a software company — without becoming an enterprise suite.
            </p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                ["Understand", "Cash, clients, and delivery in context."],
                ["Ship", "Weekly rhythm your team can feel."],
                ["Reduce chaos", "Fewer tabs, fewer surprises."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-border bg-card/50 p-4">
                  <div className="text-sm font-semibold text-primary">{t}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-secondary px-6 py-20">
        <div className="mx-auto max-w-[720px] text-center">
          <FadeIn>
            <h2 className="ww-heading text-[clamp(1.5rem,4vw,2.4rem)] leading-tight">
              Stop running your startup across disconnected tools.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create a workspace. Invite your team. Run the week in one place.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/user/register" className="ww-btn-primary inline-flex items-center gap-2">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/user/login" className="ww-btn-outline">
                Log in
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-[1140px] flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo to="/" size="sm" />
          <p className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} WeekWins · For founders who run software businesses
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#workflow" className="hover:text-primary">
              Workflow
            </a>
            <Link to="/user/register" className="hover:text-primary">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
