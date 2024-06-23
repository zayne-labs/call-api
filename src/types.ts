/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { AnyNumber, AnyString } from "./type-helpers";
import type { HTTPError, fetchSpecificKeys, handleResponseType } from "./utils";

export type $RequestOptions = Pick<FetchConfig, (typeof fetchSpecificKeys)[number]>;
export type $BaseRequestOptions = Omit<$RequestOptions, "body">;

export type ExtraOptions<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
> = {
	/** Optional body of the request, can be a object or any other supported body type. */
	body?: Record<string, unknown> | RequestInit["body"];

	/**
	 * @description HTTP method for the request.
	 * @default "GET"
	 */
	method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | AnyString;

	/**
	 * @description Query parameters to append to the URL.
	 */
	query?: Record<string, string | number | boolean>;

	/**
	 * @description Authorization header value.
	 */
	auth?: string;

	/**
	 * @description Custom function to validate the response data.
	 */
	responseValidator?: (data: TBaseData) => TBaseData;

	/**
	 * @description Custom function to serialize the body object into a string.
	 */
	bodySerializer?: (bodyData: Record<string, unknown>) => string;

	/**
	 * @description Custom function to parse the response string into a object.
	 */
	responseParser?: (responseString: string) => Record<string, unknown>;

	/**
	 * @description Mode of the result, can influence how results are handled or returned.
	 * Can be set to "all" | "onlySuccess" | "onlyError" | "onlyResponse".
	 * @default "all"
	 */
	resultMode?: TBaseResultMode;

	/**
	 * @description If true, cancels previous unfinished requests to the same URL.
	 * @default true
	 */
	cancelRedundantRequests?: boolean;

	/**
	 * @description Base URL to be prepended to all request URLs
	 */
	baseURL?: string;

	/**
	 * @description Request timeout in milliseconds
	 */
	timeout?: number;

	/**
	 * @description Default error message to use if none is provided from a response.
	 * @default "Failed to fetch data from server!"
	 */
	defaultErrorMessage?: string;

	/**
	 * If true or the function returns true, throws errors instead of returning them
	 * The function is passed the error object and can be used to conditionally throw the error
	 * @default false
	 */
	throwOnError?: boolean | ((error?: Error | HTTPError<TBaseErrorData>) => boolean);

	/**
	 * @description Expected response type, affects how response is parsed
	 * @default "json"
	 */
	responseType?: keyof ReturnType<typeof handleResponseType>;

	/**
	 * @description Number of retry attempts for failed requests
	 * @default 0
	 */
	retries?: number;

	/**
	 * @description Delay between retries in milliseconds
	 * @default 500
	 */
	retryDelay?: number;

	/**
	 * @description HTTP status codes that trigger a retry
	 * @default [409, 425, 429, 500, 502, 503, 504]
	 */
	retryCodes?: Array<409 | 425 | 429 | 500 | 502 | 503 | 504 | AnyNumber>;

	/**
	 * HTTP methods that are allowed to retry
	 * @default ["GET", "POST"]
	 */
	retryMethods?: Array<"GET" | "POST" | AnyString>;

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

	/** @description Interceptor to be called just before the request is made, allowing for modifications or additional operations. */
	onRequest?: (requestContext: {
		request: $RequestOptions;
		options: ExtraOptions;
	}) => void | Promise<void>;

	/** @description Interceptor to be called when an error occurs during the fetch request. */
	onRequestError?: (requestErrorContext: {
		error: Error;
		request: $RequestOptions;
		options: ExtraOptions;
	}) => void | Promise<void>;

	/** @description Interceptor to be called when a successful response is received from the api. */
	onResponse?: (responseContext: ResponseContext<TBaseData>) => void | Promise<void>;

	/** @description Interceptor to be called when an error response is received from the api. */
	onResponseError?: (responseErrorContext: ResponseErrorContext<TBaseErrorData>) => void | Promise<void>;
};

export type ResponseContext<TData> = {
	_: {
		response: Response & { data: TData };
		request: $RequestOptions;
		options: ExtraOptions;
	};
}["_"];

export type ResponseErrorContext<TErrorData> = {
	_: {
		response: Response & { errorData: TErrorData };
		request: $RequestOptions;
		options: ExtraOptions;
	};
}["_"];

// prettier-ignore
export interface FetchConfig<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = undefined,
> extends Omit<RequestInit, "method" | "body">, ExtraOptions<TData, TErrorData, TResultMode> {}

export interface BaseConfig<
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends ResultModeUnion = undefined,
> extends FetchConfig<TBaseData, TBaseErrorData, TBaseResultMode> {}

type ApiSuccessVariant<TData> = {
	data: TData;
	error: null;
	response: Response;
};

type PossibleErrors =
	| "AbortError"
	| "TimeoutError"
	| "SyntaxError"
	| "TypeError"
	| "Error"
	| "UnknownError";

export type ApiErrorVariant<TErrorData> =
	| {
			data: null;
			error: {
				errorName: "HTTPError";
				errorData: TErrorData;
				message: string;
			};
			response: Response;
	  }
	| {
			data: null;
			error: {
				errorName: PossibleErrors;
				message: string;
			};
			response: null;
	  };

type ResultModeMap<TData = unknown, TErrorData = unknown> = {
	all: ApiSuccessVariant<TData> | ApiErrorVariant<TErrorData>;
	onlySuccess: ApiSuccessVariant<TData>["data"];
	onlyError: ApiErrorVariant<TErrorData>["error"];
	onlyResponse: Response;
};

// == Using this double Immediately Indexed Mapped type to get a union of the keys of the object while still showing the full type signature on hover
export type ResultModeUnion = {
	_: { [Key in keyof ResultModeMap]: Key }[keyof ResultModeMap] | undefined;
}["_"];

export type GetCallApiResult<TData, TErrorData, TResultMode> =
	TResultMode extends NonNullable<ResultModeUnion>
		? ResultModeMap<TData, TErrorData>[TResultMode]
		: ResultModeMap<TData, TErrorData>["all"];

export type AbortSignalWithAny = typeof AbortSignal & {
	any: (signalArray: AbortSignal[]) => AbortSignal;
};

export type PossibleErrorObject =
	| {
			name?: PossibleErrors;
			message?: string;
	  }
	| undefined;
