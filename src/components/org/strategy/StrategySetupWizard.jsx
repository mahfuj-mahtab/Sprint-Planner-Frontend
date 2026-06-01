import { useState } from "react";
import { ArrowRight, Check, Compass, Target, TrendingUp } from "lucide-react";
import { Field } from "@/components/org/Field";
import { cn } from "@/lib/utils";

const ICONS = { vision: Compass, okr: Target, kpi: TrendingUp };

export function StrategySetupWizard({ setup, canWrite, onSaveVision, onCreateOkr, onCreateKpi, onDismiss }) {
  const [step, setStep] = useState(0);
  const [vision, setVision] = useState("");
  const [bhag, setBhag] = useState("");
  const [okrTitle, setOkrTitle] = useState("");
  const [kr1, setKr1] = useState("");
  const [kr2, setKr2] = useState("");
  const [kpiName, setKpiName] = useState("");
  const [saving, setSaving] = useState(false);

  const steps = setup?.steps || [];
  const activeStep = steps[step];

  const handleVision = async () => {
    setSaving(true);
    try {
      await onSaveVision({ vision_10y: vision, bhag_title: bhag });
      setStep(1);
    } finally {
      setSaving(false);
    }
  };

  const handleOkr = async () => {
    if (!okrTitle.trim()) return;
    setSaving(true);
    try {
      const key_results = [kr1, kr2].filter(Boolean).map((title) => ({ title, target: null, current: 0, unit: "" }));
      await onCreateOkr({ title: okrTitle, key_results });
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const handleKpi = async () => {
    if (!kpiName.trim()) return;
    setSaving(true);
    try {
      await onCreateKpi({ name: kpiName, category: "growth" });
      onDismiss?.();
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite || setup?.is_complete) return null;

  return (
    <section className="relative rounded-2xl border border-primary/30 overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(0,255,148,0.12),transparent)] pointer-events-none" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-mono mb-2">Quick setup</p>
            <h2 className="text-xl font-semibold">Get your command center running</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">
              {setup.completed} of {setup.total} steps done — most teams finish in under 10 minutes.
            </p>
          </div>
          <div className="flex gap-2">
            {steps.map((s, i) => {
              const Icon = ICONS[s.id] || Compass;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
                    s.done
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : i === step
                        ? "border-border bg-card"
                        : "border-transparent text-muted-foreground"
                  )}
                >
                  {s.done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <div className="max-w-xl space-y-4">
            <Field label="10-year vision (one sentence)">
              <textarea
                className="ww-input w-full min-h-[72px]"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="e.g. Become the operating system for freelancers in South Asia"
              />
            </Field>
            <Field label="3–5 year BHAG (big goal)">
              <input
                className="ww-input w-full"
                value={bhag}
                onChange={(e) => setBhag(e.target.value)}
                placeholder="e.g. 100,000 active users"
              />
            </Field>
            <button
              type="button"
              disabled={saving || (!vision.trim() && !bhag.trim())}
              onClick={handleVision}
              className="ww-btn ww-btn-primary inline-flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-xl space-y-4">
            <Field label="This quarter's main objective">
              <input
                className="ww-input w-full"
                value={okrTitle}
                onChange={(e) => setOkrTitle(e.target.value)}
                placeholder="e.g. Acquire our first paying customers"
              />
            </Field>
            <Field label="Key result 1">
              <input className="ww-input w-full" value={kr1} onChange={(e) => setKr1(e.target.value)} placeholder="e.g. 25 paying merchants" />
            </Field>
            <Field label="Key result 2">
              <input className="ww-input w-full" value={kr2} onChange={(e) => setKr2(e.target.value)} placeholder="e.g. 500 signups" />
            </Field>
            <button
              type="button"
              disabled={saving || !okrTitle.trim()}
              onClick={handleOkr}
              className="ww-btn ww-btn-primary inline-flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-xl space-y-4">
            <Field label="One metric to track weekly">
              <input
                className="ww-input w-full"
                value={kpiName}
                onChange={(e) => setKpiName(e.target.value)}
                placeholder="e.g. Paying customers, MRR, Signups"
              />
            </Field>
            <button
              type="button"
              disabled={saving || !kpiName.trim()}
              onClick={handleKpi}
              className="ww-btn ww-btn-primary inline-flex items-center gap-2"
            >
              Finish setup <Check className="w-4 h-4" />
            </button>
          </div>
        )}

        {setup.percent >= 50 ? (
          <button type="button" onClick={onDismiss} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
            Skip wizard — I'll explore on my own
          </button>
        ) : null}
      </div>
    </section>
  );
}
