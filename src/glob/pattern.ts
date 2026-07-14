import { PatternSyntaxError } from "../utils/errors.js";
import type { PatternNode } from "../types/index.js";

const EXTGLOSS = ["?(", "*(", "+(", "@(", "!("] as const;

export function parsePattern(pattern: string): PatternNode[] {
  const nodes: PatternNode[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "\\" && i + 1 < pattern.length) {
      nodes.push({ type: "literal", value: pattern[i + 1] });
      i += 2;
      continue;
    }

    if (ch === "/") {
      nodes.push({ type: "separator" });
      i++;
      continue;
    }

    const extglob = tryParseExtglob(pattern, i);
    if (extglob) {
      nodes.push(extglob.node);
      i = extglob.nextIndex;
      continue;
    }

    if (ch === "*" && i + 1 < pattern.length && pattern[i + 1] === "*") {
      if (i + 2 < pattern.length && pattern[i + 2] === "/") {
        nodes.push({ type: "globstar" });
        nodes.push({ type: "separator" });
        i += 3;
        continue;
      }
      if (i + 2 < pattern.length && pattern[i + 2] !== "/") {
        nodes.push({ type: "star" });
        nodes.push({ type: "star" });
        i += 2;
        continue;
      }
      nodes.push({ type: "globstar" });
      i += 2;
      continue;
    }

    if (ch === "*") {
      nodes.push({ type: "star" });
      i++;
      continue;
    }

    if (ch === "?") {
      nodes.push({ type: "qmark" });
      i++;
      continue;
    }

    if (ch === "[") {
      const result = parseCharClass(pattern, i);
      nodes.push(result.node);
      i = result.nextIndex;
      continue;
    }

    nodes.push({ type: "literal", value: ch });
    i++;
  }

  return nodes;
}

function tryParseExtglob(
  pattern: string,
  start: number
): { node: PatternNode; nextIndex: number } | null {
  for (const eg of EXTGLOSS) {
    if (
      pattern.startsWith(eg, start)
    ) {
      const kind = eg[0] as "?" | "*" | "+" | "@" | "!";
      const closeIdx = findMatchingParen(pattern, start + 1);
      if (closeIdx === -1) {
        throw new PatternSyntaxError("Unclosed extended glob group");
      }
      const inner = pattern.slice(start + 2, closeIdx);
      const alternatives = parseExtglobInner(inner);
      return { node: { type: "extglob", kind, alternatives }, nextIndex: closeIdx + 1 };
    }
  }
  return null;
}

function findMatchingParen(pattern: string, start: number): number {
  let depth = 1;
  for (let i = start + 1; i < pattern.length; i++) {
    if (pattern[i] === "\\") { i++; continue; }
    if (pattern[i] === "(") depth++;
    if (pattern[i] === ")") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function parseExtglobInner(inner: string): PatternNode[][] {
  const alternatives: PatternNode[][] = [];
  let current = "";
  let depth = 0;
  let i = 0;

  while (i < inner.length) {
    const ch = inner[i];
    if (ch === "\\" && i + 1 < inner.length) {
      current += inner[i] + inner[i + 1];
      i += 2;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") { depth++; current += ch; i++; continue; }
    if (ch === ")" || ch === "]" || ch === "}") { depth--; current += ch; i++; continue; }
    if (ch === "|" && depth === 0) {
      alternatives.push(parsePattern(current));
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  alternatives.push(parsePattern(current));

  return alternatives;
}

function parseCharClass(
  pattern: string,
  start: number
): { node: PatternNode; nextIndex: number } {
  let i = start + 1;
  let negated = false;

  if (i < pattern.length && (pattern[i] === "!" || pattern[i] === "^")) {
    negated = true;
    i++;
  }

  let chars = "";
  if (i < pattern.length && pattern[i] === "]") {
    chars += "]";
    i++;
  }
  while (i < pattern.length && pattern[i] !== "]") {
    if (pattern[i] === "\\" && i + 1 < pattern.length) {
      chars += pattern[i + 1];
      i += 2;
      continue;
    }
    if (i + 2 < pattern.length && pattern[i + 1] === "-" && pattern[i + 2] !== "]") {
      const start = pattern[i].charCodeAt(0);
      const end = pattern[i + 2].charCodeAt(0);
      if (start <= end) {
        for (let c = start; c <= end; c++) {
          chars += String.fromCharCode(c);
        }
        i += 3;
        continue;
      }
    }
    chars += pattern[i];
    i++;
  }

  if (i >= pattern.length) {
    throw new PatternSyntaxError("Unclosed character class in pattern");
  }

  i++;

  return { node: { type: "charclass", chars, negated }, nextIndex: i };
}
