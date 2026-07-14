import { describe, bench, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parsePattern } from "../src/glob/pattern.js";
import { expandPatterns } from "../src/glob/expand.js";
import { matchPath } from "../src/glob/match.js";
import { glob } from "../src/glob/glob.js";

// ─── Fixture ───────────────────────────────────────────────────────────

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "globefish-bench-"));
  mkdirSync(join(root, "src/utils"), { recursive: true });
  mkdirSync(join(root, "src/components"), { recursive: true });
  mkdirSync(join(root, "tests/unit"), { recursive: true });
  mkdirSync(join(root, "tests/e2e"), { recursive: true });
  mkdirSync(join(root, "node_modules/some-pkg"), { recursive: true });
  mkdirSync(join(root, ".hidden"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "index.ts"), "");
  writeFileSync(join(root, ".gitignore"), "");
  writeFileSync(join(root, "src/index.ts"), "");
  writeFileSync(join(root, "src/cli.ts"), "");
  writeFileSync(join(root, "src/utils/path.ts"), "export const a = 1;");
  writeFileSync(join(root, "src/utils/fs.ts"), "export const b = 2;");
  writeFileSync(join(root, "src/utils/helpers.ts"), "export const c = 3;");
  writeFileSync(join(root, "src/components/button.ts"), "");
  writeFileSync(join(root, "src/components/input.ts"), "");
  writeFileSync(join(root, "tests/glob.test.ts"), "");
  writeFileSync(join(root, "tests/unit/a.test.ts"), "");
  writeFileSync(join(root, "tests/unit/b.test.ts"), "");
  writeFileSync(join(root, "tests/e2e/login.test.ts"), "");
  writeFileSync(join(root, "node_modules/some-pkg/index.js"), "");
  writeFileSync(join(root, ".hidden/config.ts"), "");
  return root;
}

const fixtureDir = createFixture();

afterAll(() => {
  // Cleanup can be added if needed
});

// ─── Deeply nested tree for stress tests ───────────────────────────────

function createDeepFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "globefish-deep-"));
  let dir = root;
  for (let i = 0; i < 50; i++) {
    dir = join(dir, `dir${i}`);
    mkdirSync(dir);
    writeFileSync(join(dir, "index.ts"), "");
  }
  return root;
}

const deepDir = createDeepFixture();

// ─── Parse Pattern Benchmarks ──────────────────────────────────────────

describe("parsePattern", () => {
  bench("simple: *.ts", () => {
    parsePattern("*.ts");
  });

  bench("medium: src/**/*.{ts,js}", () => {
    parsePattern("src/**/*.{ts,js}");
  });

  bench("complex: !(node_modules)/**/[a-z]*.@(ts|js)", () => {
    parsePattern("!(node_modules)/**/[a-z]*.@(ts|js)");
  });

  bench("brace-heavy: {a,b}/{c,d}/{e,f}.txt", () => {
    parsePattern("{a,b}/{c,d}/{e,f}.txt");
  });

  bench("nested-braces: {a,{b,c}}", () => {
    parsePattern("{a,{b,c}}");
  });

  bench("long-literal", () => {
    parsePattern("this/is/a/very/deep/path/with/many/segments/file.txt");
  });
});

// ─── Brace Expansion Benchmarks ────────────────────────────────────────

describe("expandPatterns", () => {
  bench("simple: *.{js,ts}", () => {
    expandPatterns("*.{js,ts}");
  });

  bench("nested: {a,{b,c}}", () => {
    expandPatterns("{a,{b,c}}");
  });

  bench("many: {a,b,c,d,e,f,g,h}", () => {
    expandPatterns("{a,b,c,d,e,f,g,h}");
  });

  bench("multi-group: {a,b}/{c,d}", () => {
    expandPatterns("{a,b}/{c,d}");
  });

  bench("no-braces (passthrough)", () => {
    expandPatterns("src/**/*.ts");
  });

  bench("array input", () => {
    expandPatterns(["*.ts", "*.js", "src/**/*.ts"]);
  });
});

// ─── Path Matching Benchmarks ──────────────────────────────────────────

describe("matchPath", () => {
  bench("simple *", () => {
    matchPath("src/index.ts", "*.ts");
  });

  bench("globstar **", () => {
    matchPath("src/utils/path.ts", "src/**/*.ts");
  });

  bench("deep globstar", () => {
    matchPath("src/utils/helpers/path/resolve.ts", "**/*.ts");
  });

  bench("char class [a-z]", () => {
    matchPath("src/index.ts", "src/[a-z]*.ts");
  });

  bench("extglob @(ts|js)", () => {
    matchPath("src/index.ts", "*.@(ts|js)");
  });

  bench("extglob !(node_modules)", () => {
    matchPath("src/index.ts", "!(node_modules)/*.ts");
  });

  bench("extglob +() one-or-more", () => {
    matchPath("index.ts", "+(index|main).ts");
  });

  bench("long path exact match", () => {
    matchPath("src/utils/helpers/path/resolve.ts", "src/utils/helpers/path/resolve.ts");
  });

  bench("long path with *", () => {
    matchPath("src/utils/helpers/path/resolve.ts", "src/*/helpers/*/resolve.ts");
  });

  bench("brace expanded match", () => {
    matchPath("a/c/e.txt", "{a,b}/{c,d}/{e,f}.txt");
  });
});

// ─── Integration Benchmarks ────────────────────────────────────────────

describe("glob integration", () => {
  bench("shallow: *.ts", async () => {
    await glob("*.ts", { cwd: fixtureDir });
  });

  bench("recursive: **/*.ts", async () => {
    await glob("**/*.ts", { cwd: fixtureDir });
  });

  bench("multi-pattern with negation", async () => {
    await glob(["**/*.ts", "!tests/**"], { cwd: fixtureDir });
  });

  bench("with ignore option", async () => {
    await glob("**/*.ts", { cwd: fixtureDir, ignore: ["tests/**"] });
  });

  bench("with absolute + dot", async () => {
    await glob("**/*.ts", { cwd: fixtureDir, absolute: true, dot: true });
  });

  bench("extglob: !(node_modules)/*.ts", async () => {
    await glob("!(node_modules)/*.ts", { cwd: fixtureDir });
  });

  bench("brace expansion: *.{ts,js}", async () => {
    await glob("*.{ts,js}", { cwd: fixtureDir });
  });

  bench("deep recursive (50 dirs)", async () => {
    await glob("**/*.ts", { cwd: deepDir });
  });
});
