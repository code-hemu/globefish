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

`Promise<string[]>` - resolved file paths relative to `cwd` (or absolute when `options.absolute` is `true`). Paths are de-duplicated and sorted.


## `globSync(patterns, options?)`

Synchronous version of `glob()`. Uses synchronous filesystem operations.

```ts
import { globSync } from "globefish";

const files = globSync("src/**/*.ts");
```

### Signature

```ts
function globSync(
  patterns: string | string[],
  options?: GlobOptions
): string[];
```


## `globStream(patterns, options?)`

Streaming version of `glob()`. Yields matching paths as they are discovered, without buffering all results in memory.

```ts
import { globStream } from "globefish";

for await (const file of globStream("src/**/*.ts")) {
  processFile(file); // handle each result as it arrives
}
```

### Signature

```ts
function globStream(
  patterns: string | string[],
  options?: GlobOptions
): AsyncGenerator<string>;
```


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
  nosort?: boolean;
  nounique?: boolean;
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
| `nosort` | `boolean` | `false` | When `true`, result paths are returned in filesystem discovery order instead of sorted alphabetically. |
| `nounique` | `boolean` | `false` | When `true`, duplicate paths are not removed from results. |
| `concurrency` | `number` | `1` | Maximum number of directories to traverse in parallel. Higher values can improve performance on SSDs and network filesystems. |

### `onlyFiles` / `onlyDirectories`

These two options are mutually exclusive in practice. If both are `true`, `onlyDirectories` takes precedence.

### `nosort`

By default, results are sorted alphabetically. Setting `nosort: true` skips sorting, which can improve performance on large result sets.

### `nounique`

By default, duplicate paths are removed. Setting `nounique: true` preserves duplicates, which may occur when multiple patterns match the same file.

### `concurrency`

Controls how many directories are read in parallel during filesystem traversal. The default `1` processes one directory at a time (serial). Setting a higher value (e.g., `16`, `64`) can improve performance on fast SSDs or network filesystems by overlapping I/O operations.

```ts
const files = await glob("**/*.ts", { concurrency: 16 });
```

Higher concurrency is not always better - it depends on your storage device and the directory structure. Experiment with values between `4` and `64` to find the sweet spot.


## `GlobEntry`

```ts
type GlobEntry = {
  path: string;
  dirent?: Dirent;
};
```

Reserved for a future streaming/event-based API. The `glob()` function currently returns `string[]`.


## Pattern Syntax

### Literals

Most characters match themselves. To match a special character literally, escape it with `\`:

```
glob("file\\.txt")     → matches "file.txt"
glob("file.txt")       → matches "file.txt" (dot is literal outside char classes)
```

### `*` - Wildcard

Matches any sequence of characters **except** `/` and a leading dot (when `dot` is `false`).

```
glob("*.ts")           → matches "index.ts", not "src/index.ts"
glob("src/*.ts")       → matches "src/index.ts", not "src/util/path.ts"
```

### `**` - Globstar

Matches zero or more directories across path segments.

```
glob("src/**/*.ts")    → matches "src/index.ts", "src/util/path.ts"
glob("**/*.ts")        → matches all .ts files anywhere
glob("a/**/b")         → matches "a/b", "a/x/b", "a/x/y/b"
```

### `?` - Single Character

Matches exactly one character (except `/` and a leading dot when `dot` is `false`).

```
glob("?.ts")           → matches "a.ts", not "ab.ts"
glob("file-?.txt")     → matches "file-1.txt", "file-a.txt"
```

### `[abc]` - Character Class

Matches any one character from the enclosed set. Supports ranges (`[a-z]`) and negation (`[!abc]` or `[^abc]`).

```
glob("[ab].ts")        → matches "a.ts", "b.ts"
glob("[a-z].ts")       → matches "a.ts" … "z.ts"
glob("[!a-z].ts")      → matches "1.ts", but not "a.ts"
```

### `{a,b}` - Brace Expansion

Expands into multiple patterns. Supports nesting and empty alternatives.

```
glob("*.{js,ts}")      → matches "a.js" and "a.ts"
glob("{a,b}/{1,2}")    → matches "a/1", "a/2", "b/1", "b/2"
glob("file{,.min}.js") → matches "file.js" and "file.min.js"
```

Escaped braces `\{` `\}` are treated as literal characters and not expanded.

### Extended Globs - `?(...)` `*(...)` `+(...)` `@(...)` `!(...)`

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

When a pattern in a pattern array starts with `!`, it excludes matching paths. Later patterns override earlier ones - a positive pattern after a negation re-includes files.

```
glob(["**/*.ts", "!tests/**"])             → matches "src/index.ts", not "tests/glob.test.ts"
glob(["*.ts", "!test.ts", "test.ts"])      → includes "test.ts" (third pattern re-adds it)
glob(["!!secret.ts"])                       → double negation: includes only "secret.ts"
```

This is different from the `!(...)` extended glob, which is a pattern construct within a path segment.


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

- **`GlobError`** - Base error for all glob-related errors
- **`PatternSyntaxError`** - Thrown when a pattern has invalid syntax (unclosed braces, unclosed char classes, unclosed extglob groups)
- **`WalkError`** - Filesystem walk errors (reserved, not currently thrown)


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

// Sync usage
const syncFiles = globSync("src/**/*.ts");

// Stream usage
for await (const file of globStream("**/*.ts", { ignore: ["node_modules/**"] })) {
  console.log(file);
}
```


## Low-level APIs

These functions are exported for advanced use cases but are used internally by `glob()`.

### `matchPath(path, pattern, options?)`

Returns `true` if `path` matches the given glob `pattern`.

```ts
import { matchPath } from "globefish";

matchPath("src/index.ts", "src/*.ts");      // true
matchPath("src/index.ts", "src/*.js");      // false
matchPath(".git/config", "**/*", { dot: true }); // true
```

### `matchGlob(path, patterns, options?)`

Returns `true` if `path` matches any of the given patterns.

```ts
import { matchGlob } from "globefish";

matchGlob("a.ts", ["*.ts", "*.js"]);  // true
matchGlob("a.css", ["*.ts", "*.js"]); // false
```

### `parsePattern(pattern)`

Parses a glob pattern string into an array of `PatternNode` tokens. Throws `PatternSyntaxError` on invalid syntax.

```ts
import { parsePattern } from "globefish";

const nodes = parsePattern("src/**/*.ts");
// [{ type: "literal", value: "src" }, { type: "separator" },
//  { type: "globstar" }, { type: "separator" },
//  { type: "star" }, { type: "literal", value: ".ts" }]
```

### `expandPatterns(patterns)`

Performs brace expansion on one or more patterns. Returns an array of expanded strings.

```ts
import { expandPatterns } from "globefish";

expandPatterns("{a,b}/{1,2}"); // ["a/1", "a/2", "b/1", "b/2"]
expandPatterns(["*.{ts,js}", "*.css"]); // ["*.ts", "*.js", "*.css"]
```
