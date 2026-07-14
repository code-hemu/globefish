import { describe, it, expect } from "vitest";
import { expandPatterns } from "../src/glob/expand.js";

describe("expandPatterns", () => {
  it("expands simple brace alternatives", () => {
    expect(expandPatterns("{a,b}")).toEqual(["a", "b"]);
  });

  it("expands nested braces", () => {
    expect(expandPatterns("{a,{b,c},d}")).toEqual(["a", "b", "c", "d"]);
  });

  it("handles prefix and suffix", () => {
    expect(expandPatterns("src/{foo,bar}.ts")).toEqual([
      "src/foo.ts",
      "src/bar.ts",
    ]);
  });

  it("handles empty alternatives", () => {
    expect(expandPatterns("{,x}")).toEqual(["", "x"]);
  });

  it("preserves literal escaped braces", () => {
    expect(expandPatterns("\\{a,b}")).toEqual(["\\{a,b}"]);
  });

  it("handles multiple brace groups", () => {
    expect(expandPatterns("{a,b}/{c,d}")).toEqual([
      "a/c",
      "a/d",
      "b/c",
      "b/d",
    ]);
  });

  it("returns unchanged string when no braces", () => {
    expect(expandPatterns("src/*.ts")).toEqual(["src/*.ts"]);
  });

  it("expands array of patterns", () => {
    expect(expandPatterns(["{a,b}", "c"])).toEqual(["a", "b", "c"]);
  });

  it("throws on unclosed brace", () => {
    expect(() => expandPatterns("{a,b")).toThrow();
  });
});
