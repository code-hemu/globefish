import { describe, it, expect } from "vitest";
import { glob } from "../src/glob/glob.js";
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

});
