# CallApi

[![Build Size](https://img.shields.io/bundlephobia/minzip/@zayne-labs/callapi?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=@zayne-labs/callapi)[![Version](https://img.shields.io/npm/v/@zayne-labs/callapi?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@zayne-labs/callapi)

CallApi Fetch is an extra-lightweight wrapper over fetch that provides quality of life improvements beyond the bare fetch api, while keeping the API familiar.

It takes in a url and a request options object, just like fetch, but with some additional options to make your life easier. Check out the [API Reference](#api-reference) for a quick look at each option.

## Installing CallApi

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

### Using `callApi` without `npm`

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

## Docs

[View Documentation website](https://zayne-callapi.vercel.app/)

## Quick Start

You can use callApi just like a normal `fetch` function. The only difference is you don't have to write a `response.json` or `response.text`, you could just destructure the data and error directly.

This also means that all options for the native fetch options are supported, and you can use the same syntax to send requests.

```js
const { data, error } = await callApi("url", fetchOptions);
```

You also have access to the response object itself via destructuring:

```js
const { data, error, response } = await callApi("url", fetchOptions);
```

To see how to use callApi with typescript for extra autocomplete convenience, visit the [Typescript section](#usage-with-typescript)

<br>

# Helpful Features

## ✔️ Supported response types

CallApi supports all response types offered by the fetch api like `json`, `text`,`blob`,`formData` etc, so you don't have to write `response.json()`, `response.text()`, `response.formData()` etc.

You can configure the response type you prefer by passing in the `responseType` option and setting it to the form you want the data from the response to be in. By default it's set to `json`.

```js
// Json (default)
const { data } = await callApi("url", { responseType: "json" });
// Text
const { data } = await callApi("url", { responseType: "text" });
// Blob, etc
const { data } = await callApi("url", { responseType: "blob" });


// Doing this in fetch would imply:
const response = await fetch("some-url");

const data = await response.json(); // Or response.text() or response.blob() etc
```

## ✔️ Easy error handling via `async`/`await`

CallApi provides a unified error handling through an `error` object, which captures both HTTP errors (errors coming as a response from the api) and standard JavaScript errors.

The `error` object contains the following properties:

1. `name`: A string indicating the type of error (e.g., 'TypeError', 'SyntaxError', 'HTTPError').
2. `message`: The error message describing what went wrong.
3. `errorData`: The error data, which can be an error response from the API or a standard JavaScript error object.

For HTTP errors:

- `name` is set to "HTTPError"
- An additional `errorData` property contains the error response data from the API.

For non-HTTP errors (e.g., TypeError, SyntaxError):

- `name` reflects the specific JavaScript error type (i.e., 'TypeError', 'SyntaxError')
- The `errorData` property contains the original JavaScript Error object.

This structure allows you to easily identify and handle different types of errors that may occur during API calls.

```js
const { data, error } = await callApi("some-url");

console.log(error.name);
console.log(error.message);
// Will reference the would contain the parsed error response data if it is an HTTPError, else it would just reference the corresponding js Error object
console.log(error.errorData);
```

For extra convenience with typescript, visit the [Typescript section](#usage-with-typescript)

## ✔️ Automatic Cancellation of Redundant Requests (No more race conditions🤩)

`CallApi` uses an internal request management system to ensure that only the most recent request to a given URL is processed, hence preventing the dreaded race conditions.

**How this feature Works in detail**:

- When a request is made, `callApi` internals check if there's an ongoing request to the same URL.
- If a pending request exists, it's automatically cancelled.
- Then the new request is sent.
- This process is repeated until it is certain that only the latest request to that same URL is allowed to proceed.

![Example of automatic cancellation](./assets/image.avif)

**Key takeaways**:

- Automatic Cancellation: When multiple requests are made to the same URL in quick succession, `callApi` automatically cancels any pending previous requests, allowing only the latest request to proceed.
- Race Condition Prevention: This mechanism eliminates race conditions that can occur when rapid, successive API calls are made, such as during fast typing in a search input, button clicks, etc.
- Ideal for React Hooks: This feature is particularly useful when `callApi` is used within React's useEffect hook or similar scenarios where component updates might trigger multiple API calls.
- Configurable: If you prefer to handle request management differently, you can disable this feature by setting { cancelRedundantRequests: false } in the fetch options. No pressure 👌.
- Manual Cancellation: You can manually cancel requests to a specific URL using the cancel method attached to `callApi`. You can also pass an abort controller signal to `callApi` (just like with fetch) as an option and abort the request when you want to.

Using `callApi.cancel`:

```js
callApi("some-url");

callApi.cancel("some-url");
```

Using `AbortController`:

```js
const controller = new AbortController();

callApi("some-url", { signal: controller.signal });

controller.abort();
```

## ✔️ Query search params

You can add `query` object as an option and callApi will create a query string for you automatically.

```js
callApi("some-url", {
 query: {
  param1: "value1",
  param2: "to encode",
 },
});

// The above request can be written in Fetch like this:
fetch("url?param1=value1&param2=to%20encode");
```

## ✔️ `Content-Type` generation based on `body` content

`CallApi` sets `Content-Type` automatically depending on your `body` data. Supported data types for this automatic setting include:

- Object
- Query Strings
- FormData

If you pass in an `object`, callApi will set `Content-Type` to `application/json`. It will also `JSON.stringify` your body so you don't have to do it yourself.

```js
callApi.post("some-url", {
 body: { message: "Good game" },
});

// The above request is equivalent to this
fetch("some-url", {
 method: "post",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ message: "Good game" }),
});
```

If you pass in a string, callApi will set `Content-Type` to `application/x-www-form-urlencoded`.

`CallApi` also contains a `toQueryString` method that can help you convert objects to query strings so you can use this option easily.

```js
import { toQueryString } from "@zayne-labs/callapi";

callApi("some-url", {
 method: "POST",
 body: toQueryString({ message: "Good game" }),
});

// The above request is equivalent to this
fetch("some-url", {
 method: "post",
 headers: { "Content-Type": "application/x-www-form-urlencoded" },
 body: "message=Good%20game",
});
```

If you pass in a FormData, callApi will let the native `fetch` function handle the `Content-Type`. Generally, this will use `multipart/form-data` with the default options.

```js
const data = new FormData(form.elements);

callApi("some-url", { body: data });
```

## ✔️ Authorization header helpers

If you provide callApi with an `auth` property, it will conveniently generate an Authorization Header for you.

If you pass in a `string` (commonly for tokens) , it will generate a Bearer Auth.

But if you pass in an `object`, you would have two options to chose from:

- Use `bearer` option if you want to generate a Bearer Auth Header.
- Use `token` if you want to generate a Token Auth Header.

**Passing a string:**

```js
callApi("some-url", { auth: "token12345" });
```

The above request can be written in Fetch like this:

```js
fetch("some-url", {
 headers: { Authorization: `Bearer token12345` },
});
```

**Passing an object:**

```js
// For Bearer Auth
callApi("some-url", { auth: { bearer: "token12345" } });

// Or

// For Token Auth
callApi("some-url", { auth: { token: "token12345" } });
```

The above requests can be written in Fetch like this:

```js
// For Bearer Auth
fetch("some-url", {
 headers: { Authorization: `Bearer token12345` },
});

// Or

// For Token Auth
fetch("some-url", {
 headers: { Authorization: `Token token12345` },
});
```

## ✔️ Creating a callApi Instance

You can create an instance of `callApi` with predefined options. This is super helpful if you need to send requests with similar `options`.

**Things to note:**

- All `options` that can be passed to `callApi` can also be passed to `callApi.create`.
- Any options passed to `callApi.create` will be applied to all requests made with the instance.
- If you pass a similar `options` property to the instance, the instance's options will take precedence.

```js
import { callApi } from "@zayne-labs/callapi";

// Creating the instance, with some base options
const callAnotherApi = callApi.create({
 timeout: 5000,
 baseURL: "https://api.example.com"
});

// Using the instance
const { data, error } = await callAnotherApi("some-url");

// Overriding the timeout option (all base options can be overridden via the instance)
const { data, error } = await callAnotherApi("some-url", {
 timeout: 10000,
});
```

You could also use the `createFetchClient` function to create an instance, if you don't want to use `callApi.create`.

```js
import { createFetchClient } from "@zayne-labs/callapi";

const callApi = createFetchClient({
 timeout: 5000,
 baseURL: "https://api.example.com"
});
```

## ✔️ Custom response parser and custom body serializer

By default callApi supports all response types offered by the fetch api like `json`, `text`,`blob` etc, so you don't have to write `response.json()`, `response.text()` or `response.blob()`.

But if you want to parse a response with a custom function other than the default `JSON.parse`, you can pass a custom parser function to the `responseParser` option.

```js
const { data, error } = await callApi("url", {
 responseParser: customResponseParser,
});
```

Or even better, provide it as a callApi base option.

```js
const callAnotherApi = callApi.create({
 responseParser: customResponseParser,
});
```

You could also provide a custom serializer/stringifier, other the default `JSON.stringify`, for objects passed to the reuqest body via the `bodySerializer` option.

```js
const callAnotherApi = callApi.create({
 bodySerializer: customBodySerializer,
});
```

## ✔️Validator function

CallApi also provides a `responseValidator` option, which could pass in a function that would validate the data returned from the server.

A good use case for this would to pass in, for instance, a zod schema parse/safeParse function to validate the data.

If your parser function throws an error, and have the `throwOnError` option set to `true`, you will expected to check and handle the errors in a catch block.
But, if `throwOnError` is set to `false` (default), it will just return the error object as usual.

```js
const callMainApi = await callApi.create({
 responseValidator: zodSchema.parse, // or zodSchema.safeParse or any other validator you wish to use
});
```

## ✔️ Interceptors (just like axios)

Providing interceptors to hook into lifecycle events of a `callApi` call is possible.

These interceptors can be either asynchronous or synchronous.

**Note: You might want to use `callApi.create` to set shared interceptors**

### `onRequest({ request, options })`

`onRequest` is called function that is called just before the request is made, allowing you to modify the request or perform additional operations.

```js
await callApi("/api", {
 onRequest: ({ request, options }) => {
  // Log request
  console.log(request, options);

  // Do other stuff
 },
});
```

### `onRequestError({ error, request, options,})`

`onRequestError` when an error occurs during the fetch request and it fails, providing access to the error object, request details and fetch options.

```js
await callApi("/api", {
 onRequestError: ({ request, options, error }) => {
  // Log error
  console.log("[fetch request error]", request, error);
 },
});
```

### `onResponse({ response, request, options })`

`onResponse` will be called when a successful response is received, providing access to the response, request details and fetch options.

The response object here contains all regular fetch response properties, plus a `data` property, which contains the parsed response body.

```js
await callApi("/api", {
 onResponse: ({ request, response, options }) => {
  // Log response
  console.log(request, response.status, response.data);

  // Do other stuff
 },
});
```

### `onResponseError({ request, options, response })`

`onResponseError` is called when an error response (status code >= 400) is received from the api, providing access to the response object, request details, and fetch options used.

The response object here contains all regular fetch response properties, plus an `errorData` property, which contains the parsed response error json response, if the server returns one.

**This to note for this interceptor to be triggered:**

- The `response.ok` property will be `false`.
- The `response.status` property will be >= 400.
- Essentially only error http responses return by the api will trigger this interceptor.
- It won't trigger for error responses not from the api, like network errors, syntax errors etc. Handle those in `onRequestError` interceptor.

The response object here contains all regular fetch response properties, plus an `errorData` property, which contains the parsed response error json response, if the server returns one.

This example uses a shared interceptor for all requests made with the instance.

```js
const callAnotherApi = callApi.create({
 onResponseError: ({ response, request, options }) => {
  // Log error response
  console.log(request, response.status, response.errorData);

  // Perform action on various error conditions
  if (response.status === 401) {
   actions.clearSession();
  }

  if (response.status === 429) {
   toast.error("Too may requests!");
  }

  if (response.status === 403 && response.errorData?.message === "2FA is required") {
   toast.error(response.errorData?.message, {
    description: "Please authenticate to continue",
   });
  }

  if (response.status === 500) {
   toast.error("Internal server Error!");
  }
 },
});
```

## ✔️ Retries

`CallApi` support retries for requests if an error happens and if the response status code is included in `retryStatusCodes` list:

**Default Retry status codes:**

- `408` - Request Timeout
- `409` - Conflict
- `425` - Too Early
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

You can specify the amount of retries and delay between them using `retry` and `retryDelay` options and also pass a custom array of codes using `retryStatusCodes` option.

You can also specify which methods should be retried by passing in a custom `retryMethods` array.

The default for `retry` is `0` retries.
The default for `retryDelay` is `0` ms.
The default for `retryMethods` is `["GET", "POST"]`.

```js
await callApi("http://google.com/404", {
 retry: 3,
 retryDelay: 500, // ms
 retryStatusCodes: [404, 502, 503, 504], // custom status codes for retries
 retryMethods: ["POST", "PUT", "PATCH", "DELETE"], // custom methods for retries
});
```

## ✔️ Timeout

You can specify `timeout` in milliseconds to automatically abort a request after a timeout (default is disabled).

```js
await callApi("http://google.com/404", {
 timeout: 3000, // Timeout after 3 seconds
});
```

## ✔️ Throw on all errors

You can throw an error on all errors (including http errors) by passing `throwOnError` option. This makes callApi play nice with other libraries that expect a promise to resolve to a value, for example `React Query`.

```js
const callMainApi = callApi.create({
 throwOnError: true,
});

const { data, error } = useQuery({
 queryKey: ["todos"],
 queryFn: async () => {
  // CallApi will throw an error if the request fails or there is an error response, which react query would handle
  const { data } = await callMainApi("todos");

  return data;
 },
});
```

Doing this with regular fetch would imply the following extra steps:

```js
const { data, error } = useQuery({
 queryKey: ["todos"],
 queryFn: async () => {
  const response = await fetch("todos");

  if (!response.ok) {
   throw new Error("Failed to fetch");
  }

  return response.json();
 },
});
```

For even more convenience, you can specify a resultMode for callApi in addition with the throwOnError option. Use this if you feel to lazy to make a tiny wrapper over callApi for something like react query:

```js
const callMainApi = callApi.create({
 throwOnError: true,
 resultMode: "onlySuccess",
});

const { data, error } = useQuery({
 queryKey: ["todos"],
 // CallApi will throw on errors here, and also return only data, which react query is interested in
 queryFn: () => callMainApi("todos"),
});
```

## Usage with Typescript

- You can provide types for the success and error data via generics, to enable autocomplete and type checking in your codebase.

```ts
const callMainApi = callApi.create<FormResponseDataType, FormErrorResponseType>({
 baseURL: BASE_AUTH_URL,

 method: "POST",

 retries: 3,

 credentials: "same-origin",
});
```

- Just like the fetch options, all type parameters (generics) can also be overriden per instance level

```ts
const { data } = callMainApi<NewResponseDataType>({
 method: "GET",

 retries: 5,
});
```

- Since the `data` and `error` properties destructured from callApi are in a discriminated union, simply checking for and handling the `error` property will narrow down the type of the data. The reverse case also holds (checking for data to narrow error type).

This simply means that if data is available error will be null, and if error is available data will be null. Both cannot exist at the same time.

```ts
// As is, both data and error could be null
const { data, error } = await callMainApi("some-url", {
 body: { message: "Good game" },
});

if (error) {
 console.error(error);
 return;
}

// Now, data is no longer null
console.log(data);
```

- CallApi provides a type guard that allows differentiate between an HTTPError and standard js errors. It also helps narrow down the discriminated union type of the error object.

```ts
import { isHTTPError } from "@zayne-labs/callapi";

const { data, error } = await callMainApi("some-url", {
 body: { message: "Good game" },
});

if (isHTTPError(error)) {
 console.error(error.name); // `HTTPError`
 console.error(error.message); // contains the parsed error message, if the response from the server contains such a property
 console.error(error.errorData); // contains the parsed error response

 return;
}

if (error) {
 console.error(error.name); // contains the name of the error
 console.error(error.message); // contains the error message
 console.error(error.errorData); // contains the original error object
}

```

- The types for the object passed to onResponse and onResponseError could be augmented with type helpers provided by `@zayne-labs/callapi`.

```ts
const callAnotherApi = callApi.create({
 onResponseError: ({ response, request, options }: ResponseErrorContext<{ message?: string }>) => {
  // Log error response
  console.log(
   request,
   response.status,
   // error data, coming back from api
   response.errorData,
   // Typescript will then understand the errorData might contains a message property
   response.errorData?.message
  );
 },
});
```

## Api Reference

### Fetch Options

- All Regular fetch options are supported as is, with only body extended to support more types.
- `body`: Optional body of the request, can be an object or any other supported body type.
- `query`: Query parameters to append to the URL.
- `auth`: Authorization header value.
- `bodySerializer`: Custom function to serialize the body object into a string.
- `responseParser`: Custom function to parse the response string into an object.
- `resultMode`: Mode of the result, can influence how results are handled or returned. (default: "all")
- `cancelRedundantRequests`: If true, cancels previous unfinished requests to the same URL. (default: true)
- `baseURL`: Base URL to be prepended to all request URLs.
- `timeout`: Request timeout in milliseconds.
- `defaultErrorMessage`: Default error message to use if none is provided from a response. (default: "Failed to fetch data from server!")
- `throwOnError`: If true or the function returns true, throws errors instead of returning them.

- `responseType`: Expected response type, affects how response is parsed. (default: "json")
- `retries`: Number of retry attempts for failed requests. (default: 0)
- `retryDelay`: Delay between retries in milliseconds. (default: 500)
- `retryCodes`: HTTP status codes that trigger a retry. (default: [409, 425, 429, 500, 502, 503, 504])
- `retryMethods`: HTTP methods that are allowed to retry. (default: ["GET", "POST"])
- `meta`: An optional field that can contain additional information about a request, which could be helpful in differentiating between different requests in a shared interceptor.
- `onRequest`: Interceptor called just before the request is made, allowing for modifications or additional operations.
- `onRequestError`: Interceptor called when an error occurs during the fetch request.
- `onResponse`: Interceptor called when a successful response is received from the API.
- `onResponseError`: Interceptor called when an error response is received from the API.

### Methods

- `callApi.create(options)`: Creates an instance of `callApi` with shared base configurations.
- `callApi.cancel(url: string)`: Cancels an ongoing request to the specified URL.

### Utility Functions

- `isHTTPError`: Type guard for if an error is an HTTPError

- `isHTTPErrorInstance`: Type guard for if an error is an instance of HTTPError. Useful for when `throwAllErrors` option is set to `true`

- `toQueryString`: Converts an object to a URL query string

## Acknowledgements

- Credits to `ofetch` by unjs for some of the ideas for the features in the library like the function-based interceptors, retries etc
- Credits to `zl-fetch` fetch wrapper as well for the inspiration behind a few features in this library as well
