---
"@zayne-labs/callapi": patch
---

feat: abstract validation and add new resultMode for allWithoutResponse

This commit introduces data validation for both success and error responses using schemas and validators. It also refactors error handling to provide more context and flexibility.

- Implemented `handleValidation` function to validate response data against schemas and validators.
- Modified `createFetchClient` and `createFetchClientWithOptions` to include validation of success and error data.
- Updated `resolveErrorResult` to provide more detailed error information.
- Refactored dedupe strategy to improve readability and maintainability.
- Added `omitKeys` and `pickKeys` utility functions for object manipulation.
- Updated types and contexts to reflect the changes in error handling and validation.
- Increased size limit in `package.json` to accommodate the new features.
