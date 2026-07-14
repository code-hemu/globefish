import type { PatternNode } from "../types/index.js";
import { normalizePath, splitPath } from "../utils/path.js";
import { parsePattern } from "./pattern.js";

export interface MatchOptions {
  dot?: boolean;
}


function matchSegment(
  segment: string,
  nodes: PatternNode[],
  options: MatchOptions
): boolean {
  let si = 0;
  let ni = 0;

  while (ni < nodes.length && si <= segment.length) {
    const node = nodes[ni];

    if (node.type === "literal") {
      if (segment.startsWith(node.value, si)) {
        si += node.value.length;
        ni++;
      } else {
        return false;
      }
    } else if (node.type === "qmark") {
      if (si < segment.length) {
        if (!options.dot && si === 0 && segment.startsWith(".") && segment !== "." && segment !== "..") return false;
        si++;
        ni++;
      } else {
        return false;
      }
    } else if (node.type === "star") {
      if (!options.dot && si === 0 && segment.startsWith(".") && segment !== "." && segment !== "..") return false;
      if (ni + 1 < nodes.length) {
        const nextNode = nodes[ni + 1];
        if (nextNode.type === "literal") {
          const lastIdx = segment.lastIndexOf(nextNode.value);
          if (lastIdx < si) return false;
          si = lastIdx + nextNode.value.length;
          ni += 2;
        } else if (nextNode.type === "qmark" || nextNode.type === "charclass") {
          if (tryStarSplit(segment, si, nodes, ni, options)) return true;
          return false;
        } else {
          return matchSegment(segment.slice(si), nodes.slice(ni + 1), options);
        }
      } else {
        if (!options.dot && si === 0 && segment.startsWith(".") && segment !== "." && segment !== "..") return false;
        si = segment.length;
        ni++;
      }
    } else if (node.type === "charclass") {
      if (si < segment.length) {
        const char = segment[si];
        const matches = node.chars.includes(char) !== node.negated;
        if (!matches) return false;
        si++;
        ni++;
      } else {
        return false;
      }
    } else if (node.type === "separator") {
      ni++;
    } else if (node.type === "extglob") {
      return matchExtglobWithinSegment(
        segment, si, node.kind, node.alternatives,
        nodes.slice(ni + 1), options
      );
    } else if (node.type === "globstar") {
      ni++;
    } else {
      ni++;
    }
  }

  return si === segment.length && ni === nodes.length;
}

function tryStarSplit(
  segment: string,
  si: number,
  nodes: PatternNode[],
  ni: number,
  options: MatchOptions
): boolean {
  const memo = new Map<string, boolean>();
  for (let i = si; i <= segment.length; i++) {
    const subKey = segment.slice(i) + "|" + (ni + 1);
    if (memo.has(subKey) ? memo.get(subKey)! : matchSegment(segment.slice(i), nodes.slice(ni + 1), options)) {
      return true;
    }
    memo.set(subKey, false);
  }
  return false;
}

function canRepeatMatch(
  s: string,
  alternatives: PatternNode[][],
  options: MatchOptions,
  memo: Map<string, boolean> = new Map()
): boolean {
  if (s.length === 0) return true;
  const key = s;
  if (memo.has(key)) return memo.get(key)!;
  for (const alt of alternatives) {
    for (let i = 1; i <= s.length; i++) {
      const sub = s.slice(0, i);
      if (matchSegment(sub, alt, options)) {
        if (canRepeatMatch(s.slice(i), alternatives, options, memo)) {
          memo.set(key, true);
          return true;
        }
      }
    }
  }
  memo.set(key, false);
  return false;
}

