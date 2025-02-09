# @zayne-labs/callapi-legacy

## 1.5.1

### Patch Changes

- 301715a: refactor(types)!: ♻️ 🏗️ make schema errors intuitive and easy to disable by including undefined

## 1.5.0

### Minor Changes

- 7c29408: feat: add support for validating every request detail via schemas

## 1.4.4

### Patch Changes

- 233b2b7: 🔧 fix(types): initialize plugin type generic with never to remove type errors

## 1.4.0

### Minor Changes

- 00440df: feat(core)!: ✨ add schema validation with standard-schema support
  chore(deps):⬆️ upgrade pnpm to 10.2.1
  docs(error-handling): 📝 improve error handling docs
  style(docs): 🎨 update docs UI and improve navigation
  fix(docs): 🔗 update broken links in README files

## 1.3.5

### Patch Changes

- bf6002b: chore(deps): ⬇️ downgrade fumadocs packages due to failed tailwind migration
  feat(exports): ✨ expose retry constants from utils
  chore(eslint): 🔧 enable tailwindcss config validation

## 1.3.3

### Patch Changes

- 621f15f: fix: improve types

## 1.3.1

### Patch Changes

- ed6412d: fix: fix type issues with interceptor
  feat: allow plugin hooks to also be arrays

## 1.3.0

### Minor Changes

- cbedc52: 🔄 refactor(retry): rename retryCodes to retryStatusCodes for clarity ✨ feat(retry): add POST to default retry methods
  📝 docs(hooks): reorganize hooks documentation for better readability 🗑️ refactor(docs): merge retries.mdx into timeout-and-retries.mdx

## 1.2.1

### Patch Changes

- 28b68df: 🔧 fix(fetch): remove fullURL option from request options to extra-options

## 1.2.0

### Minor Changes

- 0f333f7: feat(core): ✨ Add retry functionality and enhance core components

   feat(docs): 📚 Update documentation structure and title

   chore(types): 🏗️ Refactor type definitions and utilities

## 1.1.0

### Minor Changes

- 4ff75bc: feat!: rename requestKey to dedupeKey

## 1.0.0

### Major Changes

- 445c87b: release(packages): 🚀 official bump of @zayne-labs/callapi and @zayne-labs/callapi-legacy to v1.0.0
