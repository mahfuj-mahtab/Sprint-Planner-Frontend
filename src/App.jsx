import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Link } from 'react-router-dom';
import Logo from '@/components/branding/Logo'
import { cn } from '@/lib/utils'

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function FadeIn({ children, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

const FLOW = [
  { step: '01', label: 'Organisation', icon: '⬡', desc: 'Create your org — the top-level workspace that houses all your projects and teams.', color: '#00ff94' },
  { step: '02', label: 'Projects',      icon: '◈', desc: 'Break work into projects. Each project owns its own teams, backlogs, and sprint cycles.', color: '#00d4ff' },
  { step: '03', label: 'Sprints',       icon: '◎', desc: 'Plan weekly or bi-weekly sprints. Time-box your goals and hold the team accountable.', color: '#ff6b35' },
  { step: '04', label: 'Tasks',         icon: '▣', desc: 'Assign tasks to team members with priority, status, and deadlines baked in.', color: '#a78bfa' },
]

const FEATURES = [
  { icon: '⚡', title: 'Sprint Planning',    desc: 'Build focused sprint plans in minutes. Move fast, ship fast, win the week.' },
  { icon: '🧑‍💻', title: 'Team Assignment',  desc: 'Assign tasks to specific members inside every project. Full ownership, no confusion.' },
  { icon: '📊', title: 'Priority & Status',  desc: 'Mark tasks Low / Medium / High. Track status from Pending to Completed in real time.' },
  { icon: '🗂️', title: 'Multi-Project Org', desc: 'Run multiple projects under one org. Keep cross-functional teams perfectly aligned.' },
  { icon: '🔔', title: 'Real-time Updates',  desc: 'Every edit, reassignment, and sprint change shows up instantly across your team.' },
  { icon: '🚀', title: 'Built for Velocity', desc: 'Lightweight and opinionated. Designed for dev teams that actually ship.' },
]

const BOARD_COLS = [
  { label: 'To Do',       color: '#64748b', tasks: [['Auth flow','High'],['DB schema','Medium']] },
  { label: 'In Progress', color: '#00d4ff', tasks: [['API routes','High']] },
  { label: 'Done',        color: '#00ff94', tasks: [['UI setup','Low'],['CI pipeline','Medium']] },
]
const PRI = { High: '#f87171', Medium: '#fb923c', Low: '#94a3b8' }
const AVS = ['JK','AS','MR','PR','TN','YL']
let avi = 0

export default function App() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ── */}
      <header
        className={cn(
          "ww-glass fixed inset-x-0 top-0 z-50 border-b transition-all",
          scrolled ? "border-border bg-background/90" : "border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Logo to="/" />

          <nav className="hidden items-center gap-8 md:flex">
            {["Features", "How it Works", "Team", "Contact"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/user/login"
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-[13px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/user/register"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground transition hover:brightness-95 hover:shadow-[0_8px_24px_rgba(0,255,148,0.35)]"
              >
                Get started →
              </Link>
            </div>

            <button
              className="flex flex-col gap-1.5 rounded-md border border-border bg-transparent p-2 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-0.5 w-5 rounded bg-muted-foreground transition"
                  style={{
                    transform:
                      open && i === 0
                        ? "rotate(45deg) translate(5px,5px)"
                        : open && i === 2
                          ? "rotate(-45deg) translate(5px,-5px)"
                          : "none",
                    opacity: open && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — must live OUTSIDE <header> because backdrop-filter creates a
          new containing block that traps position:fixed children inside it */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col gap-2 overflow-y-auto border-t border-border bg-background px-6 py-4 transition",
          open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        {["Features", "How it Works", "Team", "Contact"].map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase().replace(/ /g, "-")}`}
            onClick={() => setOpen(false)}
            className="border-b border-border py-4 text-base font-medium text-muted-foreground hover:text-primary"
          >
            {l}
          </a>
        ))}
        <div className="flex gap-2 pt-2">
          <Link
            to="/user/login"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
          >
            Log in
          </Link>
          <Link
            to="/user/register"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-bold text-primary-foreground hover:brightness-95"
          >
            Get started →
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="ww-dot-bg relative overflow-hidden px-6 pb-20 pt-32">
        <div className="pointer-events-none absolute left-[5%] top-[10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,255,148,0.08)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute right-0 top-[30%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.07)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-[1200px]">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <div className="ww-tag mb-5 border-primary/25 bg-primary/10 text-primary">
                Built for dev teams
              </div>
              <h1 className="ww-heading text-[clamp(2rem,6vw,3.8rem)] leading-[1.1]">
                <span className="block">Win every week.</span>
                <span className="block text-muted-foreground">Ship every sprint.</span>
              </h1>
              <p className="mt-6 max-w-[520px] text-[1.05rem] leading-8 text-muted-foreground">
                WeekWins is a sprint-driven project manager for small dev teams.
                Organise work into{' '}
                <strong className="text-foreground/80">orgs → projects → sprints → tasks</strong>.
                Stop context-switching. Start shipping.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/user/register" className="ww-btn-primary">
                  Start for free →
                </Link>
                <a href="#how-it-works" className="ww-btn-outline">
                  See how it works
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-10">
                {[
                  ["10x", "faster sprint planning"],
                  ["100%", "team visibility"],
                  ["0", "wasted stand-ups"],
                ].map(([n, l]) => (
                  <div key={n}>
                    <div className="ww-heading text-2xl text-primary">{n}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground" style={{ fontFamily: "DM Mono, monospace" }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgba(0,0,0,0.60)]">
                <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-3">
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <div key={c} className="h-[11px] w-[11px] rounded-full" style={{ background: c }} />
                  ))}
                  <span className="ml-2 text-[11px] text-muted-foreground" style={{ fontFamily: "DM Mono, monospace" }}>
                    weekwins — sprint #12
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                  {BOARD_COLS.map((col, ci) => (
                    <div key={col.label} className={cn(ci > 0 ? "hidden sm:block" : "", ci === 2 ? "hidden md:block" : "")}>
                      <div
                        className="mb-2 text-[10px] uppercase tracking-[0.10em]"
                        style={{ fontFamily: "DM Mono, monospace", color: col.color }}
                      >
                        {col.label}
                      </div>
                      {col.tasks.map(([task, pri]) => {
                        const av = AVS[avi++ % AVS.length]
                        return (
                          <div key={task} className="mb-2 rounded-lg border border-border bg-muted px-3 py-2">
                            <div className="mb-2 text-xs font-medium text-foreground/90">{task}</div>
                            <div className="flex items-center justify-between">
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[10px]"
                                style={{
                                  fontFamily: "DM Mono, monospace",
                                  color: PRI[pri],
                                  background: `${PRI[pri]}18`,
                                }}
                              >
                                {pri}
                              </span>
                              <div
                                className="grid h-5 w-5 place-items-center rounded-full border border-border text-[8px] text-muted-foreground"
                                style={{ fontFamily: "DM Mono, monospace" }}
                              >
                                {av}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 border-t border-border px-4 py-3">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                  <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "DM Mono, monospace" }}>
                    Sprint ends in 3d 14h · 6/9 tasks done
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-secondary px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <div className="mb-14 text-center">
              <div className="ww-tag mb-4 border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.10)] text-[#00d4ff]">
                The WeekWins Model
              </div>
              <h2 className="ww-heading text-[clamp(1.7rem,4vw,2.8rem)]">One structure. Zero chaos.</h2>
              <p className="mt-3 text-base text-muted-foreground">Every piece of work has a home — and a deadline.</p>
            </div>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((f, i) => (
              <FadeIn key={f.label} delay={i * 100}>
                <div className="ww-card ww-card-hover h-full">
                  <div
                    className="mb-4 grid h-12 w-12 place-items-center rounded-xl border text-xl"
                    style={{ background: `${f.color}15`, borderColor: `${f.color}30` }}
                  >
                    {f.icon}
                  </div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "DM Mono, monospace", color: f.color }}>
                    Step {f.step}
                  </div>
                  <h3 className="ww-heading text-base">{f.label}</h3>
                  <p className="mt-2 text-[13.5px] leading-7 text-muted-foreground">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="ww-dot-bg bg-background px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <div className="mb-14 text-center">
              <div className="ww-tag mb-4 border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.10)] text-[#a78bfa]">
                Features
              </div>
              <h2 className="ww-heading text-[clamp(1.7rem,4vw,2.8rem)]">Everything your team actually needs.</h2>
              <p className="mt-3 text-base text-muted-foreground">
                No bloat. No 200-tab dashboards. Just the features that move work forward.
              </p>
            </div>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 70}>
                <div className="ww-card ww-card-hover h-full">
                  <div className="mb-4 text-[1.8rem]">{f.icon}</div>
                  <h3 className="ww-heading text-base">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-7 text-muted-foreground">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-secondary px-6 py-20">
        <div className="mx-auto max-w-[860px]">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0d1117,#111827)] px-8 py-12 text-center">
              <div className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,148,0.10)_0%,transparent_70%)]" />
              <div className="ww-tag mb-5 border-primary/25 bg-primary/10 text-primary">Free to start</div>
              <h2 className="ww-heading text-[clamp(1.7rem,4vw,2.8rem)]">Ready to win your first week?</h2>
              <p className="mx-auto mt-3 max-w-[440px] text-base text-muted-foreground">
                Set up your org, create a sprint, assign tasks — and actually ship what you planned.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/user/register" className="ww-btn-primary">
                  Create your org →
                </Link>
                <a href="#features" className="ww-btn-outline">
                  View demo
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-background px-6 py-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <Logo to="/" size="sm" />
            <div className="text-[11px] text-muted-foreground" style={{ fontFamily: "DM Mono, monospace" }}>
              © 2026 WeekWins · Built for dev teams that ship
            </div>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Contact"].map((l) => (
                <a key={l} href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
