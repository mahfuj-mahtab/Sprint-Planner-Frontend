export function formatMoney(value, currency = "BDT", compact = false) {
  const n = Number(value) || 0;
  if (compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "BDT",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "BDT",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

/** Hide exact figures for editor/viewer; owner and admin see real amounts. */
export function formatMoneySensitive(value, currency = "BDT", canSeeExact = true, compact = false) {
  if (!canSeeExact) return "—";
  return formatMoney(value, currency, compact);
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
