<p align="center">
  <a href="https://github.com/code-hemu/globefish">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/light_logo.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/dark_logo.png" />
      <img src="https://raw.githubusercontent.com/code-hemu/globefish/refs/heads/main/resources/dark_logo.png" alt="globefish logo" width="312px" />
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
  A fast, full-featured glob engine for Node.js.<br />
  Patterns, brace expansion, extended globs, ignore rules - all in one zero-dependency package.
</p>

## Features

- **Glob patterns** - `*`, `**`, `?`, `[abc]`, `[!abc]`, `[^abc]`
- **Brace expansion** - `{a,b}`, nested braces, empty alternatives
- **Extended globs** - `?(...)`, `*(...)`, `+(...)`, `@(...)`, `!(...)`
- **Glob-level negation** - `!pattern` to exclude from results
- **Ignore rules** - `.gitignore`-style filtering via the `ignore` option
- **Escape sequences** - `\*`, `\{`, etc. for literal special chars
- **Async API** - returns `Promise<string[]>`
- **TypeScript** - first-class types with full `GlobOptions`
- **Zero dependencies** - pure Node.js, no runtime deps

## Installation

```sh
npm install globefish
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

| Param | Type | Default | Description |
|---|---|---|---|
| `patterns` | `string \| string[]` | - | One or more glob patterns. Leading `!` negates. |
| `options.cwd` | `string` | `process.cwd()` | Working directory |
| `options.ignore` | `string[]` | `[]` | `.gitignore`-style ignore patterns |
| `options.absolute` | `boolean` | `false` | Return absolute paths |
| `options.dot` | `boolean` | `false` | Match dotfiles (`.` prefix) |
| `options.followSymlinks` | `boolean` | `true` | Follow symbolic links |
| `options.maxDepth` | `number` | `Infinity` | Maximum directory depth |
| `options.onlyFiles` | `boolean` | `false` | Only files, not directories |
| `options.onlyDirectories` | `boolean` | `false` | Only directories, not files |
| `options.markDirectories` | `boolean` | `false` | Append `/` to directory paths |

> Full API reference including pattern syntax details: [`docs/api.md`](docs/api.md)

## Pattern Syntax Quick Reference

| Pattern | Meaning | Example Match |
|---|---|---|
| `*` | Any chars except `/` | `*.ts` → `index.ts` |
| `**` | Zero or more directories | `src/**/*.ts` → `src/a/b.ts` |
| `?` | Single char except `/` | `?.ts` → `a.ts` |
| `[abc]` | Char in set | `[ab].ts` → `a.ts` |
| `[!abc]` / `[^abc]` | Char not in set | `[!a].ts` → `b.ts` |
| `{a,b}` | Brace alternatives | `*.{ts,js}` → `a.ts`, `a.js` |
| `@(a\|b)` | Exactly one | `@(ts\|js)` → `ts` or `js` |
| `?(a)` | Zero or one | `?(x).ts` → `.ts`, `x.ts` |
| `*(a)` | Zero or more | `*(x).ts` → `.ts`, `x.ts`, `xx.ts` |
| `+(a)` | One or more | `+(x).ts` → `x.ts`, `xx.ts` |
| `!(a)` | Negation within segment | `!(node_modules)/*.ts` |
| `\x` | Escape literal | `file\.ts` matches `file.ts` |

## Benchmarks

```sh
npm run bench
```

Benchmarks cover parsing, brace expansion, path matching, and filesystem `glob()` integration across a realistic fixture tree (15+ files, 50-level depth test).

## Contributing

```sh
npm install
npm test             # run tests
npm run test:coverage # run tests with coverage
npm run bench        # run benchmarks
npm run build   # compile TypeScript
```

PRs and issues welcome at [github.com/code-hemu/globefish](https://github.com/code-hemu/globefish).

## License

[MIT](LICENSE) © [Hemu](https://github.com/code-hemu)
