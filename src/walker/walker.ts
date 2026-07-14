import { readdir, stat } from "../utils/fs.js";
import { normalizePath } from "../utils/path.js";
import { DEFAULT_OPTIONS } from "../constants.js";
import type { GlobOptions } from "../types/index.js";
import type { WalkEntry } from "./entry.js";
import { join } from "node:path";

function pathStartsWith(haystack: string, needle: string): boolean {
  if (haystack === needle) return true;
  return haystack.startsWith(needle + "/");
}

export async function* walkTree(
  cwd: string,
  options: GlobOptions = {}
): AsyncGenerator<WalkEntry> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedCwd = normalizePath(cwd);
  const queue: { dir: string; depth: number }[] = [{ dir: cwd, depth: 0 }];
  const caseSensitive = process.platform !== "win32";
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { dir, depth } = queue.shift()!;

    if (depth > opts.maxDepth) continue;

    let dirents: WalkEntry[] = [];
    try {
      const entries = await readdir(dir);
      for (const dirent of entries) {
        const fullPath = join(dir, dirent.name);
        const normalizedPath = normalizePath(fullPath);

        const visitedKey = caseSensitive ? normalizedPath : normalizedPath.toLowerCase();
        if (visited.has(visitedKey)) continue;
        visited.add(visitedKey);

        let relativePath = normalizedPath;
        if (pathStartsWith(normalizedPath, normalizedCwd)) {
          const after = normalizedPath.slice(normalizedCwd.length);
          relativePath = after.startsWith("/") ? after.slice(1) : after;
        }

        const entry: WalkEntry = {
          path: relativePath || normalizedPath,
          dirent,
          depth: depth + 1,
        };

        let isDir = dirent.isDirectory();
        if (dirent.isSymbolicLink() && opts.followSymlinks) {
          try {
            const targetStat = await stat(fullPath);
            isDir = targetStat.isDirectory();
          } catch {
            isDir = false;
          }
        }

        yield entry;

        if (isDir && depth + 1 <= opts.maxDepth) {
          queue.push({ dir: fullPath, depth: depth + 1 });
        }
      }
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "EACCES" && code !== "EPERM" && code !== "ENOTDIR") throw err;
    }
  }
}
