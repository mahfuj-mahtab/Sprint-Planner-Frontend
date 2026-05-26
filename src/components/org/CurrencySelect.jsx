import { SelectInput } from "@/components/org/Field";
import { currencySelectOptions } from "@/lib/financeCurrencies";

export function CurrencySelect({ value, onChange, className, required }) {
  const options = currencySelectOptions(value);

  return (
    <SelectInput
      required={required}
      value={value || "BDT"}
      onChange={onChange}
      className={className}
    >
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </SelectInput>
  );
}
