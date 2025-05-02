---
"@zayne-labs/callapi": patch
---

refactor(retry)!: revamp retry system with improved type safety and flexibility 🔄 ⚡️

feat(retry): add function support for retry delay configuration 🎛️
feat(retry): make attempts required in InnerRetryOptions 🔒
feat(retry): add UnmaskType utility for better type inference 🎯
refactor(retry): rename ~retryCount to ~retryAttemptCount for clarity 📝
refactor(retry): move retry constants to retry.ts for better organization 🏗️
refactor(retry): improve retry strategy handling with switch statement 🔀
refactor(retry): enhance status code and method checking with Set 🚀
chore(deps): update @zayne-labs/toolkit-type-helpers to 0.9.33 📦
