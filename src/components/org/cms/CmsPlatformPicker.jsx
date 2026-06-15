import { cn } from "@/lib/utils";
import {
  buildPlatformFormFromPreset,
  getPlatformIcon,
  PLATFORM_PRESET_LIST,
} from "@/lib/cms";

export function CmsPlatformPicker({ value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Pick a channel — each comes with a tailored workflow (Draft → Script → Publish, etc.)
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {PLATFORM_PRESET_LIST.map((preset) => {
          const Icon = getPlatformIcon(preset.key);
          const selected = value === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(buildPlatformFormFromPreset(preset.key))}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition text-center",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                  : "border-border bg-card/50 hover:border-primary/30 hover:bg-muted/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${preset.color}22`, color: preset.color }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-medium leading-tight">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
