const HEADER_ALIASES = {
  module: ["module", "mod", "modules"],
  sub_module: ["sub_module", "submodule", "sub module", "sub-module", "submodule_name", "sub"],
  feature: ["feature", "features", "feature_name", "name", "title"],
  description: ["description", "details", "desc", "notes", "note"],
};

function stripBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

function normalizeHeaderKey(raw) {
  const key = String(raw || "")
    .trim()
    .replace(/^\uFEFF/, "")
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

/** RFC 4180-style CSV parse — handles quoted fields and multiline cells. */
function parseCsvRecords(text, delimiter = ",") {
  const src = stripBom(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);

  return rows;
}

function detectDelimiter(headerLine) {
  const line = stripBom(headerLine);
  const comma = (line.match(/,/g) || []).length;
  const semi = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab >= comma && tab >= semi && tab > 0) return "\t";
  if (semi > comma) return ";";
  return ",";
}

/** Spreadsheet style: blank module/sub_module inherit from row above. */
export function fillSpreadsheetColumns(rows) {
  let lastModule = "";
  let lastSub = "";
  const filled = [];

  for (const row of rows) {
    const module = row.module?.trim() || lastModule;
    const sub_module = row.sub_module?.trim() || lastSub;
    if (module) lastModule = module;
    if (sub_module) lastSub = sub_module;

    filled.push({
      module,
      sub_module,
      feature: row.feature?.trim() || "",
      description: row.description?.trim() || "",
    });
  }

  return filled;
}

export function parseDelimitedText(text, delimiter) {
  const clean = stripBom(text);
  const delim = delimiter || detectDelimiter(clean.split(/\r?\n/)[0] || "");
  const records = parseCsvRecords(clean, delim);
  if (!records.length) return { rows: [], meta: { totalRecords: 0, importedRows: 0, skippedRows: 0 } };

  const headers = records[0].map(normalizeHeaderKey);
  const rawRows = [];
  let skippedRows = 0;

  for (let i = 1; i < records.length; i += 1) {
    const cells = records[i];
    if (cells.every((c) => !String(c).trim())) {
      skippedRows += 1;
      continue;
    }
    const raw = {};
    headers.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });
    rawRows.push(normalizeFeatureRow(raw));
  }

  const filled = fillSpreadsheetColumns(rawRows);
  const rows = filled.filter((row) => {
    if (row.module && row.feature) return true;
    skippedRows += 1;
    return false;
  });

  return {
    rows,
    meta: {
      totalRecords: records.length - 1,
      importedRows: rows.length,
      skippedRows,
      delimiter: delim,
    },
  };
}

/** Same feature name twice in one sub-module → make unique so all rows import. */
function dedupeFeatureNames(features) {
  const seen = new Map();
  return features.map((f) => {
    const base = f.name.trim();
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    if (count === 0) return { ...f, name: base };
    return { ...f, name: `${base} (${count + 1})` };
  });
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
      features: dedupeFeatureNames(features),
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
  let meta = {};

  if (lower.endsWith(".json")) {
    const text = await file.text();
    const modules = jsonToFeatureTree(JSON.parse(text));
    const totalFeatures = modules.reduce(
      (n, m) => n + (m.subModules || []).reduce((s, sub) => s + (sub.features?.length || 0), 0),
      0
    );
    return { modules, meta: { totalRecords: totalFeatures, importedRows: totalFeatures, skippedRows: 0 } };
  }

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = await file.text();
    const { rows, meta: m } = parseDelimitedText(text);
    meta = m;
    return { modules: rowsToFeatureTree(rows), meta };
  }

  if (lower.endsWith(".tsv")) {
    const text = await file.text();
    const { rows, meta: m } = parseDelimitedText(text, "\t");
    meta = m;
    return { modules: rowsToFeatureTree(rows), meta };
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel file has no sheets");
    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const normalized = jsonRows.map((row) => normalizeFeatureRow(row));
    const filled = fillSpreadsheetColumns(normalized);
    const rows = filled.filter((r) => r.module && r.feature);
    meta = {
      totalRecords: jsonRows.length,
      importedRows: rows.length,
      skippedRows: jsonRows.length - rows.length,
    };
    return { modules: rowsToFeatureTree(rows), meta };
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
