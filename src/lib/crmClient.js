export const CLIENT_STATUSES = [
  { value: "lead", label: "Lead", color: "bg-amber-500/15 text-amber-200 border-amber-500/30" },
  { value: "active", label: "Active", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "negotiation", label: "Negotiation", color: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30" },
  { value: "on_hold", label: "On hold", color: "bg-muted text-muted-foreground border-border" },
  { value: "past", label: "Past", color: "bg-muted/50 text-muted-foreground border-border" },
];

export const CLIENT_TYPES = [
  { value: "prospect", label: "Prospect" },
  { value: "project", label: "Project-based" },
  { value: "retainer", label: "Retainer" },
  { value: "both", label: "Retainer + projects" },
];

export const CLIENT_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

export const LOG_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "message", label: "Message" },
];

export const statusMeta = (status) =>
  CLIENT_STATUSES.find((s) => s.value === status) || CLIENT_STATUSES[0];

export const logTypeLabel = (type) =>
  LOG_TYPES.find((t) => t.value === type)?.label || "Note";

export const emptyClientForm = (currency = "BDT") => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  notes: "",
  status: "lead",
  client_type: "prospect",
  priority: "normal",
  currency,
  hourly_rate: "",
  expected_value: "",
  referral_source: "",
  tags: "",
  next_follow_up: "",
  parent_client_id: "",
});

export const clientToForm = (c, currency = "BDT") => ({
  name: c.name || "",
  email: c.email || "",
  phone: c.phone || "",
  company: c.company || "",
  website: c.website || "",
  notes: c.notes || "",
  status: c.status || "lead",
  client_type: c.client_type || "prospect",
  priority: c.priority || "normal",
  currency: c.currency || currency,
  hourly_rate: c.hourly_rate != null ? String(c.hourly_rate) : "",
  expected_value: c.expected_value != null ? String(c.expected_value) : "",
  referral_source: c.referral_source || "",
  tags: (c.tags || []).join(", "),
  next_follow_up: c.next_follow_up
    ? new Date(c.next_follow_up).toISOString().slice(0, 10)
    : "",
  parent_client_id: c.parent_client_id?._id || c.parent_client_id || "",
});

export const LIST_FILTERS = [
  { id: "all", label: "All" },
  { id: "lead", label: "Leads" },
  { id: "active", label: "Active" },
  { id: "negotiation", label: "Negotiation" },
  { id: "on_hold", label: "On hold" },
  { id: "follow_up", label: "Follow-up due" },
];
