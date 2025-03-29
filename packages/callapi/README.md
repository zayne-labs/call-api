# CallApi

[![Build Size](https://img.shields.io/bundlephobia/minzip/@zayne-labs/callapi?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=@zayne-labs/callapi)[![Version](https://img.shields.io/npm/v/@zayne-labs/callapi?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@zayne-labs/callapi)

CallApi Fetch is an extra-lightweight wrapper over fetch that provides quality of life improvements beyond the bare fetch api, while keeping the API familiar.

It takes in a url and a request options object, just like fetch, but with some additional options to make your life easier. Check out the [API Reference](https://zayne-labs-callapi.netlify.app/docs/latest/all-options) for a quick look at each option.

# Docs

[View Documentation website](https://zayne-labs-callapi.netlify.app)

## Installing `CallApi`

### Through npm (recommended)

```bash
# npm
npm install @zayne-labs/callapi

# pnpm
pnpm add @zayne-labs/callapi
```

Then you can use it by importing it in your JavaScript file.

```js
import { callApi } from "@zayne-labs/callapi";
```

### Using `CallApi` without `npm`

You can import callApi directly into JavaScript through a CDN.

To do this, you first need to set your `script`'s type to `module`, then import `callApi`.

```html
<script type="module">
	import { callApi } from "https://esm.run/@zayne-labs/callapi";
</script>

<!-- Locked to a specific version -->
<script type="module">
	import { callApi } from "https://esm.run/@zayne-labs/callapi@0.3.2";
</script>
```
