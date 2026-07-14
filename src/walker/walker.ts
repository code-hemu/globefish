import { readdir, stat, readdirSync, statSync } from "../utils/fs.js";
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
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<GlobOptions>;
  const normalizedCwd = normalizePath(cwd);
  const queue: { dir: string; depth: number }[] = [{ dir: cwd, depth: 0 }];
  const caseSensitive = process.platform !== "win32";
  const visited = new Set<string>();
  const buffer: WalkEntry[] = [];
  let notify: (() => void) | null = null;
  let activeWorkers = 0;
  let workerError: unknown = null;

  const dispatch = (): void => {
    while (queue.length > 0 && activeWorkers < opts.concurrency) {
      const item = queue.shift()!;
      if (item.depth > opts.maxDepth) continue;
      activeWorkers++;
      workerFor(item.dir, item.depth);
    }
    if (activeWorkers === 0) {
      notify?.();
    }
  };

  const workerFor = async (dir: string, depth: number): Promise<void> => {
    try {
      let entries;
      try {
        entries = await readdir(dir);
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code !== "EACCES" && code !== "EPERM" && code !== "ENOTDIR") throw err;
        return;
      }

      for (const dirent of entries) {
        const fullPath = join(dir, dirent.name);
        const fullNormalized = normalizePath(fullPath);

        const visitedKey = caseSensitive ? fullNormalized : fullNormalized.toLowerCase();
        if (visited.has(visitedKey)) continue;
        visited.add(visitedKey);

        let relativePath = fullNormalized;
        if (pathStartsWith(fullNormalized, normalizedCwd)) {
          const after = fullNormalized.slice(normalizedCwd.length);
          relativePath = after.startsWith("/") ? after.slice(1) : after;
        }

        let isDir = dirent.isDirectory();
        if (dirent.isSymbolicLink() && opts.followSymlinks) {
          try {
            const targetStat = await stat(fullPath);
            isDir = targetStat.isDirectory();
          } catch {
            isDir = false;
          }
        }

        buffer.push({
          path: relativePath || fullNormalized,
          dirent,
          depth: depth + 1,
        });

        notify?.();

        if (isDir && depth + 1 <= opts.maxDepth) {
          queue.push({ dir: fullPath, depth: depth + 1 });
        }
      }
    } catch (err) {
      workerError = err;
      notify?.();
      return;
    } finally {
      activeWorkers--;
      if (activeWorkers === 0) {
        dispatch();
      }
    }
  };

  dispatch();

  while (true) {
    while (buffer.length > 0) {
      yield buffer.shift()!;
    }
    if (workerError) throw workerError;
    if (activeWorkers === 0) break;

    const ready = new Promise<void>((resolve) => {
      notify = resolve;
    });

    if (buffer.length > 0 || activeWorkers === 0) {
      notify = null;
      continue;
    }

    await ready;
    notify = null;
  }
}

export function* walkTreeSync(
  cwd: string,
  options: GlobOptions = {}
): Generator<WalkEntry> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<GlobOptions>;
  const normalizedCwd = normalizePath(cwd);
  const queue: { dir: string; depth: number }[] = [{ dir: cwd, depth: 0 }];
  const caseSensitive = process.platform !== "win32";
  const visited = new Set<string>();

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (item.depth > opts.maxDepth) continue;

    let entries;
    try {
      entries = readdirSync(item.dir);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "EACCES" && code !== "EPERM" && code !== "ENOTDIR") throw err;
      continue;
    }

    for (const dirent of entries) {
      const fullPath = join(item.dir, dirent.name);
      const fullNormalized = normalizePath(fullPath);

      const visitedKey = caseSensitive ? fullNormalized : fullNormalized.toLowerCase();
      if (visited.has(visitedKey)) continue;
      visited.add(visitedKey);

      let relativePath = fullNormalized;
      if (pathStartsWith(fullNormalized, normalizedCwd)) {
        const after = fullNormalized.slice(normalizedCwd.length);
        relativePath = after.startsWith("/") ? after.slice(1) : after;
      }

      let isDir = dirent.isDirectory();
      if (dirent.isSymbolicLink() && opts.followSymlinks) {
        try {
          const targetStat = statSync(fullPath);
          isDir = targetStat.isDirectory();
        } catch {
          isDir = false;
        }
      }

      yield {
        path: relativePath || fullNormalized,
        dirent,
        depth: item.depth + 1,
      };

      if (isDir && item.depth + 1 <= opts.maxDepth) {
        queue.push({ dir: fullPath, depth: item.depth + 1 });
      }
    }
  }
}
