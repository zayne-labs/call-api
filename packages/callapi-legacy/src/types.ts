/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */

import type { Auth } from "./auth";
import type { CallApiPlugin, PluginInitContext } from "./plugins";
import type { RetryOptions } from "./retry";
import type { getResponseType } from "./utils/common";
import type { fetchSpecificKeys } from "./utils/constants";
import {
	type AnyString,
	type Awaitable,
	type CommonContentTypes,
	type CommonRequestHeaders,
	type UnmaskType,
	defineEnum,
} from "./utils/type-helpers";

type FetchSpecificKeysUnion = Exclude<(typeof fetchSpecificKeys)[number], "body" | "headers" | "method">;

export interface CallApiRequestOptions extends Pick<RequestInit, FetchSpecificKeysUnion> {
	/**
	 * @description Optional body of the request, can be a object or any other supported body type.
	 */
	body?: Record<string, unknown> | RequestInit["body"];

	/**
	 * @description Resolved request URL
	 */
	readonly fullURL?: string;

	/**
	 * @description Headers to be used in the request.
	 */
	headers?:
		| Record<"Content-Type", CommonContentTypes>
		// eslint-disable-next-line perfectionist/sort-union-types -- I need the first one to be first
		| Record<CommonRequestHeaders | AnyString, string>
		| RequestInit["headers"];

	/**
	 * @description HTTP method for the request.
	 * @default "GET"
	 */
	method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT" | AnyString;
}

export interface CallApiRequestOptionsForHooks extends CallApiRequestOptions {
	// eslint-disable-next-line perfectionist/sort-union-types -- I need the first one to be first
	headers?: Record<CommonRequestHeaders | AnyString, string>;
}

// eslint-disable-next-line ts-eslint/no-empty-object-type -- This needs to be empty to allow users to register their own meta
export interface Register {
	// == meta: R_Meta
}

export type R_Meta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export interface Interceptors<TData = unknown, TErrorData = unknown> {
	/**
	 * @description Interceptor that will be called when any error occurs within the request/response lifecyle, regardless of whether the error is from the api or not.
	 * It is basically a combination of `onRequestError` and `onResponseError` interceptors
	 */
	onError?: (context: ErrorContext<TErrorData>) => Awaitable<unknown>;

	/**
	 * @description Interceptor that will be called just before the request is made, allowing for modifications or additional operations.
	 */
	onRequest?: (context: RequestContext) => Awaitable<unknown>;

	/**
	 *  @description Interceptor that will be called when an error occurs during the fetch request.
	 */
	onRequestError?: (context: RequestErrorContext) => Awaitable<unknown>;

	/**
	 * @description Interceptor that will be called when any response is received from the api, whether successful or not
	 */
	onResponse?: (context: ResponseContext<TData, TErrorData>) => Awaitable<unknown>;

	/**
	 *  @description Interceptor that will be called when an error response is received from the api.
	 */
	onResponseError?: (context: ResponseErrorContext<TErrorData>) => Awaitable<unknown>;

	/**
	 * @description Interceptor that will be called when a request is retried.
	 */
	onRetry?: (response: ErrorContext<TErrorData>) => Awaitable<unknown>;

	/**
	 * @description Interceptor that will be called when a successful response is received from the api.
	 */
	onSuccess?: (context: SuccessContext<TData>) => Awaitable<unknown>;
}

export type InterceptorsArray<TData = unknown, TErrorData = unknown> = {
	[Key in keyof Interceptors<TData, TErrorData>]: Array<Interceptors<TData, TErrorData>[Key]>;
};

export type InterceptorsOrInterceptorsArray<TData, TErrorData> =
	| Interceptors<TData, TErrorData>
	| InterceptorsArray<TData, TErrorData>;

type FetchImpl = UnmaskType<(input: string | Request | URL, init?: RequestInit) => Promise<Response>>;

type CallApiPluginArray<TData, TErrorData> = Array<CallApiPlugin<TData, TErrorData>>;

