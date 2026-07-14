import type { GlobOptions } from "./types/index.js";

function getDefaultCwd(): string {
  return process.cwd();
}

export const DEFAULT_OPTIONS: Required<GlobOptions> = {
  get cwd() { return getDefaultCwd(); },
  ignore: [],
  absolute: false,
  dot: false,
  followSymlinks: true,
  maxDepth: Infinity,
  onlyFiles: false,
  onlyDirectories: false,
  markDirectories: false,
  nosort: false,
  nounique: false,
  concurrency: 1,
};
