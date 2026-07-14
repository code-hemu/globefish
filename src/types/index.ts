import type { Dirent } from "node:fs";

export type GlobOptions = {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
  dot?: boolean;
  followSymlinks?: boolean;
  maxDepth?: number;
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
  markDirectories?: boolean;
};

export type GlobEntry = {
  path: string;
  dirent?: Dirent;
};

export type PatternNode =
  | { type: "literal"; value: string }
  | { type: "star" }
  | { type: "globstar" }
  | { type: "qmark" }
  | { type: "charclass"; chars: string; negated: boolean }
  | { type: "separator" }
  | { type: "extglob"; kind: "?" | "*" | "+" | "@" | "!"; alternatives: PatternNode[][] };

export type IgnoreRule = {
  pattern: string;
  negate: boolean;
  dirOnly: boolean;
  anchored?: boolean;
};
