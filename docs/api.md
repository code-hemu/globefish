# globefish API

## `glob(patterns, options?)`

Returns an array of paths matching the given glob pattern(s).

```ts
import { glob } from "globefish";

const files = await glob("src/**/*.ts");
const all = await glob(["**/*.ts", "!tests/**"]);
```

### Signature

```ts
function glob(
  patterns: string | string[],
  options?: GlobOptions
): Promise<string[]>;
```

### Parameters

| Param | Type | Description |
|---|---|---|
| `patterns` | `string \| string[]` | One or more glob patterns. Patterns starting with `!` act as negations. |
| `options` | `GlobOptions` | Optional configuration object. |

### Returns

`Promise<string[]>` — resolved file paths relative to `cwd` (or absolute when `options.absolute` is `true`). Paths are de-duplicated and sorted.

---

## `GlobOptions`

```ts
type GlobOptions = {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
  dot?: boolean;
  followSymlinks?: boolean;
  maxDepth?: number;
  onlyFiles?: boolean;
  onlyDirectories?: boolean;
  markDirectories?: boolean;
};
```

| Option | Type | Default | Description |
|---|---|---|---|
| `cwd` | `string` | `process.cwd()` | Base directory for pattern matching. All returned paths are relative to this. |
| `ignore` | `string[]` | `[]` | Additional patterns to filter out (`.gitignore`-style syntax). |
| `absolute` | `boolean` | `false` | When `true`, returned paths are absolute. |
| `dot` | `boolean` | `false` | When `true`, leading dots in path segments are matched by `*`, `?`, and `[abc]`. |
| `followSymlinks` | `boolean` | `true` | Follow symbolic links while walking directories. |
| `maxDepth` | `number` | `Infinity` | Maximum directory depth to recurse into. |
| `onlyFiles` | `boolean` | `false` | When `true`, only files (not directories) are returned. |
| `onlyDirectories` | `boolean` | `false` | When `true`, only directories are returned. |
| `markDirectories` | `boolean` | `false` | When `true`, directory paths are suffixed with `/`. |

### `onlyFiles` / `onlyDirectories`

These two options are mutually exclusive in practice. If both are `true`, `onlyDirectories` takes precedence.

---

## `GlobEntry`

```ts
type GlobEntry = {
  path: string;
  dirent?: Dirent;
};
```

Reserved for a future streaming/event-based API. The `glob()` function currently returns `string[]`.

---

## Pattern Syntax

### Literals

Most characters match themselves. To match a special character literally, escape it with `\`:

```
glob("file\\.txt")     → matches "file.txt"
glob("file.txt")       → matches "file.txt" (dot is literal outside char classes)
```

### `*` — Wildcard

Matches any sequence of characters **except** `/` and a leading dot (when `dot` is `false`).

```
glob("*.ts")           → matches "index.ts", not "src/index.ts"
glob("src/*.ts")       → matches "src/index.ts", not "src/util/path.ts"
```

### `**` — Globstar

Matches zero or more directories across path segments.

```
glob("src/**/*.ts")    → matches "src/index.ts", "src/util/path.ts"
glob("**/*.ts")        → matches all .ts files anywhere
glob("a/**/b")         → matches "a/b", "a/x/b", "a/x/y/b"
```

### `?` — Single Character

Matches exactly one character (except `/` and a leading dot when `dot` is `false`).

```
glob("?.ts")           → matches "a.ts", not "ab.ts"
glob("file-?.txt")     → matches "file-1.txt", "file-a.txt"
```

### `[abc]` — Character Class

Matches any one character from the enclosed set. Supports ranges (`[a-z]`) and negation (`[!abc]` or `[^abc]`).

```
glob("[ab].ts")        → matches "a.ts", "b.ts"
glob("[a-z].ts")       → matches "a.ts" … "z.ts"
glob("[!a-z].ts")      → matches "1.ts", but not "a.ts"
```

### `{a,b}` — Brace Expansion

Expands into multiple patterns. Supports nesting and empty alternatives.

```
glob("*.{js,ts}")      → matches "a.js" and "a.ts"
glob("{a,b}/{1,2}")    → matches "a/1", "a/2", "b/1", "b/2"
glob("file{,.min}.js") → matches "file.js" and "file.min.js"
```

Escaped braces `\{` `\}` are treated as literal characters and not expanded.

### Extended Globs — `?(...)` `*(...)` `+(...)` `@(...)` `!(...)`

Extended glob patterns allow matching based on repetition and grouping within a path segment.

| Pattern | Meaning |
|---|---|
| `?(pattern)` | Match zero or one occurrence |
| `*(pattern)` | Match zero or more occurrences |
| `+(pattern)` | Match one or more occurrences |
| `@(pattern)` | Match exactly one occurrence |
| `!(pattern)` | Match anything **except** pattern |

Supports alternatives separated by `|`:

```
glob("*.@(ts|js)")     → matches "a.ts", "a.js", not "a.css"
glob("!(node_modules)/*.ts") → matches "src/index.ts", not "node_modules/..."
```

Extended globs can be nested:

```
glob("*.+(ts|js)")     → matches "a.ts", "a.js", "a.ts.js"
glob("?(!(*.ts))")     → matches "a.js", not "a.ts"
```

### Glob-Level Negation

When a pattern in a pattern array starts with `!`, it excludes matching paths. Later patterns override earlier ones — a positive pattern after a negation re-includes files.

```
glob(["**/*.ts", "!tests/**"])             → matches "src/index.ts", not "tests/glob.test.ts"
glob(["*.ts", "!test.ts", "test.ts"])      → includes "test.ts" (third pattern re-adds it)
glob(["!!secret.ts"])                       → double negation: includes only "secret.ts"
```

This is different from the `!(...)` extended glob, which is a pattern construct within a path segment.

---

## Ignore Patterns

The `ignore` option accepts an array of `.gitignore`-style patterns. These are applied after the glob match to filter out results.

```
glob("**/*.ts", {
  ignore: ["tests/**"]
})
```

Ignore pattern rules:
- `*` matches anything except `/`
- `**` matches zero or more directories
- `?` matches a single character except `/`
- `[abc]` character classes
- Leading `!` negates the rule
- Trailing `/` applies the rule only to directories (and their children)
- Leading `/` anchors the pattern to the root of the cwd

---

## Error Types

The package exports typed error classes that can be caught with `instanceof`:

```ts
import { GlobError, PatternSyntaxError, WalkError } from "globefish";

try {
  await glob("{unclosed");
} catch (e) {
  if (e instanceof PatternSyntaxError) {
    console.error("Invalid pattern:", e.message);
  }
}
```

- **`GlobError`** — Base error for all glob-related errors
- **`PatternSyntaxError`** — Thrown when a pattern has invalid syntax (unclosed braces, unclosed char classes, unclosed extglob groups)
- **`WalkError`** — Filesystem walk errors (reserved, not currently thrown)

---

## Examples

```ts
import { glob } from "globefish";

// Basic usage
const tsFiles = await glob("src/**/*.ts");

// Multiple patterns with negation
const allExceptTests = await glob(["**/*.ts", "!tests/**"]);

// With options
const absolutePaths = await glob("**/*.ts", {
  cwd: "./src",
  absolute: true,
  dot: true,
});

// Ignore node_modules and hidden directories
const sourceFiles = await glob("**/*.{ts,js}", {
  ignore: [
    "node_modules/**",
    ".git/**",
  ],
});

// Only directories
const dirs = await glob("src/**", { onlyDirectories: true });
```
