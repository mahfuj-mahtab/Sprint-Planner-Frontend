/** ISO 4217 codes used in finance forms */
export const FINANCE_CURRENCIES = [
  { code: "BDT", label: "BDT — Bangladeshi Taka" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "PKR", label: "PKR — Pakistani Rupee" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "AED", label: "AED — UAE Dirham" },
];

export const FINANCE_CURRENCY_CODES = FINANCE_CURRENCIES.map((c) => c.code);

export const defaultFinanceCurrency = (preferred) => {
  const code = (preferred || "BDT").trim().toUpperCase();
  if (FINANCE_CURRENCY_CODES.includes(code)) return code;
  return "BDT";
};

/** Options for &lt;select&gt;, including a stored code not in the preset list */
export const currencySelectOptions = (currentCode) => {
  const code = (currentCode || "").trim().toUpperCase();
  const base = [...FINANCE_CURRENCIES];
  if (code && !FINANCE_CURRENCY_CODES.includes(code)) {
    base.unshift({ code, label: `${code} (custom)` });
  }
  return base;
};
