export const PARTITION_SCOPES = [
  { value: "business", label: "Business", hint: "Counts toward business revenue & ops spending" },
  { value: "owner", label: "Owner", hint: "Your pay / personal — not business revenue" },
  { value: "excluded", label: "Excluded", hint: "External income (e.g. other job) — hidden from business P&L" },
];

export const effectiveScope = (partition) => {
  const scope = partition?.scope;
  if (scope === "owner" || scope === "excluded") return scope;
  return "business";
};

export const scopeLabel = (scope) =>
  PARTITION_SCOPES.find((s) => s.value === effectiveScope({ scope }))?.label || "Business";

export const partitionsForExpense = (partitions, isPersonal) => {
  const list = partitions || [];
  if (isPersonal) {
    return list.filter((p) => {
      const s = effectiveScope(p);
      return s === "owner" || s === "excluded";
    });
  }
  return list.filter((p) => effectiveScope(p) === "business");
};

export const partitionsForIncomeHint = (partitions) => partitions || [];

export const partitionOptionLabel = (p, { showBalance, currency, formatMoney }) => {
  const scope = effectiveScope(p);
  const tag = scope === "business" ? "" : ` · ${scopeLabel(scope)}`;
  const bal =
    showBalance && formatMoney ? ` (${formatMoney(p.balance, currency, true)})` : "";
  return `${p.name}${tag}${bal}`;
};
