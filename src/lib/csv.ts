// Minimal CSV utilities — parse and serialize CSV without external dependencies.
// Handles quoted fields, escaped double-quotes, and CRLF line endings.

// Parse a CSV string into an array of rows, where each row is an array of strings.
// The first row is assumed to be the header row.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Strip a leading UTF-8 BOM if present (common when saving from Excel).
  if (input.charCodeAt(0) === 0xfeff) input = input.slice(1);

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote "" → literal "
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      // Treat \r\n or lone \r as a line break — flush current field first.
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i += input[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (ch === "\n") {
      // Flush current field before pushing the row.
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // Flush final field/row if any content remains.
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  // Drop trailing empty rows (common when CSV ends with a newline).
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") rows.pop();
    else break;
  }

  return rows;
}

// Convert rows (array of arrays) to a CSV string. Quotes fields containing
// commas, quotes, or newlines. Always emits \r\n line endings per RFC 4180.
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined): string => {
    const s = v == null ? "" : String(v);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return rows.map((r) => r.map(escape).join(",")).join("\r\n");
}

// Pick a value from a row object, tolerating header whitespace/case differences.
export function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] != null && row[k] !== "") return row[k];
  }
  // Fuzzy: case-insensitive + trimmed
  const lowered: Record<string, string> = {};
  for (const k of Object.keys(row)) lowered[k.toLowerCase().trim()] = row[k];
  for (const k of keys) {
    const v = lowered[k.toLowerCase().trim()];
    if (v != null && v !== "") return v;
  }
  return "";
}

// Convert the first row (headers) + remaining rows into an array of objects.
export function csvToObjects(input: string): Record<string, string>[] {
  const rows = parseCsv(input);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] ?? "").trim();
    });
    out.push(obj);
  }
  return out;
}
