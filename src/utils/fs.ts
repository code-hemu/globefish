import { promises as fsp } from "node:fs";
import type { Dirent } from "node:fs";

export async function readdir(dir: string): Promise<Dirent[]> {
  return fsp.readdir(dir, { withFileTypes: true });
}

export async function stat(path: string) {
  return fsp.stat(path);
}
