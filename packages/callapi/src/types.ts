import type { CallApiPlugin } from "./plugins";
import type { handleResponseType } from "./utils/common";
import type { fetchSpecificKeys } from "./utils/constants";
import type {
	AnyNumber,
	AnyString,
	Awaitable,
	CommonContentTypes,
	CommonRequestHeaders,
	UnmaskType,
} from "./utils/type-helpers";

type FetchSpecificKeysUnion = Exclude<(typeof fetchSpecificKeys)[number], "body" | "headers" | "method">;

/* eslint-disable ts-eslint/consistent-type-definitions */

export interface CallApiRequestOptions extends Pick<RequestInit, FetchSpecificKeysUnion> {
	/**
	 * @description Optional body of the request, can be a object or any other supported body type.
	 */
	body?: Record<string, unknown> | RequestInit["body"];

	/**
	 * @description Headers to be used in the request.
	 */
	headers?:
		| Record<"Content-Type", CommonContentTypes>
		// eslint-disable-next-line perfectionist/sort-union-types
		| Record<CommonRequestHeaders | AnyString, string>
		| RequestInit["headers"];

	/**
	 * @description HTTP method for the request.
	 * @default "GET"
	 */
	method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT" | AnyString;
}

export interface CallApiRequestOptionsForHooks extends CallApiRequestOptions {
	/**
	 * @description Resolved request URL
	 */
	readonly fullURL?: string;

	// eslint-disable-next-line perfectionist/sort-union-types
	headers?: Record<CommonRequestHeaders | AnyString, string>;
}

// eslint-disable-next-line ts-eslint/no-empty-object-type
export interface Register {
	// == meta: R_Meta
}

export type R_Meta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export interface Interceptors<TData = unknown, TErrorData = unknown> {
	/**
	 * @description Interceptor to be called when any error occurs within the request/response lifecyle, regardless of whether the error is from the api or not.
	 * It is basically a combination of `onRequestError` and `onResponseError` interceptors
	 */
	onError?: (context: ErrorContext<TErrorData>) => Awaitable<void>;

	/**
	 * @description Interceptor to be called just before the request is made, allowing for modifications or additional operations.
	 */
	onRequest?: (context: RequestContext) => Awaitable<void>;

	/**
	 *  @description Interceptor to be called when an error occurs during the fetch request.
	 */
	onRequestError?: (context: RequestErrorContext) => Awaitable<void>;

	/**
	 * @description Interceptor to be called when any response is received from the api, whether successful or not
	 */
	onResponse?: (context: ResponseContext<TData, TErrorData>) => Awaitable<void>;

	/**
	 *  @description Interceptor to be called when an error response is received from the api.
	 */
	onResponseError?: (context: ResponseErrorContext<TErrorData>) => Awaitable<void>;

	/**
	 * @description Interceptor to be called when a successful response is received from the api.
	 */
	onSuccess?: (context: SuccessContext<TData>) => Awaitable<void>;
}

type FetchImpl = UnmaskType<(input: string | Request | URL, init?: RequestInit) => Promise<Response>>;

export interface CallApiExtraOptions<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> extends Interceptors<TData, TErrorData> {
	/**
	 * @description Authorization header value.
	 */
	auth?:
		| string
		| {
				bearer: string | null;
				token?: never;
		  }
		| {
				bearer?: never;
				token: string | null;
		  }
		| null;

	/**
	 * @description Base URL to be prepended to all request URLs
	 */
	baseURL?: string;

	/**
	 * @description Custom function to serialize the body object into a string.
	 */
	bodySerializer?: (bodyData: Record<string, unknown>) => string;

	/**
	 * @description Custom fetch implementation
	 */
	customFetchImpl?: FetchImpl;

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
	 * @description Defines the mode in which the merged interceptors are executed, can be set to "parallel" | "sequential".
	 * - If set to "parallel", both plugin and main interceptors will be executed in parallel.
	 * - If set to "sequential", the plugin interceptors will be executed first, followed by the main interceptor.
	 * @default "parallel"
	 */
	mergedInterceptorsExecutionMode?: "parallel" | "sequential";

	/**
	 * @description - Controls what order in which the mergedInterceptors execute
	 * @default "mainInterceptorLast"
	 */
	mergedInterceptorsExecutionOrder?: "mainInterceptorFirst" | "mainInterceptorLast";

	/**
	 * @description Whether or not to merge the plugin interceptors with main interceptor.
	 * @default true
	 */
	mergeInterceptors?: boolean;

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
	// eslint-disable-next-line perfectionist/sort-union-types
	params?: Record<string, boolean | number | string> | Array<boolean | number | string>;

	/**
	 * @description An array of CallApi plugins. Allows you to extend the behavior of the library.
	 */
	plugins?: Array<CallApiPlugin<TData, TErrorData>>;

	/**
	 * @description Query parameters to append to the URL.
	 */
	query?: Record<string, boolean | number | string>;

	/**
	 * @description Custom request key to be used to identify a request in the fetch deduplication strategy.
	 * @default the full request url + string formed from the request options
	 */
	requestKey?: string;

	/**
	 * @description Custom function to parse the response string into a object.
	 */
	responseParser?: (responseString: string) => Record<string, unknown>;

