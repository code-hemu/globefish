import type { IgnoreRule } from "../types/index.js";
import { parseIgnorePatterns } from "./rules.js";
import { matchPath } from "../glob/match.js";

export class Ignorer {
  private rules: IgnoreRule[];

  constructor(patterns: string[]) {
    this.rules = parseIgnorePatterns(patterns);
  }

  ignores(path: string, isDir: boolean): boolean {
    let ignored = false;

    for (const rule of this.rules) {
      if (rule.anchored) {
        const matches = path === rule.pattern || path.startsWith(rule.pattern + "/");
        if (matches) ignored = !rule.negate;
        continue;
      }

      if (rule.dirOnly && !isDir) {
        if (path.startsWith(rule.pattern + "/")) {
          ignored = !rule.negate;
        }
        continue;
      }

      if (matchPath(path, rule.pattern)) {
        ignored = !rule.negate;
      } else if (path.startsWith(rule.pattern + "/") || path === rule.pattern) {
        ignored = !rule.negate;
      }
    }

    return ignored;
  }
}
