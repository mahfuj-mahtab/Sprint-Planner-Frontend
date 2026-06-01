import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { STRATEGY_HELP } from "@/lib/strategy";
import { cn } from "@/lib/utils";

export function StrategyHelpNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#00d4ff]/25 bg-[#00d4ff]/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#00d4ff]/5 transition"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Info className="w-4 h-4 text-[#00d4ff] shrink-0" />
          {STRATEGY_HELP.title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-0 grid sm:grid-cols-2 gap-3 border-t border-[#00d4ff]/15">
          {STRATEGY_HELP.items.map((item) => (
            <div key={item.term} className="text-sm">
              <span className="font-semibold text-[#00d4ff]">{item.term}</span>
              <span className="text-muted-foreground"> — {item.meaning}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
