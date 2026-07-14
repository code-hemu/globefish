import type { IgnoreRule } from "../types/index.js";
import { normalizePath } from "../utils/path.js";

export function parseIgnorePattern(pattern: string): IgnoreRule {
  let p = pattern.trim();
  let negate = false;
  let dirOnly = false;
  let anchored = false;

  if (p.startsWith("!")) {
    negate = true;
    p = p.slice(1).trim();
  }

  if (p.startsWith("/")) {
    anchored = true;
    p = p.slice(1);
  }

  if (p.endsWith("/")) {
    dirOnly = true;
    p = p.slice(0, -1);
  }

  p = normalizePath(p);

  return { pattern: p, negate, dirOnly, anchored };
}

export function parseIgnorePatterns(patterns: string[]): IgnoreRule[] {
  return patterns
    .filter((p) => p.trim().length > 0)
    .map(parseIgnorePattern);
}
