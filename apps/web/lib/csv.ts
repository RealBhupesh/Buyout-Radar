export function csvCell(value: string | number | null): string {
  let s = value === null ? "Unavailable" : String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/.test(s))
    s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
