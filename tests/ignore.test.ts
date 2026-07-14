import { describe, it, expect } from "vitest";
import { Ignorer } from "../src/ignore/ignore.js";
import { parseIgnorePattern } from "../src/ignore/rules.js";

describe("parseIgnorePattern", () => {
  it("parses simple patterns", () => {
    const rule = parseIgnorePattern("node_modules");
    expect(rule.pattern).toBe("node_modules");
    expect(rule.negate).toBe(false);
    expect(rule.dirOnly).toBe(false);
  });

  it("parses negated patterns", () => {
    const rule = parseIgnorePattern("!important");
    expect(rule.pattern).toBe("important");
    expect(rule.negate).toBe(true);
  });

  it("parses directory-only patterns", () => {
    const rule = parseIgnorePattern("node_modules/");
    expect(rule.pattern).toBe("node_modules");
    expect(rule.dirOnly).toBe(true);
  });
});

describe("Ignorer", () => {
  it("ignores matching paths", () => {
    const ignorer = new Ignorer(["node_modules"]);
    expect(ignorer.ignores("node_modules/something", false)).toBe(true);
    expect(ignorer.ignores("src/index.ts", false)).toBe(false);
  });

  it("handles negated patterns", () => {
    const ignorer = new Ignorer(["*", "!important.ts"]);
    expect(ignorer.ignores("foo.ts", false)).toBe(true);
    expect(ignorer.ignores("important.ts", false)).toBe(false);
  });

  it("anchored dirOnly rule does not match files", () => {
    const ignorer = new Ignorer(["/build/"]);
    expect(ignorer.ignores("build", false)).toBe(false);
    expect(ignorer.ignores("build", true)).toBe(true);
    expect(ignorer.ignores("build/file.ts", false)).toBe(true);
  });
});
