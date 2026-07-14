import { promises as fsp, readdirSync as fsReaddirSync, statSync as fsStatSync } from "node:fs";
import type { Dirent } from "node:fs";

export async function readdir(dir: string): Promise<Dirent[]> {
  return fsp.readdir(dir, { withFileTypes: true });
}

export async function stat(path: string) {
  return fsp.stat(path);
}

export function readdirSync(dir: string): Dirent[] {
  return fsReaddirSync(dir, { withFileTypes: true });
}

export function statSync(path: string) {
  return fsStatSync(path);
}
