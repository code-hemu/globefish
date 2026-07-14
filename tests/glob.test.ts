import { describe, it, expect } from "vitest";
import { glob, globSync, globStream } from "../src/glob/glob.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "globefish-test-"));
  mkdirSync(join(dir, "src/utils"), { recursive: true });
  mkdirSync(join(dir, "tests"), { recursive: true });
  mkdirSync(join(dir, "node_modules/some-pkg"), { recursive: true });
  writeFileSync(join(dir, "src/index.ts"), "");
  writeFileSync(join(dir, "src/utils/path.ts"), "");
  writeFileSync(join(dir, "tests/glob.test.ts"), "");
  writeFileSync(join(dir, "node_modules/some-pkg/index.js"), "");
  writeFileSync(join(dir, ".gitignore"), "node_modules/");
  return dir;
}

describe("glob integration", () => {
  it("finds .ts files with ** pattern", async () => {
    const dir = createTempDir();
    const files = await glob("src/**/*.ts", { cwd: dir });
    expect(files).toContain("src/index.ts");
    expect(files).toContain("src/utils/path.ts");
    expect(files).not.toContain("tests/glob.test.ts");
  });

  it("finds all .ts files", async () => {
    const dir = createTempDir();
    const files = await glob("**/*.ts", { cwd: dir });
    expect(files).toContain("src/index.ts");
    expect(files).toContain("src/utils/path.ts");
    expect(files).toContain("tests/glob.test.ts");
  });

  it("supports ignore option", async () => {
    const dir = createTempDir();
    const files = await glob("**/*.ts", {
      cwd: dir,
      ignore: ["tests/**"],
    });
    expect(files).toContain("src/index.ts");
    expect(files).not.toContain("tests/glob.test.ts");
  });

  it("supports multiple patterns", async () => {
    const dir = createTempDir();
    const files = await glob(["src/**/*.ts", "tests/**/*.ts"], { cwd: dir });
    expect(files).toContain("src/index.ts");
    expect(files).toContain("tests/glob.test.ts");
  });

  it("returns absolute paths with absolute option", async () => {
    const dir = createTempDir();
    const files = await glob("src/**/*.ts", { cwd: dir, absolute: true });
    for (const f of files) {
      expect(f.startsWith("/") || f.includes(":")).toBe(true);
    }
  });

  it("excludes with !pattern glob-level negation", async () => {
    const dir = createTempDir();
    const files = await glob(["**/*.ts", "!tests/**"], { cwd: dir });
    expect(files).toContain("src/index.ts");
    expect(files).not.toContain("tests/glob.test.ts");
  });

  it("supports !(extglob) as include pattern (not glob-level negation)", async () => {
    const dir = createTempDir();
    const files = await glob("!(node_modules)/*.ts", { cwd: dir });
    expect(files).toContain("src/index.ts");
    expect(files).toContain("tests/glob.test.ts");
    expect(files).not.toContain("node_modules/some-pkg/index.js");
  });

  it("supports nosort option", async () => {
    const dir = mkdtempSync(join(tmpdir(), "globefish-nosort-"));
    const names = ["b/z.ts", "a/a.ts", "c/y.ts"];
    for (const n of names) {
      mkdirSync(join(dir, n.split("/")[0]), { recursive: true });
      writeFileSync(join(dir, n), "");
    }
    const sorted = await glob("**/*.ts", { cwd: dir });
    const unsorted = await glob("**/*.ts", { cwd: dir, nosort: true });
    const sortedCopy = [...sorted].sort();
    expect(sorted).toEqual(sortedCopy);
    expect(new Set(sorted)).toEqual(new Set(unsorted));
  });

  it("supports nounique option with overlapping patterns", async () => {
    const dir = createTempDir();
    const unique = await glob(["**/*.ts", "src/**"], { cwd: dir });
    const withDups = await glob(["**/*.ts", "src/**"], { cwd: dir, nounique: true });
    expect(unique.length).toBeLessThanOrEqual(withDups.length);
  });

  it("supports concurrency option", async () => {
    const dir = createTempDir();
    const files = await glob("**/*.ts", { cwd: dir, concurrency: 4 });
    expect(files).toContain("src/index.ts");
    expect(files).toContain("tests/glob.test.ts");
    expect(files).toContain("src/utils/path.ts");
    expect(files).toHaveLength(3);
  });
});

describe("globSync", () => {
  it("returns same results as glob", () => {
    const dir = createTempDir();
    const syncFiles = globSync("**/*.ts", { cwd: dir });
    expect(syncFiles).toContain("src/index.ts");
    expect(syncFiles).toContain("src/utils/path.ts");
    expect(syncFiles).toContain("tests/glob.test.ts");
  });

  it("supports ignore option", () => {
    const dir = createTempDir();
    const files = globSync("**/*.ts", { cwd: dir, ignore: ["tests/**"] });
    expect(files).toContain("src/index.ts");
    expect(files).not.toContain("tests/glob.test.ts");
  });

  it("supports nosort option", () => {
    const dir = mkdtempSync(join(tmpdir(), "globefish-sync-nosort-"));
    const names = ["b/z.ts", "a/a.ts", "c/y.ts"];
    for (const n of names) {
      mkdirSync(join(dir, n.split("/")[0]), { recursive: true });
      writeFileSync(join(dir, n), "");
    }
    const sorted = globSync("**/*.ts", { cwd: dir });
    const unsorted = globSync("**/*.ts", { cwd: dir, nosort: true });
    const sortedCopy = [...sorted].sort();
    expect(sorted).toEqual(sortedCopy);
    expect(new Set(sorted)).toEqual(new Set(unsorted));
  });
});

describe("globStream", () => {
  it("yields all matching files", async () => {
    const dir = createTempDir();
    const results: string[] = [];
    for await (const file of globStream("**/*.ts", { cwd: dir })) {
      results.push(file);
    }
    expect(results).toContain("src/index.ts");
    expect(results).toContain("tests/glob.test.ts");
  });

  it("respects ignore option", async () => {
    const dir = createTempDir();
    const results: string[] = [];
    for await (const file of globStream("**/*.ts", { cwd: dir, ignore: ["tests/**"] })) {
      results.push(file);
    }
    expect(results).toContain("src/index.ts");
    expect(results).not.toContain("tests/glob.test.ts");
  });

  it("works with concurrency option", async () => {
    const dir = createTempDir();
    const results: string[] = [];
    for await (const file of globStream("**/*.ts", { cwd: dir, concurrency: 8 })) {
      results.push(file);
    }
    expect(results).toContain("src/index.ts");
    expect(results).toContain("tests/glob.test.ts");
  });
});
