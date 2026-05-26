import { formatMoney } from "@/lib/formatMoney";
import { effectiveScope, PARTITION_SCOPES, scopeLabel } from "@/lib/partitionScopes";
import { cn } from "@/lib/utils";
import { Landmark, Smartphone, Banknote, Globe } from "lucide-react";
import { SelectInput } from "@/components/org/Field";

const TYPE_META = {
  bank: { icon: Landmark, label: "Bank" },
  mobile: { icon: Smartphone, label: "Mobile wallet" },
  cash: { icon: Banknote, label: "Cash" },
  online_wallet: { icon: Globe, label: "Online" },
};

const PARTITION_COLORS = ["bg-primary", "bg-[#00d4ff]", "bg-[#a78bfa]", "bg-[#ff6b35]", "bg-muted-foreground"];

export function AccountCard({ account, onSelect, selected, compact, onPartitionScopeChange }) {
  const meta = TYPE_META[account.type] || TYPE_META.bank;
  const Icon = meta.icon;
  const partitions = account.partitions || [];
  const total = Number(account.totalBalance) || 0;

  const Wrapper = onSelect ? "button" : "div";

  return (
    <Wrapper
      type={onSelect ? "button" : undefined}
      onClick={onSelect ? () => onSelect(account._id) : undefined}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-4 transition block",
        onSelect && "hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(0,255,148,0.08)]",
        selected ? "border-primary/50 ring-1 ring-primary/20" : "border-border",
        !onSelect && "cursor-default"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">{account.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {meta.label} · {account.currency}
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Total</div>
          <div className="font-mono text-lg text-primary tabular-nums">
            {formatMoney(total, account.currency, compact)}
          </div>
        </div>
      </div>

      {partitions.length > 0 && total > 0 && !compact ? (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden flex bg-muted/60">
          {partitions.map((p, i) => {
            const pct = Math.max(2, (Number(p.balance) / total) * 100);
            return (
              <div
                key={p._id}
                className={cn("h-full transition-all", PARTITION_COLORS[i % PARTITION_COLORS.length])}
                style={{ width: `${pct}%` }}
                title={`${p.name}: ${p.balance}`}
              />
            );
          })}
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-1.5", compact ? "mt-2" : "mt-2.5")}>
        {partitions.map((p, i) => (
          <div
            key={p._id}
            className="flex flex-wrap items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border border-border bg-muted/30"
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", PARTITION_COLORS[i % PARTITION_COLORS.length])} />
            <span className="font-medium truncate">{p.name}</span>
            <span className="font-mono tabular-nums text-foreground/90">
              {formatMoney(p.balance, account.currency, true)}
            </span>
            {p.is_default ? (
              <span className="text-[9px] uppercase text-primary">default</span>
            ) : null}
            {onPartitionScopeChange ? (
              <SelectInput
                value={effectiveScope(p)}
                onChange={(e) => onPartitionScopeChange(account._id, p._id, e.target.value)}
                className="ml-auto text-[11px] py-0.5 px-1.5 h-7 max-w-[7.5rem]"
                onClick={(e) => e.stopPropagation()}
              >
                {PARTITION_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            ) : effectiveScope(p) !== "business" ? (
              <span className="text-[9px] uppercase text-muted-foreground ml-auto">
                {scopeLabel(effectiveScope(p))}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
