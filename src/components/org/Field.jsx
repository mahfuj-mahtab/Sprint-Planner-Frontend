import { cn } from "@/lib/utils";

export function Field({ label, hint, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <label className="ww-label mb-0">{label}</label> : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SelectInput({ className, ...props }) {
  return (
    <select
      className={cn("ww-input w-full appearance-none cursor-pointer", className)}
      {...props}
    />
  );
}
