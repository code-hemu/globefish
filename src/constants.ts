import type { GlobOptions } from "./types/index.js";

export const DEFAULT_OPTIONS: Required<GlobOptions> = {
  get cwd() { return process.cwd(); },
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