// prettier-ignore
export type ExtraOptions<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> = InterceptorsOrInterceptorsArray<TData, TErrorData> & RetryOptions<TErrorData> & {
		/**
		 * @description Authorization header value.
		 */
		auth?: string | Auth | null;

		/**
		 * @description Base URL to be prepended to all request URLs
		 */
		baseURL?: string;

		/**
		 * @description Custom function to serialize the body object into a string.
		 */
		bodySerializer?: (bodyData: Record<string, unknown>) => string;

		/**
		 * @description Whether or not to clone the response, so response.json() and the like, can be read again else where.
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
		 * @default false
		 */
		cloneResponse?: boolean;

		/**
		 * @description Custom fetch implementation
		 */
		customFetchImpl?: FetchImpl;

		/**
		 * @description Custom request key to be used to identify a request in the fetch deduplication strategy.
		 * @default the full request url + string formed from the request options
		 */
		dedupeKey?: string;

		/**
		 * @description Defines the deduplication strategy for the request, can be set to "none" | "defer" | "cancel".
		 * - If set to "none", deduplication is disabled.
		 *
		 * - If set to "cancel"(default), the previous pending request with the same request key will be cancelled and lets the new request through.
		 *
		 * - If set to "defer", all new request with the same request key will be share the same response, until the previous one is completed.
		 * @default "cancel"
		 */
		dedupeStrategy?: "cancel" | "defer" | "none";

		/**
		 * @description Default error message to use if none is provided from a response.
		 * @default "Failed to fetch data from server!"
		 */
		defaultErrorMessage?: string;

		/**
		 * @description URL to be used in the request.
		 */
		readonly initURL?: string;

		/**
		 * @description Defines the mode in which the merged hooks are executed, can be set to "parallel" | "sequential".
		 * - If set to "parallel", main and plugin hooks will be executed in parallel.
		 * - If set to "sequential", the plugin hooks will be executed first, followed by the main hook.
		 * @default "parallel"
		 */
		mergedHooksExecutionMode?: "parallel" | "sequential";

		/**
		 * @description - Controls what order in which the merged hooks execute
		 * @default "mainHooksLast"
		 */
		mergedHooksExecutionOrder?: "mainHooksFirst" | "mainHooksLast";

		/**
		 * @description - An optional field you can fill with additional information,
		 * to associate with the request, typically used for logging or tracing.
		 *
		 * - A good use case for this, would be to use the info to handle specific cases in any of the shared interceptors.
		 *
		 * @example
		 * ```ts
		 * const callMainApi = callApi.create({
		 * 	baseURL: "https://main-api.com",
		 * 	onResponseError: ({ response, options }) => {
		 * 		if (options.meta?.userId) {
		 * 			console.error(`User ${options.meta.userId} made an error`);
		 * 		}
		 * 	},
		 * });
		 *
		 * const response = await callMainApi({
		 * 	url: "https://example.com/api/data",
		 * 	meta: { userId: "123" },
		 * });
		 * ```
		 */
		meta?: R_Meta;

		/**
		 * @description Params to be appended to the URL (i.e: /:id)
		 */
		// eslint-disable-next-line perfectionist/sort-union-types -- I need the Record to be first
		params?: Record<string, boolean | number | string> | Array<boolean | number | string>;

		/**
		 * @description An array of CallApi plugins. It allows you to extend the behavior of the library.
		 */
		plugins?:
			| CallApiPluginArray<TData, TErrorData>
			| ((context: PluginInitContext<TData, TErrorData>) => CallApiPluginArray<TData, TErrorData>);

		/**
		 * @description Query parameters to append to the URL.
		 */
		query?: Record<string, boolean | number | string>;

		/**
		 * @description Custom function to validate the response error data, stemming from the api.
		 * This only runs if the api actually sends back error status codes, else it will be ignored, in which case you should only use the `responseValidator` option.
		 */
		responseErrorValidator?: (data: unknown) => TErrorData;

		/**
		 * @description Custom function to parse the response string into a object.
		 */
		responseParser?: (responseString: string) => Awaitable<Record<string, unknown>>;

		/**
		 * @description Expected response type, affects how response is parsed
		 * @default "json"
		 */
		responseType?: keyof ReturnType<typeof getResponseType>;

		/**
		 * @description Custom function to validate the response data.
		 */
		responseValidator?: (data: unknown) => TData;

		/**
		 * @description Mode of the result, can influence how results are handled or returned.
		 * Can be set to "all" | "onlySuccess" | "onlyError" | "onlyResponse".
		 * @default "all"
		 */
		resultMode?: TErrorData extends false ? "onlySuccessWithException" : TResultMode | undefined;

		/**
		 * If true or the function returns true, throws errors instead of returning them
		 * The function is passed the error object and can be used to conditionally throw the error
		 * @default false
		 */
		throwOnError?: boolean | ((context: ErrorContext<TErrorData>) => boolean);

		/**
		 * @description Request timeout in milliseconds
		 */
		timeout?: number;
	};

export const optionsEnumToOmitFromBase = defineEnum(["extend", "dedupeKey"]);

// prettier-ignore
// eslint-disable-next-line ts-eslint/no-empty-object-type -- It's fine
export interface BaseCallApiExtraOptions<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends Omit<CallApiExtraOptions<TBaseData, TBaseErrorData, TBaseResultMode>, typeof optionsEnumToOmitFromBase[number]> { }

