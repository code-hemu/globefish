# Changelog

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