function matchExtglobWithinSegment(
  segment: string,
  si: number,
  kind: "?" | "*" | "+" | "@" | "!",
  alternatives: PatternNode[][],
  remainingNodes: PatternNode[],
  options: MatchOptions
): boolean {
  const remaining = segment.slice(si);

  const altMatches = (sub: string): boolean => {
    for (const alt of alternatives) {
      if (matchSegment(sub, alt, options)) return true;
    }
    return false;
  };

  for (let end = remaining.length; end >= 0; end--) {
    const prefix = remaining.slice(0, end);
    const suffix = remaining.slice(end);

    let ok = false;
    switch (kind) {
      case "@":
        ok = end > 0 && altMatches(prefix);
        break;
      case "?":
        ok = (end === 0) || (end > 0 && altMatches(prefix));
        break;
      case "*":
        if (end === 0) { ok = true; break; }
        ok = canRepeatMatch(prefix, alternatives, options);
        break;
      case "+":
        if (end === 0) { ok = false; break; }
        ok = canRepeatMatch(prefix, alternatives, options);
        break;
      case "!":
        if (end === 0) { ok = !altMatches(""); break; }
        ok = !altMatches(prefix);
        break;
    }

    if (ok && matchSegment(suffix, remainingNodes, options)) {
      return true;
    }
  }

  return false;
}

function matchPathSegments(
  pathSegments: string[],
  patternSegments: PatternNode[][],
  options: MatchOptions,
  pi: number = 0,
  si: number = 0
): boolean {
  if (pi >= patternSegments.length && si >= pathSegments.length) return true;
  if (pi >= patternSegments.length) return false;

  const currentPatternNodes = patternSegments[pi];

  // Check if current pattern segment is a globstar (possibly with trailing separator)
  let isGlobstar = false;

  if (
    currentPatternNodes.length === 1 &&
    currentPatternNodes[0].type === "globstar"
  ) {
    isGlobstar = true;
  } else if (
    currentPatternNodes.length >= 2 &&
    currentPatternNodes[0].type === "globstar" &&
    currentPatternNodes[1].type === "separator"
  ) {
    isGlobstar = true;
  } else if (
    currentPatternNodes.length >= 1 &&
    currentPatternNodes[0].type === "separator" &&
    currentPatternNodes.length >= 2 &&
    currentPatternNodes[1].type === "globstar"
  ) {
    isGlobstar = true;
  }

  if (isGlobstar) {
    // globstar matches zero or more path segments
    // Try matching zero segments: skip this globstar pattern segment and try next
    if (
      matchPathSegments(
        pathSegments,
        patternSegments,
        options,
        pi + 1,
        si
      )
    ) return true;

    // Try matching one or more segments
    if (si < pathSegments.length) {
      const seg = pathSegments[si];
      if (!options.dot && seg.startsWith(".")) return false;
      return matchPathSegments(
        pathSegments,
        patternSegments,
        options,
        pi,
        si + 1
      );
    }

    return false;
  }

  if (si >= pathSegments.length) {
    if (matchSegment("", currentPatternNodes, options)) {
      return matchPathSegments(pathSegments, patternSegments, options, pi + 1, si);
    }
    return false;
  }

  const seg = pathSegments[si];

  if (!options.dot && seg.startsWith(".") && seg !== "." && seg !== "..") {
    const firstNode = currentPatternNodes[0];
    let hasLeadingDot = false;
    if (firstNode.type === "literal" && firstNode.value === ".") {
      hasLeadingDot = true;
    } else if (firstNode.type === "charclass" && !firstNode.negated && firstNode.chars.includes(".")) {
      hasLeadingDot = true;
    }
    if (!hasLeadingDot) return false;
  }

  if (matchSegment(seg, currentPatternNodes, options)) {
    return matchPathSegments(pathSegments, patternSegments, options, pi + 1, si + 1);
  }

  return false;
}

export function matchPath(
  path: string,
  pattern: string,
  options: MatchOptions = {}
): boolean {
  const pathSegments = splitPath(normalizePath(path));
  const patternNodes = parsePattern(pattern);

  if (pathSegments.length === 0) {
    const hasNonSep = patternNodes.some((n) => n.type !== "separator");
    if (!hasNonSep) return false;
  }

  const patternSegments: PatternNode[][] = [];
  let current: PatternNode[] = [];
  let leadingSep = patternNodes.length > 0 && patternNodes[0].type === "separator";

  for (const node of patternNodes) {
    if (node.type === "separator") {
      if (current.length > 0) {
        patternSegments.push(current);
        current = [];
      }
    } else {
      current.push(node);
    }
  }
  if (current.length > 0) {
    patternSegments.push(current);
  }
  if (leadingSep && patternSegments.length > 0) {
    patternSegments.unshift([]);
  }

  return matchPathSegments(pathSegments, patternSegments, options);
}