	/**
	 * @description Expected response type, affects how response is parsed
	 * @default "json"
	 */
	responseType?: keyof ReturnType<typeof handleResponseType>;

	/**
	 * @description Custom function to validate the response data.
	 */
	responseValidator?: (data: unknown) => TData;

	/**
	 * @description Mode of the result, can influence how results are handled or returned.
	 * Can be set to "all" | "onlySuccess" | "onlyError" | "onlyResponse".
	 * @default "all"
	 */
	resultMode?: TResultMode;

	/**
	 * @description Number of retry attempts for failed requests
	 * @default 0
	 */
	retries?: number;

	/**
	 * @description HTTP status codes that trigger a retry
	 * @default [409, 425, 429, 500, 502, 503, 504]
	 */
	retryCodes?: Array<409 | 425 | 429 | 500 | 502 | 503 | 504 | AnyNumber>;

	/**
	 * @description Delay between retries in milliseconds
	 * @default 500
	 */
	retryDelay?: number;

	/**
	 * HTTP methods that are allowed to retry
	 * @default ["GET", "POST"]
	 */
	retryMethods?: Array<"GET" | "POST" | AnyString>;

	/**
	 * @description Whether or not to clone the response, so response.json() and the like, can be read again else where.
	 * @default false
	 */
	shouldCloneResponse?: boolean;

	/**
	 * If true or the function returns true, throws errors instead of returning them
	 * The function is passed the error object and can be used to conditionally throw the error
	 * @default false
	 */
	throwOnError?:
		| boolean
		| ((ctx: {
				error: ErrorContext<TErrorData>["error"];
				options: CallApiExtraOptions;
				request: CallApiRequestOptions;
		  }) => boolean);

	/**
	 * @description Request timeout in milliseconds
	 */
	timeout?: number;

	/**
	 * @description URL to be used in the request.
	 */
	url?: string;
}

// prettier-ignore
// eslint-disable-next-line ts-eslint/no-empty-object-type
export interface BaseCallApiExtraOptions<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
> extends Omit<CallApiExtraOptions<TBaseData, TBaseErrorData, TBaseResultMode>, "requestKey"> { }

// prettier-ignore
export interface CallApiConfig<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> extends CallApiRequestOptions, CallApiExtraOptions<TData, TErrorData, TResultMode> { }

// prettier-ignore
export interface CallApiConfigWithRequiredURL<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> extends CallApiConfig<TData, TErrorData, TResultMode> {
	url: string;
}

// prettier-ignore
export interface BaseCallApiConfig<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> extends CallApiRequestOptions, BaseCallApiExtraOptions<TData, TErrorData, TResultMode> { }

export type RequestContext = UnmaskType<{
	options: CallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
}>;

export type ResponseContext<TData, TErrorData> = UnmaskType<
	| {
			data: TData;
			error: null;
			options: CallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
	// eslint-disable-next-line perfectionist/sort-union-types
	| {
			data: null;
			error: PossibleHTTPError<TErrorData>;
			options: CallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
>;

export type SuccessContext<TData> = UnmaskType<{
	data: TData;
	options: CallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
	response: Response;
}>;

export type RequestErrorContext = UnmaskType<{
	error: PossibleJavaScriptError;
	options: CallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
}>;

export type ResponseErrorContext<TErrorData> = UnmaskType<{
	error: PossibleHTTPError<TErrorData>;
	options: CallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
	response: Response;
}>;

export type ErrorContext<TErrorData> = UnmaskType<
	| {
			error: PossibleHTTPError<TErrorData>;
			options: CallApiExtraOptions;
			request: CallApiRequestOptionsForHooks;
			response: Response;
	  }
	| {
			error: PossibleJavaScriptError;
			options: CallApiExtraOptions;
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

export type ErrorObjectUnion<TErrorData = unknown> =
	| {
			errorData: DOMException | Error | SyntaxError | TypeError;
			message: string;
			name:
				| "AbortError"
				| "Error"
				| "SyntaxError"
				| "TimeoutError"
				| "TypeError"
				| (`${string}Error` & {});
	  }
	| {
			errorData: TErrorData;
			message: string;
			name: "HTTPError";
	  };

export type PossibleHTTPError<TErrorData> = Extract<ErrorObjectUnion<TErrorData>, { name: "HTTPError" }>;

export type PossibleJavaScriptError = Extract<ErrorObjectUnion, { errorData: Error }>;

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
	all: CallApiResultErrorVariant<TErrorData> | CallApiResultSuccessVariant<TData>;
	onlyError: CallApiResultErrorVariant<TErrorData>["error"];
	onlyResponse: Response;
	onlySuccess: CallApiResultSuccessVariant<TData>["data"];
};

export type ResultModeUnion = UnmaskType<
	{ [Key in keyof ResultModeMap]: Key }[keyof ResultModeMap] | undefined
>;

export type GetCallApiResult<TData, TErrorData, TResultMode> = undefined extends TResultMode
	? ResultModeMap<TData, TErrorData>["all"]
	: TResultMode extends NonNullable<ResultModeUnion>
		? ResultModeMap<TData, TErrorData>[TResultMode]
		: never;
