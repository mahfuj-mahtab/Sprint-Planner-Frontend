import { Modal } from "@/components/org/Modal";
import { Field, SelectInput } from "@/components/org/Field";
import { KPI_CATEGORY_LABELS } from "@/lib/strategy";

export function KpiFormModal({ open, onClose, initial, onSubmit, saving }) {
  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? "Edit metric" : "New metric"} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          onSubmit({
            name: fd.get("name"),
            category: fd.get("category"),
            unit: fd.get("unit"),
            target_value: fd.get("target_value") ? Number(fd.get("target_value")) : null,
            current_value: fd.get("current_value") ? Number(fd.get("current_value")) : 0,
            frequency: fd.get("frequency"),
          });
        }}
        className="space-y-3"
      >
        <Field label="Metric name">
          <input name="name" className="ww-input w-full" defaultValue={initial?.name} required placeholder="MRR, Signups, Churn" />
        </Field>
        <Field label="Category">
          <SelectInput name="category" defaultValue={initial?.category || "growth"}>
            {Object.entries(KPI_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target">
            <input name="target_value" type="number" className="ww-input w-full" defaultValue={initial?.target_value ?? ""} />
          </Field>
          <Field label="Unit">
            <input name="unit" className="ww-input w-full" defaultValue={initial?.unit} placeholder="$, %, users" />
          </Field>
        </div>
        <Field label="Frequency">
          <SelectInput name="frequency" defaultValue={initial?.frequency || "weekly"}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </SelectInput>
        </Field>
        <button type="submit" disabled={saving} className="ww-btn ww-btn-primary w-full">
          {saving ? "Saving…" : "Save metric"}
        </button>
      </form>
    </Modal>
  );
}
