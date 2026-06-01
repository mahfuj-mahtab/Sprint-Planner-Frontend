import { Modal } from "@/components/org/Modal";
import { Field } from "@/components/org/Field";

export function PillarFormModal({ open, onClose, initial, onSubmit, saving }) {
  return (
    <Modal open={open} onClose={onClose} title={initial?._id ? "Edit pillar" : "New pillar"} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          onSubmit({
            name: fd.get("name"),
            description: fd.get("description"),
            color: fd.get("color"),
          });
        }}
        className="space-y-3"
      >
        <Field label="Name">
          <input name="name" className="ww-input w-full" defaultValue={initial?.name} required placeholder="Growth" />
        </Field>
        <Field label="Description">
          <textarea name="description" className="ww-input w-full" defaultValue={initial?.description} />
        </Field>
        <Field label="Color">
          <input name="color" type="color" className="h-10 w-full rounded cursor-pointer" defaultValue={initial?.color || "#00d4ff"} />
        </Field>
        <button type="submit" disabled={saving} className="ww-btn ww-btn-primary w-full">
          Save
        </button>
      </form>
    </Modal>
  );
}
