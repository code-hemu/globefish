import { PatternSyntaxError } from "../utils/errors.js";

function findMatchingClose(pattern: string, start: number): number {
  let depth = 1;
  for (let i = start + 1; i < pattern.length; i++) {
    if (pattern[i] === "\\") {
      i++;
      continue;
    }
    if (pattern[i] === "{") depth++;
    if (pattern[i] === "}") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function parseBraceParts(pattern: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "\\" && i + 1 < pattern.length) {
      current += pattern[i + 1];
      i += 2;
      continue;
    }
    if (ch === "{") {
      depth++;
      current += ch;
      i++;
      continue;
    }
    if (ch === "}") {
      depth--;
      if (depth < 0) break;
      current += ch;
      i++;
      continue;
    }
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }

  parts.push(current);
  return parts;
}

function findFirstBrace(s: string): number {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\") { i++; continue; }
    if (s[i] === "{") return i;
  }
  return -1;
}

function expandBrace(pattern: string): string[] {
  const idx = findFirstBrace(pattern);
  if (idx === -1) return [pattern];

  const closeIdx = findMatchingClose(pattern, idx);
  if (closeIdx === -1) {
    throw new PatternSyntaxError("Unclosed brace in pattern");
  }

  const prefix = pattern.slice(0, idx);
  const suffix = pattern.slice(closeIdx + 1);
  const inner = pattern.slice(idx + 1, closeIdx);
  const parts = parseBraceParts(inner);

  return parts.flatMap((part) =>
    expandBrace(prefix + part + suffix)
  );
}

export function expandPatterns(patterns: string | string[]): string[] {
  const input = Array.isArray(patterns) ? patterns : [patterns];
  return input.flatMap((p) => {
    if (findFirstBrace(p) !== -1) return expandBrace(p);
    return [p];
  });
}
