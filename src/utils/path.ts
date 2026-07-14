export function normalizePath(p: string): string {
  p = p.replace(/\\/g, "/");
  if (p === "/") return p;
  if (p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function splitPath(p: string): string[] {
  p = normalizePath(p);
  if (p === "") return [];
  return p.split("/").filter(Boolean);
}
