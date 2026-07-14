import { DEFAULT_OPTIONS } from "../constants.js";
import type { GlobOptions } from "../types/index.js";
import { expandPatterns } from "./expand.js";
import { matchPath } from "./match.js";
import { walkTree, walkTreeSync } from "../walker/walker.js";
import { normalizePath } from "../utils/path.js";
import { resolve } from "node:path";
import { Ignorer } from "../ignore/ignore.js";

function processEntry(
  entry: { path: string; dirent: { isDirectory(): boolean } | null },
  expandedPatterns: string[],
  ignorer: Ignorer,
  opts: Required<GlobOptions>,
  cwd: string
): string | null {
  if (opts.onlyDirectories) {
    if (!entry.dirent?.isDirectory()) return null;
  } else if (opts.onlyFiles) {
    if (entry.dirent?.isDirectory()) return null;
  }
  if (ignorer.ignores(entry.path, entry.dirent?.isDirectory() ?? false)) return null;

  let included = false;
  for (const p of expandedPatterns) {
    if (p === "!") continue;
    if (p.startsWith("!") && !p.startsWith("!(")) {
      let negCount = 0;
      while (negCount < p.length && p[negCount] === "!") negCount++;
      const actualPattern = p.slice(negCount);
      if (matchPath(entry.path, actualPattern, { dot: opts.dot })) {
        included = negCount % 2 === 0;
      }
    } else {
      if (matchPath(entry.path, p, { dot: opts.dot })) {
        included = true;
      }
    }
  }
  if (!included) return null;

  let finalPath = entry.path;
  if (opts.markDirectories && entry.dirent?.isDirectory()) {
    finalPath += "/";
  }
  if (opts.absolute) {
    finalPath = normalizePath(resolve(cwd, finalPath));
  }

  return finalPath;
}

export async function* globStream(
  pattern: string | string[],
  options: GlobOptions = {}
): AsyncGenerator<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<GlobOptions>;
  const cwd = normalizePath(opts.cwd);

  const expandedPatterns = expandPatterns(pattern);
  const ignorer = new Ignorer(opts.ignore);

  for await (const entry of walkTree(cwd, opts)) {
    const result = processEntry(entry, expandedPatterns, ignorer, opts, cwd);
    if (result !== null) {
      yield result;
    }
  }
}

export async function glob(
  pattern: string | string[],
  options: GlobOptions = {}
): Promise<string[]> {
  const results: string[] = [];
  for await (const r of globStream(pattern, options)) {
    results.push(r);
  }
  let result = options?.nounique ? results : [...new Set(results)];
  if (!options?.nosort) {
    result.sort();
  }
  return result;
}

export function globSync(
  pattern: string | string[],
  options: GlobOptions = {}
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<GlobOptions>;
  const cwd = normalizePath(opts.cwd);

  const expandedPatterns = expandPatterns(pattern);
  const ignorer = new Ignorer(opts.ignore);

  const results: string[] = [];

  for (const entry of walkTreeSync(cwd, opts)) {
    const result = processEntry(entry, expandedPatterns, ignorer, opts, cwd);
    if (result !== null) {
      results.push(result);
    }
  }

  let result = opts.nounique ? results : [...new Set(results)];
  if (!opts.nosort) {
    result.sort();
  }
  return result;
}
