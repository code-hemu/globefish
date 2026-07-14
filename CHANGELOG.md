# Changelog

## [1.1.0] - 2026-07-14

### Added
- `globSync()` — synchronous version of `glob()` for use when async is not suitable
- `globStream()` — async generator that yields matching paths as they are discovered, without buffering all results in memory
- `nosort` option — skip result sorting for improved performance on large sets
- `nounique` option — preserve duplicate paths in results
- Public export of `matchPath()`, `matchGlob()`, `parsePattern()`, and `expandPatterns()` for advanced use cases
- `MatchOptions` type exported for use with `matchPath()` and `matchGlob()`

## [1.0.1] - 2026-07-14

### Added
- Brace expansion support (`{a,b}`, nested braces, empty alternatives)
- Extended glob support (`?(...)`, `*(...)`, `+(...)`, `@(...)`, `!(...)`)
- Glob-level negation via leading `!` prefix
- Ignore rules via `.gitignore`-style patterns in `ignore` option
- Escape sequences for literal special characters
- Async API — `glob()` returns `Promise<string[]>`
- Full POSIX character class support (`[abc]`, `[!abc]`, `[^abc]`)
- Option flags: `cwd`, `absolute`, `dot`, `followSymlinks`, `maxDepth`, `onlyFiles`, `onlyDirectories`, `markDirectories`
- File system walker with configurable depth and symlink handling
- Comprehensive test suite (match, expand, glob, ignore, walker)
- Benchmark suite (pattern parsing, brace expansion, path matching, full glob)
- API documentation (`docs/api.md`)

### Fixed
- Path matching edge cases resolved
- Dead code removed

### Changed
- Updated documentation and benchmarks
- README improvements

## [1.0.0] - 2026-07-14

Initial release of globefish.
