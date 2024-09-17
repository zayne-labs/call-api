/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { AnyNumber, AnyString, BaseMime, Prettify, ResponseHeader } from "./utils/type-helpers";
import type { HTTPError, fetchSpecificKeys, handleResponseType } from "./utils/utils";

// prettier-ignore
export interface FetchConfig<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = "all",
> extends Omit<RequestInit, "body" | "headers" | "method">, ExtraOptions<TData, TErrorData, TResultMode> {}

export type BaseConfig<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends ResultModeUnion = "all",
> = FetchConfig<TBaseData, TBaseErrorData, TBaseResultMode>;

export interface $RequestOptions extends Pick<FetchConfig, (typeof fetchSpecificKeys)[number]> {}
export interface $BaseRequestOptions extends Omit<$RequestOptions, "body"> {}

export interface ExtraOptions<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> {
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

	/** Optional body of the request, can be a object or any other supported body type. */
	body?: Record<string, unknown> | RequestInit["body"];

	/**
	 * @description Custom function to serialize the body object into a string.
	 */
	bodySerializer?: (bodyData: Record<string, unknown>) => string;

	/**
	 * @description If true, cancels previous unfinished requests to the same URL.
	 * @default true
	 */
	cancelRedundantRequests?: boolean;

	/**
	 * @description Whether to clone the response, so response.json and the like can used in the interceptors.
	 * @default false
	 */
	cloneResponse?: boolean;

	/**
	 * @description Default error message to use if none is provided from a response.
	 * @default "Failed to fetch data from server!"
	 */
	defaultErrorMessage?: string;

	/**
	 * @description Headers to be used in the request.
	 */
	headers?: Record<"Content-Type", BaseMime> | Record<ResponseHeader, string> | RequestInit["headers"];

	/**
	 * @description an optional field you can fill with additional information,
	 * to associate with the request, typically used for logging or tracing.
	 *
	 * A good use case for this, would be to use the info to handle specific cases in any of the shared interceptors.
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
	meta?: Record<string, unknown>;

	/**
	 * @description HTTP method for the request.
	 * @default "GET"
	 */
	method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT" | AnyString;

	// /**
	//  * @description Defines the deduplication strategy for the request, can be set to "none" | "defer" | "cancel".
	//  *
	//  * - If set to "none", deduplication is disabled.
	//  *
	//  * - If set to "defer", no new requests to the same URL will be allowed through, until the previous one is completed.
	//  *
	//  * - If set to "cancel"(default), the previous pending request to the same URL will be cancelled and lets the new request through.
	//  * @default "cancel"
	//  */
	// dedupeStrategy?: "none" | "defer" | "cancel";

	/**
	 * @description Interceptor to be called when an error occurs during the fetch request OR when an error response is received from the api
	 * It is basically a combination of `onRequestError` and `onResponseError` interceptors
	 */
	onError?: (errorContext: ErrorContext<TErrorData>) => Promise<void> | void;

	/** @description Interceptor to be called just before the request is made, allowing for modifications or additional operations. */
	onRequest?: (requestContext: {
		options: ExtraOptions;
		request: $RequestOptions;
	}) => Promise<void> | void;

	/** @description Interceptor to be called when an error occurs during the fetch request. */
	onRequestError?: (requestErrorContext: {
		error: Error;
		options: ExtraOptions;
		request: $RequestOptions;
	}) => Promise<void> | void;

	/** @description Interceptor to be called when a successful response is received from the api. */
	onResponse?: (responseContext: ResponseContext<TData>) => Promise<void> | void;

	/** @description Interceptor to be called when an error response is received from the api. */
	onResponseError?: (responseErrorContext: ResponseErrorContext<TErrorData>) => Promise<void> | void;

	/**
	 * @description Params to be appended to the URL (i.e: /:id)
	 */
	// eslint-disable-next-line perfectionist/sort-union-types
	params?: Record<string, boolean | number | string> | Array<boolean | number | string>;

	/**
	 * @description Query parameters to append to the URL.
	 */
	query?: Record<string, boolean | number | string>;

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
	 * If true or the function returns true, throws errors instead of returning them
	 * The function is passed the error object and can be used to conditionally throw the error
	 * @default false
	 */
	throwOnError?: boolean | ((error?: Error | HTTPError<TErrorData>) => boolean);

	/**
	 * @description Request timeout in milliseconds
	 */
	timeout?: number;
}

export type ResponseContext<TData> = Prettify<{
	data: TData;
	options: ExtraOptions;
	request: $RequestOptions;
	response: Response;
}>;

export type ResponseErrorContext<TErrorData> = Prettify<{
	errorData: TErrorData;
	options: ExtraOptions;
	request: $RequestOptions;
	response: Response;
}>;

export type ErrorContext<TErrorData> =
	| {
			error: Extract<ErrorObjectUnion, { name: PossibleErrorNames }>;
			options: ExtraOptions;
			request: $RequestOptions;
			response: null;
	  }
	| {
			error: Extract<ErrorObjectUnion<TErrorData>, { name: "HTTPError" }>;
			options: ExtraOptions;
			request: $RequestOptions;
			response: Response;
	  };

type ApiSuccessVariant<TData> = {
	data: TData;
	error: null;
	response: Response;
};

type PossibleErrorNames = {
	_: "AbortError" | "Error" | "SyntaxError" | "TimeoutError" | "TypeError" | "UnknownError";
}["_"];

type ErrorObjectUnion<TErrorData = unknown> =
	| {
			errorData: Error;
			message: string;
			name: PossibleErrorNames;
	  }
	| {
			errorData: TErrorData;
			message: string;
			name: "HTTPError";
	  };

export type ApiErrorVariant<TErrorData> =
	| {
			data: null;
			error: Extract<ErrorObjectUnion, { name: PossibleErrorNames }>;
			response: null;
	  }
	| {
			data: null;
			error: Extract<ErrorObjectUnion<TErrorData>, { name: "HTTPError" }>;
			response: Response;
	  };

type ResultModeMap<TData = unknown, TErrorData = unknown> = {
	all: ApiErrorVariant<TErrorData> | ApiSuccessVariant<TData>;
	onlyError: ApiErrorVariant<TErrorData>["error"];
	onlyResponse: Response;
	onlySuccess: ApiSuccessVariant<TData>["data"];
};

// == Using this double Immediately Indexed Mapped type to get a union of the keys of the object while still showing the full type signature on hover
export type ResultModeUnion = {
	_: { [Key in keyof ResultModeMap]: Key }[keyof ResultModeMap] | undefined;
}["_"];

export type GetCallApiResult<TData, TErrorData, TResultMode> =
	TResultMode extends NonNullable<ResultModeUnion>
		? ResultModeMap<TData, TErrorData>[TResultMode]
		: ResultModeMap<TData, TErrorData>["all"];

export type PossibleErrorObject =
	| {
			message?: string;
			name?: PossibleErrorNames;
	  }
	| undefined;
