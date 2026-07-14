import { describe, it, expect } from "vitest";
import { walkTree } from "../src/walker/walker.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "globefish-walker-"));
  mkdirSync(join(dir, "a/b"), { recursive: true });
  writeFileSync(join(dir, "a/1.txt"), "");
  writeFileSync(join(dir, "a/b/2.txt"), "");
  return dir;
}

describe("walkTree", () => {
  it("walks all files and directories", async () => {
    const dir = createTempDir();
    const entries: string[] = [];
    for await (const entry of walkTree(dir)) {
      entries.push(entry.path);
    }
    expect(entries).toContain("a/1.txt");
    expect(entries).toContain("a/b/2.txt");
  });
});
