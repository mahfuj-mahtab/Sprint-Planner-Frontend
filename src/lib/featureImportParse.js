const HEADER_ALIASES = {
  module: ["module", "mod", "modules"],
  sub_module: ["sub_module", "submodule", "sub module", "sub-module", "submodule_name", "sub"],
  feature: ["feature", "features", "feature_name", "name", "title"],
  description: ["description", "details", "desc", "notes", "note"],
};

function normalizeHeaderKey(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key) || canonical === key) return canonical;
  }
  return key.replace(/\s+/g, "_");
}

export function normalizeFeatureRow(raw) {
  const normalized = {};
  for (const [k, v] of Object.entries(raw || {})) {
    normalized[normalizeHeaderKey(k)] = String(v ?? "").trim();
  }
  return {
    module: normalized.module || "",
    sub_module: normalized.sub_module || "",
    feature: normalized.feature || "",
    description: normalized.description || "",
  };
}

/** Parse one CSV/TSV line respecting quoted fields. */
function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

export function parseDelimitedText(text, delimiter = ",") {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const headerCells = parseDelimitedLine(lines[0], delimiter);
  const headers = headerCells.map(normalizeHeaderKey);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseDelimitedLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) continue;
    const raw = {};
    headers.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });
    const row = normalizeFeatureRow(raw);
    if (row.module && row.feature) rows.push(row);
  }

  return rows;
}

export function rowsToFeatureTree(rows) {
  const modules = new Map();

  for (const row of rows) {
    const modName = row.module?.trim();
    const subName = row.sub_module?.trim() || "General";
    const featName = row.feature?.trim();
    if (!modName || !featName) continue;

    if (!modules.has(modName)) modules.set(modName, new Map());
    const subs = modules.get(modName);
    if (!subs.has(subName)) subs.set(subName, []);
    subs.get(subName).push({
      name: featName,
      description: row.description?.trim() || "",
    });
  }

  if (!modules.size) {
    throw new Error("No valid rows found. Need at least module and feature columns.");
  }

  return Array.from(modules.entries()).map(([name, subs]) => ({
    name,
    subModules: Array.from(subs.entries()).map(([subName, features]) => ({
      name: subName,
      features,
    })),
  }));
}

export function jsonToFeatureTree(parsed) {
  const list = Array.isArray(parsed) ? parsed : parsed?.modules;
  if (!Array.isArray(list) || !list.length) {
    throw new Error("JSON must be an array of modules or { modules: [...] }");
  }
  return list;
}

export async function parseFeatureImportFile(file) {
  if (!file) throw new Error("No file selected");

  const lower = file.name.toLowerCase();

  if (lower.endsWith(".json")) {
    const text = await file.text();
    return jsonToFeatureTree(JSON.parse(text));
  }

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = await file.text();
    return rowsToFeatureTree(parseDelimitedText(text, ","));
  }

  if (lower.endsWith(".tsv")) {
    const text = await file.text();
    return rowsToFeatureTree(parseDelimitedText(text, "\t"));
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel file has no sheets");
    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const rows = jsonRows.map((row) => normalizeFeatureRow(row)).filter((r) => r.module && r.feature);
    return rowsToFeatureTree(rows);
  }

  throw new Error("Unsupported file. Use CSV, TSV, Excel (.xlsx), or JSON.");
}

export const FEATURE_CSV_TEMPLATE = `module,sub_module,feature,description
User Management,Authentication,Email login,Sign in with email and password
User Management,Authentication,Password reset,Forgot password flow
User Management,Profile,Edit profile,
User Management,Profile,Avatar upload,
Billing,Payments,Stripe checkout,
Billing,Payments,Invoice history,
`;

export function downloadCsvTemplate() {
  const blob = new Blob([FEATURE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feature-tree-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
