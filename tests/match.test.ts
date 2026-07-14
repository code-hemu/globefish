import { describe, it, expect } from "vitest";
import { matchPath } from "../src/glob/match.js";

describe("matchPath", () => {
  it("matches exact literal paths", () => {
    expect(matchPath("src/foo.ts", "src/foo.ts")).toBe(true);
    expect(matchPath("src/foo.ts", "src/bar.ts")).toBe(false);
  });

  it("matches * wildcard within a segment", () => {
    expect(matchPath("foo.ts", "*.ts")).toBe(true);
    expect(matchPath("foo.js", "*.ts")).toBe(false);
    expect(matchPath("src/foo.ts", "src/*.ts")).toBe(true);
    expect(matchPath("src/foo.ts", "src/*.js")).toBe(false);
  });

  it("matches ** globstar across directories", () => {
    expect(matchPath("a/b/c.ts", "**/*.ts")).toBe(true);
    expect(matchPath("a/b/c.ts", "a/**/*.ts")).toBe(true);
    expect(matchPath("a/b/c.ts", "a/**/c.ts")).toBe(true);
    expect(matchPath("a/b/c.ts", "b/**/*.ts")).toBe(false);
  });

  it("matches ? wildcard single character", () => {
    expect(matchPath("foo.ts", "foo.??")).toBe(true);
    expect(matchPath("foo.ts", "foo.?")).toBe(false);
    expect(matchPath("a.ts", "?.ts")).toBe(true);
    expect(matchPath("ab.ts", "?.ts")).toBe(false);
  });

  it("matches character classes", () => {
    expect(matchPath("foo.ts", "foo.[ct]s")).toBe(true);
    expect(matchPath("foo.js", "foo.[cj]s")).toBe(true);
    expect(matchPath("foo.ts", "foo.[!c]s")).toBe(true);
    expect(matchPath("foo.cs", "foo.[!c]s")).toBe(false);
  });

  it("handles dot option", () => {
    expect(matchPath(".gitignore", ".gitignore")).toBe(true);
    expect(matchPath(".gitignore", "*", { dot: false })).toBe(false);
    expect(matchPath(".gitignore", "*", { dot: true })).toBe(true);
    expect(matchPath(".git/config", "**/*", { dot: false })).toBe(false);
    expect(matchPath(".git/config", "**/*", { dot: true })).toBe(true);
  });

  it("handles escaped characters", () => {
    expect(matchPath("foo*bar", "foo\\*bar")).toBe(true);
    expect(matchPath("foo?bar", "foo\\?bar")).toBe(true);
  });

  describe("extended glob patterns", () => {
    it("matches @(pattern) exactly once", () => {
      expect(matchPath("foo", "@(foo|bar)")).toBe(true);
      expect(matchPath("bar", "@(foo|bar)")).toBe(true);
      expect(matchPath("baz", "@(foo|bar)")).toBe(false);
    });

    it("matches ?(pattern) zero or one", () => {
      expect(matchPath("foo", "?(foo)")).toBe(true);
      expect(matchPath("", "?(foo)")).toBe(true);
      expect(matchPath("bar", "?(foo)")).toBe(false);
    });

    it("matches *(pattern) zero or more", () => {
      expect(matchPath("", "*(ab)")).toBe(true);
      expect(matchPath("ab", "*(ab)")).toBe(true);
      expect(matchPath("ac", "*(ab)")).toBe(false);
    });

    it("matches +(pattern) one or more", () => {
      expect(matchPath("ab", "+(ab)")).toBe(true);
      expect(matchPath("abab", "+(ab)")).toBe(true);
      expect(matchPath("", "+(ab)")).toBe(false);
      expect(matchPath("ac", "+(ab)")).toBe(false);
    });

    it("matches !(pattern) as negation", () => {
      expect(matchPath("foo", "!(bar)")).toBe(true);
      expect(matchPath("bar", "!(bar)")).toBe(false);
    });

    it("handles nested extglobs", () => {
      expect(matchPath("a", "+(a?(b))")).toBe(true);
      expect(matchPath("ab", "+(a?(b))")).toBe(true);
    });

    it("works across path segments", () => {
      expect(matchPath("src/foo/utils.ts", "src/**/!(node_modules)/*")).toBe(true);
      expect(matchPath("tests/glob.test.ts", "!(node_modules)/*.ts")).toBe(true);
      expect(matchPath("node_modules/pkg/index.js", "!(node_modules)/*.ts")).toBe(false);
      expect(matchPath("src/foo/bar/test.ts", "src/@(foo|bar)/@(baz|bar)/*.ts")).toBe(true);
      expect(matchPath("src/foo/other/test.ts", "src/@(foo|bar)/@(baz|bar)/*.ts")).toBe(false);
    });
  });
});
