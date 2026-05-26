import { Eye } from "lucide-react";

export function ReadOnlyBanner({ reason }) {
  if (!reason) return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3 text-left">
      <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-100">Read-only view</p>
        <p className="text-sm text-amber-200/80 mt-0.5">{reason}</p>
      </div>
    </div>
  );
}