export const optionsEnumToExtendFromBase = defineEnum(["plugins"] satisfies Array<keyof ExtraOptions>);

// prettier-ignore
export interface CallApiExtraOptions<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends Omit<ExtraOptions<TData, TErrorData, TResultMode>, never> {
	/**
	 * @description Options that should extend the base options.
	 */
	extend?: Pick<ExtraOptions<TData, TErrorData, TResultMode>, typeof optionsEnumToExtendFromBase[number]>;
}

// prettier-ignore
export interface CombinedCallApiExtraOptions<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends BaseCallApiExtraOptions<TData, TErrorData, TResultMode>, CallApiExtraOptions<TData, TErrorData, TResultMode> { }

// prettier-ignore
export interface BaseCallApiConfig<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends CallApiRequestOptions, BaseCallApiExtraOptions<TBaseData, TBaseErrorData, TBaseResultMode> { }

// prettier-ignore
export interface CallApiConfig<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends CallApiRequestOptions, CallApiExtraOptions<TData, TErrorData, TResultMode> { }

export type CallApiParameters<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> = [initURL: string, config?: CallApiConfig<TData, TErrorData, TResultMode>];

export type RequestContext = UnmaskType<{
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
}>;

export type ResponseContext<TData, TErrorData> = UnmaskType<
	| {
			data: TData;
			error: null;
			options: CombinedCallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
	// eslint-disable-next-line perfectionist/sort-union-types -- I need the first one to be first
	| {
			data: null;
			error: PossibleHTTPError<TErrorData>;
			options: CombinedCallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
>;

export type SuccessContext<TData> = UnmaskType<{
	data: TData;
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
	response: Response;
}>;

export type RequestErrorContext = UnmaskType<{
	error: PossibleJavaScriptError;
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
}>;

export type ResponseErrorContext<TErrorData> = UnmaskType<{
	error: PossibleHTTPError<TErrorData>;
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
	response: Response;
}>;

export type ErrorContext<TErrorData> = UnmaskType<
	| {
			error: PossibleHTTPError<TErrorData>;
			options: CombinedCallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
	| {
			error: PossibleJavaScriptError;
			options: CombinedCallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: null;
	  }
>;

export type PossibleJavascriptErrorNames =
	| "AbortError"
	| "Error"
	| "SyntaxError"
	| "TimeoutError"
	| "TypeError"
	| (`${string}Error` & {});

export type PossibleJavaScriptError = UnmaskType<{
	errorData: DOMException | Error | SyntaxError | TypeError;
	message: string;
	name: PossibleJavascriptErrorNames;
}>;

export type PossibleHTTPError<TErrorData> = UnmaskType<{
	errorData: TErrorData;
	message: string;
	name: "HTTPError";
}>;

export type ErrorObjectUnion<TErrorData = unknown> =
	| PossibleHTTPError<TErrorData>
	| PossibleJavaScriptError;

export type CallApiResultSuccessVariant<TData> = {
	data: TData;
	error: null;
	response: Response;
};

export type CallApiResultErrorVariant<TErrorData> =
	| {
			data: null;
			error: PossibleHTTPError<TErrorData>;
			response: Response;
	  }
	| {
			data: null;
			error: PossibleJavaScriptError;
			response: null;
	  };

export type ResultModeMap<TData = unknown, TErrorData = unknown> = {
	// eslint-disable-next-line perfectionist/sort-union-types -- I need the first one to be first
	all: CallApiResultSuccessVariant<TData> | CallApiResultErrorVariant<TErrorData>;
	onlyError: CallApiResultErrorVariant<TErrorData>["error"] | CallApiResultSuccessVariant<TData>["error"];
	onlyResponse:
		| CallApiResultErrorVariant<TErrorData>["response"]
		| CallApiResultSuccessVariant<TData>["response"];
	onlySuccess: CallApiResultErrorVariant<TErrorData>["data"] | CallApiResultSuccessVariant<TData>["data"];
	onlySuccessWithException: CallApiResultSuccessVariant<TData>["data"];
};

export type CallApiResultModeUnion =
	| { [Key in keyof ResultModeMap]: Key }[keyof ResultModeMap]
	| undefined;

export type GetCallApiResult<TData, TErrorData, TResultMode> = TErrorData extends false
	? ResultModeMap<TData, TErrorData>["onlySuccessWithException"]
	: undefined extends TResultMode
		? ResultModeMap<TData, TErrorData>["all"]
		: TResultMode extends NonNullable<CallApiResultModeUnion>
			? ResultModeMap<TData, TErrorData>[TResultMode]
			: never;
