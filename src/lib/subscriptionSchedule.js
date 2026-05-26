/** Client-side monthly burn (mirrors backend). */
export const monthlyEquivalent = (amount, interval, customDays = 30) => {
  const a = Number(amount) || 0;
  switch (interval) {
    case "weekly":
      return a * (52 / 12);
    case "monthly":
      return a;
    case "quarterly":
      return a / 3;
    case "yearly":
      return a / 12;
    case "custom":
      return a * (30 / Math.max(1, Number(customDays) || 30));
    default:
      return a;
  }
};
