<p align="center">
  <a href="https://github.com/code-hemu/globefish">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/light_logo.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/dark_logo.png" />
      <img src="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/dark_logo.png" alt="globefish logo" width="500px" />
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/globefish"><img src="https://img.shields.io/npm/v/globefish" alt="Version"></a>
  <a href="https://github.com/code-hemu/globefish/blob/master/LICENSE"><img src="https://img.shields.io/github/license/code-hemu/globefish" alt="License"></a>
  <a href="https://github.com/code-hemu/globefish/issues"><img src="https://img.shields.io/github/issues/code-hemu/globefish" alt="Issues"></a>
  <a href="https://github.com/code-hemu/globefish/graphs/contributors"><img src="https://img.shields.io/github/contributors/code-hemu/globefish" alt="Contributors"></a>
  <a href="https://github.com/sponsors/code-hemu"><img src="https://img.shields.io/badge/Sponsor-GitHub-red" alt="Sponsor"></a>
</p>

<p align="center">
  A fast glob engine for Node.js. Patterns, brace expansion, extended globs, ignore rules.
</p>


- **Glob patterns** - `*`, `**`, `?`, `[abc]`, `[!abc]`, `[^abc]` cover the full range of standard glob syntax for flexible path matching
- **Brace expansion** - `{a,b}`, nested braces, and empty alternatives let you express multiple patterns in a single compact expression
- **Extended globs** - `?(...)`, `*(...)`, `+(...)`, `@(...)`, and `!(...)` bring regex-like quantifier semantics directly into glob patterns
- **Glob-level negation** - prefix any pattern with `!` to exclude matching paths from the final result set
- **Ignore rules** - pass `.gitignore`-style patterns via the `ignore` option for declarative, familiar exclusion rules
- **Escape sequences** - `\*`, `\{`, and other backslash escapes let you match literal special characters without ambiguity
- **Async API** - `glob()` returns a `Promise<string[]>` for modern async/await workflows
- **Sync API** - `globSync()` provides a synchronous alternative when async is not suitable
- **Streaming API** - `globStream()` yields results as they are discovered, without buffering all results in memory


## Installation

```sh
npm i globefish
```

## Quick Start

```ts
import { glob } from "globefish";

// Find all TypeScript files recursively
const files = await glob("src/**/*.ts");
console.log(files); // ["src/index.ts", "src/util/path.ts", ...]

// Multiple patterns with negation
const all = await glob(["**/*.ts", "!tests/**"]);

// With options
const absolute = await glob("**/*.ts", { cwd: "./src", absolute: true });
```

## API

### `glob(patterns, options?)`

The primary entry point. Accepts one or more glob patterns and an optional configuration object. Returns a `Promise` that resolves to a sorted, deduplicated array of matched paths.

```ts
function glob(patterns: string | string[], options?: GlobOptions): Promise
```

> Full API reference including advanced pattern syntax details, error handling behaviour, and edge cases: [`docs/api.md`](docs/api.md)

## Pattern Syntax

Globefish implements the full POSIX glob specification plus bash-style extended glob extensions. The table below covers every supported construct.

| Pattern | Meaning | Example Match |
|---|---|---|
| `*` | Matches any sequence of characters except `/` - useful for targeting files within a single directory level | `*.ts` matches `index.ts` but not `src/index.ts` |
| `**` | Matches zero or more directory segments, enabling deep recursive traversal | `src/**/*.ts` matches `src/a/b/c.ts` at any depth |
| `?` | Matches exactly one character, excluding `/` - handy for single-character filename components | `?.ts` matches `a.ts` but not `ab.ts` |
| `[abc]` | Matches exactly one character from the explicitly listed set | `[ab].ts` matches `a.ts` or `b.ts` |
| `[!abc]` / `[^abc]` | Matches exactly one character that is *not* in the listed set | `[!a].ts` matches `b.ts` but not `a.ts` |
| `{a,b}` | Brace expansion - expands into multiple alternative patterns before matching | `*.{ts,js}` matches both `a.ts` and `a.js` |
| `@(a\|b)` | Extended glob - matches exactly one of the given alternatives | `@(ts\|js)` matches `ts` or `js` but not `tsx` |
| `?(a)` | Extended glob - matches zero or one occurrence of the pattern | `?(x).ts` matches `.ts` and `x.ts` but not `xx.ts` |
| `*(a)` | Extended glob - matches zero or more occurrences of the pattern | `*(x).ts` matches `.ts`, `x.ts`, and `xx.ts` |
| `+(a)` | Extended glob - matches one or more occurrences; unlike `*`, requires at least one match | `+(x).ts` matches `x.ts` and `xx.ts` but not `.ts` |
| `!(a)` | Extended glob - matches anything that does *not* match the given pattern within the segment | `!(node_modules)/*.ts` skips the `node_modules` directory |
| `\x` | Escape sequence - treats the next character as a literal rather than a special glob character | `file\.ts` matches the literal string `file.ts` |

### Negation vs. `ignore`

Both leading-`!` pattern negation and the `ignore` option exclude paths from results, but they behave differently:

- **Leading `!` patterns** are evaluated together with positive patterns as a set. A path is included only if at least one positive pattern matches and no negation pattern overrides it.
- **`ignore` patterns** are applied as a post-filter after all pattern matching is complete. They are unconditional - even if a path matches a positive pattern, an `ignore` hit removes it.

Use `ignore` for global exclusions like `node_modules` or `dist` that should never appear regardless of what patterns are active.


## Benchmarks

Benchmarks are included for the four main subsystems: pattern parsing, brace expansion, path matching, and full filesystem `glob()` calls. The fixture tree used spans 15+ files across a realistic directory structure, with additional stress tests reaching 50 levels of depth.

```sh
npm run bench
```


## Contributing

```sh
npm install
npm test              # run the full test suite
npm run test:coverage # run tests and generate a coverage report
npm run bench         # run benchmarks
npm run build         # compile TypeScript to dist/
```

Issues are welcome at [github.com/code-hemu/globefish](https://github.com/code-hemu/globefish). Please open an issue before submitting a large change so the approach can be discussed first.


## License

Globefish is licensed under **[MIT](LICENSE)**. Copyright © [Hemanta Gayen](https://github.com/hemanta-gayen).


