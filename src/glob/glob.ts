import { DEFAULT_OPTIONS } from "../constants.js";
import type { GlobOptions } from "../types/index.js";
import { expandPatterns } from "./expand.js";
import { matchPath } from "./match.js";
import { walkTree } from "../walker/walker.js";
import { normalizePath } from "../utils/path.js";
import { resolve } from "node:path";
import { Ignorer } from "../ignore/ignore.js";

export async function glob(
  pattern: string | string[],
  options: GlobOptions = {}
): Promise<string[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cwd = normalizePath(opts.cwd);

  const expandedPatterns = expandPatterns(pattern);
  const ignorer = new Ignorer(opts.ignore);

  const results = new Set<string>();

  for await (const entry of walkTree(cwd, opts)) {
    if (opts.onlyDirectories) {
      if (!entry.dirent?.isDirectory()) continue;
    } else if (opts.onlyFiles) {
      if (entry.dirent?.isDirectory()) continue;
    }
    if (ignorer.ignores(entry.path, entry.dirent?.isDirectory() ?? false)) continue;

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
    if (!included) continue;

    let finalPath = entry.path;
    if (opts.markDirectories && entry.dirent?.isDirectory()) {
      finalPath += "/";
    }
    if (opts.absolute) {
      finalPath = normalizePath(resolve(cwd, finalPath));
    }

    results.add(finalPath);
  }

  return [...results].sort();
}
