import Logo from "@/components/branding/Logo"
import { cn } from "@/lib/utils"

export default function AuthShell({ children, title, subtitle, kicker = "Welcome back", sideTitle, sideSubtitle, features = [] }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      <aside className="relative hidden md:flex flex-col justify-between overflow-hidden border-r border-border bg-secondary p-12">
        <div className="ww-dot-bg absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,255,148,0.10)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.10)_0%,transparent_70%)]" />

        <div className="relative z-10">
          <Logo to="/" size="lg" />
        </div>

        <div className="relative z-10">
          <div className="ww-tag mb-4 border-primary/25 bg-primary/10 text-primary">{kicker}</div>
          <h2 className="ww-heading text-3xl leading-tight">
            {sideTitle || "Plan the sprint."} <span className="text-muted-foreground">{sideSubtitle || "Ship the product."}</span>
          </h2>

          <div className="mt-8 space-y-3">
            {features.map((f, i) => (
              <div
                key={f.label || i}
                className={cn(
                  "ww-card ww-card-hover flex items-start gap-4 p-5",
                  "bg-card/90"
                )}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted text-foreground/90">
                  <span className="text-base">{f.icon}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{f.label}</div>
                  <div className="mt-0.5 text-[13px] leading-6 text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-border pt-6 text-[13px] italic text-muted-foreground">
          “Focus on outcomes, not busywork.”
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8">
            <Logo to="/" />
          </div>

          <div className="mb-8">
            <h1 className="ww-heading text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
          </div>

          <div className="ww-card">{children}</div>
        </div>
      </main>
    </div>
  )
}

