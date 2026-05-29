export const DEBT_DIRECTIONS = {
  lent: "lent",
  borrowed: "borrowed",
};

export const isDebtLent = (debt) => (debt?.direction || "lent") === "lent";

export const debtDirectionLabel = (direction) =>
  direction === "borrowed" ? "You borrowed" : "You lent";

export const debtDirectionBadgeClass = (direction) =>
  direction === "borrowed"
    ? "bg-amber-500/15 text-amber-200 border-amber-500/35"
    : "bg-violet-500/15 text-violet-300 border-violet-500/35";

export const debtPrincipalLabel = (direction) =>
  direction === "borrowed" ? "borrowed" : "lent";
