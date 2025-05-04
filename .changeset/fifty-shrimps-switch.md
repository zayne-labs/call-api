---
"@zayne-labs/callapi": patch
---

feat(error-handling): ✨ replace error.ts with result.ts introducing Result type
fix(auth): 🚑 make header resolution async in mergeAndResolveHeaders
chore(deps): 🔧 update type guards to reference new result module
refactor(types): ♻️ consolidate conditional types and common type utils
fix(headers): 🚑 handle async auth header generation
types(guards): 🏷️ update PossibleHTTPError imports to use result.ts
