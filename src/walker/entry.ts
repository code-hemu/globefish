import type { Dirent } from "node:fs";

export type WalkEntry = {
  path: string;
  dirent: Dirent;
  depth: number;
};
