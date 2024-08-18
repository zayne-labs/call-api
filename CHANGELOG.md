# @zayne-labs/callapi

## 0.7.0

### Minor Changes

-  2df4132: feat: made requestKey to be a combination of options and url
   ![BREAKING] - removed cancel property from callApi

### Patch Changes

-  5ec6d9b: improve types

## 0.6.0

### Minor Changes

-  37a6d8e: added a new interceptor that runs both onResponse and onRequestErrors

## 0.5.4

### Patch Changes

-  eebc2a8: create isQueryString Utility, update docs

## 0.5.3

### Patch Changes

-  0d83e43: removed manual headers handling for only formData

## 0.5.2

### Patch Changes

-  5aaa7b5: fix success response returning errorInfo instead error

## 0.5.1

### Patch Changes

-  cad5d81: fixed a bug in fetch creator

## 0.5.0

### Minor Changes

-  6ec8f12: Add cloneResponse Option to callApi

## 0.4.7

### Patch Changes

-  38d444d: update docs

## 0.4.6

### Patch Changes

-  5ae2242: upgrade engines field to node 18.17.x

## 0.4.5

### Patch Changes

-  566fb56: added reason option to cancel method

## 0.4.4

### Patch Changes

-  7d732a1: Improvements to AbortError messages

## 0.4.3

### Patch Changes

-  19ac795: lil change to merge util

## 0.4.2

### Patch Changes

-  4240557: Add Documentation website

## 0.4.1

### Patch Changes

-  c98edc8: Add Documentation website

## 0.4.0

### Minor Changes

-  dc92197: changed errorName to just name

## 0.3.4

### Patch Changes

-  b21eb8b: refactored httpError class to better support response object.assign

## 0.3.3

### Patch Changes

-  d36c285: removed abort.any type cast
-  ffffc02: fixed the respone spread issue

## 0.3.2

### Patch Changes

-  f2762ec: improve types for auth

## 0.3.1

### Patch Changes

-  7a27edd: provided a response clone to the getResponseData function, to prevent bodyused errors when user tries to call res.whatever() in interceptor

## 0.3.0

### Minor Changes

-  aaa3951: Improved error handling experience, as well as the docs

## 0.2.7

### Patch Changes

-  9190d6a: add separate configs for esm and cjs, with diff folders

## 0.2.6

### Patch Changes

-  2d418c5: remove src dir from dist

## 0.2.5

### Patch Changes

-  2c8dbd6: add support for token version of auth header, also updated docs

## 0.2.4

### Patch Changes

-  5e35ac4: expanded conditional types in pkg.json to resolve to proper types

## 0.2.3

### Patch Changes

-  3907e38: update types in pkg.json

## 0.2.2

### Patch Changes

-  b448415: fix: update entry points

## 0.2.1

### Patch Changes

-  da4d300: chore: update build dir structure

## 0.2.0

### Minor Changes

-  66c4dad: feat: added option for adding custom validator function

### Patch Changes

-  66c4dad: refactor: exposed createFetchClient function for users who prefer it

## 0.1.1

### Patch Changes

-  f2e0417: fix: fix build by adding missing entry

## 0.1.0

### Minor Changes

-  9128630: feat: added a new feature for auth tokens
-  9128630: Updated a few types and parts of the api to be more user friendly

### Patch Changes

-  9128630: docs: added proper docs to readme

## 0.0.6

### Patch Changes

-  2f2c22c: add main entry point via pkg.json

## 0.0.5

### Patch Changes

-  7e3fd59: fix: update package.json to better resolve necessary files and update typescript version

## 0.0.4

### Patch Changes

-  a9f7824: changed package.json files property to hold src files instead of dist

## 0.0.3

### Patch Changes

-  dfbadb2: fix: removed clone calls from reponse to prevent crashing

## 0.0.2

### Patch Changes

-  6922422: feat: added more paths to entry
