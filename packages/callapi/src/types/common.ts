/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { Auth } from "../auth";
import type { CallApiPlugin, InferPluginOptions, Plugins } from "../plugins";
import type { GetResponseType, ResponseTypeUnion } from "../response";
import type { RetryOptions } from "../retry";
import type { InitURL, UrlOptions } from "../url";
import type { fetchSpecificKeys } from "../utils/constants";
import { type Awaitable, type UnmaskType, defineEnum } from "../utils/type-helpers";
import type { CallApiSchemas, CallApiValidators, InferSchemaResult } from "../validation";
import type {
	BodyOption,
	HeadersOption,
	MetaOption,
	MethodOption,
	ResultModeOption,
} from "./conditional-types";
import type {
	DefaultDataType,
	DefaultMoreOptions,
	DefaultPluginArray,
	DefaultThrowOnError,
} from "./default-types";

type FetchSpecificKeysUnion = Exclude<(typeof fetchSpecificKeys)[number], "body" | "headers" | "method">;

export type CallApiRequestOptions<TSchemas extends CallApiSchemas = DefaultMoreOptions> =
	BodyOption<TSchemas>
		& HeadersOption<TSchemas>
		& MethodOption<TSchemas>
		& Pick<RequestInit, FetchSpecificKeysUnion>;

export type CallApiRequestOptionsForHooks<TSchemas extends CallApiSchemas = DefaultMoreOptions> = Omit<
	CallApiRequestOptions<TSchemas>,
	"headers"
> & {
	headers?: Record<string, string | undefined>;
};

export type WithMoreOptions<TMoreOptions = DefaultMoreOptions> = {
	options: CombinedCallApiExtraOptions & Partial<TMoreOptions>;
};

export interface Interceptors<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TMoreOptions = DefaultMoreOptions,
> {
	/**
	 * Interceptor that will be called when any error occurs within the request/response lifecycle, regardless of whether the error is from the api or not.
	 * It is basically a combination of `onRequestError` and `onResponseError` interceptors
	 */
	onError?: (context: ErrorContext<TErrorData> & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;

	/**
	 * Interceptor that will be called just before the request is made, allowing for modifications or additional operations.
	 */
	onRequest?: (context: RequestContext & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;

	/**
	 *  Interceptor that will be called when an error occurs during the fetch request.
	 */
	onRequestError?: (context: RequestErrorContext & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;

	/**
	 * Interceptor that will be called when any response is received from the api, whether successful or not
	 */
	onResponse?: (
		context: ResponseContext<TData, TErrorData> & WithMoreOptions<TMoreOptions>
	) => Awaitable<unknown>;

	/**
	 *  Interceptor that will be called when an error response is received from the api.
	 */
	onResponseError?: (
		context: ResponseErrorContext<TErrorData> & WithMoreOptions<TMoreOptions>
	) => Awaitable<unknown>;

	/**
	 * Interceptor that will be called when a request is retried.
	 */
	onRetry?: (response: ErrorContext<TErrorData> & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;
	/**
	 * Interceptor that will be called when a successful response is received from the api.
	 */
	onSuccess?: (context: SuccessContext<TData> & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;
}

/* eslint-disable perfectionist/sort-union-types -- I need arrays to be last */
export type InterceptorsOrInterceptorArray<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TMoreOptions = DefaultMoreOptions,
> = {
	[Key in keyof Interceptors<TData, TErrorData, TMoreOptions>]:
		| Interceptors<TData, TErrorData, TMoreOptions>[Key]
		| Array<Interceptors<TData, TErrorData, TMoreOptions>[Key]>;
};
/* eslint-enable perfectionist/sort-union-types -- I need arrays to be last */

type FetchImpl = UnmaskType<(input: string | Request | URL, init?: RequestInit) => Promise<Response>>;

export type ExtraOptions<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
> = {
	/**
	 * Authorization header value.
	 */
	auth?: string | Auth | null;
	/**
	 * Base URL to be prepended to all request URLs
	 */
	baseURL?: string;

	/**
	 * Custom function to serialize the body object into a string.
	 */
	bodySerializer?: (bodyData: Record<string, unknown>) => string;

	/**
	 * Whether or not to clone the response, so response.json() and the like, can be read again else where.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
	 * @default false
	 */
	cloneResponse?: boolean;

	/**
	 * Custom fetch implementation
	 */
	customFetchImpl?: FetchImpl;

	/**
	 * Custom request key to be used to identify a request in the fetch deduplication strategy.
	 * @default the full request url + string formed from the request options
	 */
	dedupeKey?: string;

	/**
	 * Defines the deduplication strategy for the request, can be set to "none" | "defer" | "cancel".
	 * - If set to "cancel", the previous pending request with the same request key will be cancelled and lets the new request through.
	 * - If set to "defer", all new request with the same request key will be share the same response, until the previous one is completed.
	 * - If set to "none", deduplication is disabled.
	 * @default "cancel"
	 */
	dedupeStrategy?: "cancel" | "defer" | "none";

	/**
	 * Default error message to use if none is provided from a response.
	 * @default "Failed to fetch data from server!"
	 */
	defaultErrorMessage?: string;

	/**
	 * Resolved request URL
	 */
	readonly fullURL?: string;

	/**
	 * Defines the mode in which the merged hooks are executed, can be set to "parallel" | "sequential".
	 * - If set to "parallel", main and plugin hooks will be executed in parallel.
	 * - If set to "sequential", the plugin hooks will be executed first, followed by the main hook.
	 * @default "parallel"
	 */
	mergedHooksExecutionMode?: "parallel" | "sequential";

	/**
	 * - Controls what order in which the merged hooks execute
	 * @default "mainHooksLast"
	 */
	mergedHooksExecutionOrder?: "mainHooksAfterPlugins" | "mainHooksBeforePlugins";

	/**
	 * An array of CallApi plugins. It allows you to extend the behavior of the library.
	 */
	plugins?: Plugins<TPluginArray>;

	/**
	 * Custom function to parse the response string into a object.
	 */
	responseParser?: (responseString: string) => Awaitable<Record<string, unknown>>;

	/**
	 * Expected response type, affects how response is parsed
	 * @default "json"
	 */
	responseType?: TResponseType;

	/**
	 * Mode of the result, can influence how results are handled or returned.
	 * Can be set to "all" | "onlySuccess" | "onlyError" | "onlyResponse".
	 * @default "all"
	 */
	resultMode?: TResultMode;

	/**
	 * Type-safe schemas for the response validation.
	 */
	schemas?: TSchemas;

	/**
	 * If true or the function returns true, throws errors instead of returning them
	 * The function is passed the error object and can be used to conditionally throw the error
	 * @default false
	 */
	throwOnError?: TThrowOnError | ((context: ErrorContext<TErrorData>) => TThrowOnError);

	/**
	 * Request timeout in milliseconds
	 */
	timeout?: number;

	/**
	 * Custom validation functions for response validation
	 */
	validators?: CallApiValidators<TData, TErrorData>;
	/* eslint-disable perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs */
} & InterceptorsOrInterceptorArray<TData, TErrorData>
	& Partial<InferPluginOptions<TPluginArray>>
	& MetaOption<TSchemas>
	& RetryOptions<TErrorData>
	& ResultModeOption<TErrorData, TResultMode>
	& UrlOptions<TSchemas>;
/* eslint-enable perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs */

export const optionsEnumToExtendFromBase = defineEnum(["plugins", "validators", "schemas"] satisfies Array<
	keyof ExtraOptions
>);

export type CallApiExtraOptions<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
> = ExtraOptions<TData, TErrorData, TResultMode, TThrowOnError, TResponseType, TPluginArray, TSchemas> & {
	/**
	 * Options that should extend the base options.
	 */
	extend?: Pick<
		ExtraOptions<TData, TErrorData, TResultMode, TThrowOnError, TResponseType, TPluginArray, TSchemas>,
		(typeof optionsEnumToExtendFromBase)[number]
	>;
};

export const optionsEnumToOmitFromBase = defineEnum(["extend", "dedupeKey"] satisfies Array<
	keyof CallApiExtraOptions
>);

export type BaseCallApiExtraOptions<
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
> = Omit<
	Partial<
		CallApiExtraOptions<
			TBaseData,
			TBaseErrorData,
			TBaseResultMode,
			TBaseThrowOnError,
			TBaseResponseType,
			TBasePluginArray,
			TBaseSchemas
		>
	>,
	(typeof optionsEnumToOmitFromBase)[number]
>;

export type CombinedCallApiExtraOptions = BaseCallApiExtraOptions & CallApiExtraOptions;

export type BaseCallApiConfig<
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
> =
	| (CallApiRequestOptions<TBaseSchemas> // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow
			& BaseCallApiExtraOptions<
				TBaseData,
				TBaseErrorData,
				TBaseResultMode,
				TBaseThrowOnError,
				TBaseResponseType,
				TBasePluginArray,
				TBaseSchemas
			>)
	| ((context: {
			initURL: string;
			options: CallApiExtraOptions;
			request: CallApiRequestOptions;
	  }) => CallApiRequestOptions<TBaseSchemas> // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow
			& BaseCallApiExtraOptions<
				TBaseData,
				TBaseErrorData,
				TBaseResultMode,
				TBaseThrowOnError,
				TBaseResponseType,
				TBasePluginArray,
				TBaseSchemas
			>);

export type CallApiParameters<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
> = [
	initURL: InferSchemaResult<TSchemas["initURL"], InitURL>,
	config?: CallApiRequestOptions<TSchemas> // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs
		& CallApiExtraOptions<
			TData,
			TErrorData,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TPluginArray,
			TSchemas
		>,
];

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

export type PossibleJavascriptErrorNames =
	| "AbortError"
	| "Error"
	| "SyntaxError"
	| "TimeoutError"
	| "TypeError"
	| (`${string}Error` & DefaultMoreOptions);

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

export type RequestErrorContext = UnmaskType<{
	error: PossibleJavaScriptError;
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
	response: null;
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

export type ResultModeMap<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TComputedData = GetResponseType<TData, TResponseType>,
	TComputedErrorData = GetResponseType<TErrorData, TResponseType>,
> = UnmaskType<{
	/* eslint-disable perfectionist/sort-union-types -- I need the first one to be first */
	all: CallApiResultSuccessVariant<TComputedData> | CallApiResultErrorVariant<TComputedErrorData>;

	allWithException: CallApiResultSuccessVariant<TComputedData>;

	allWithoutResponse:
		| CallApiResultSuccessVariant<TComputedData>["data" | "error"]
		| CallApiResultErrorVariant<TComputedErrorData>["data" | "error"];

	onlyError:
		| CallApiResultSuccessVariant<TComputedData>["error"]
		| CallApiResultErrorVariant<TComputedErrorData>["error"];

	onlyResponse:
		| CallApiResultErrorVariant<TComputedErrorData>["response"]
		| CallApiResultSuccessVariant<TComputedData>["response"];

	onlyResponseWithException: CallApiResultSuccessVariant<TComputedErrorData>["response"];

	onlySuccess:
		| CallApiResultErrorVariant<TComputedErrorData>["data"]
		| CallApiResultSuccessVariant<TComputedData>["data"];

	onlySuccessWithException: CallApiResultSuccessVariant<TComputedData>["data"];
	/* eslint-enable perfectionist/sort-union-types -- I need the first one to be first */
}>;

export type ResultModeUnion = keyof ResultModeMap | undefined;

export type GetCallApiResult<
	TData,
	TErrorData,
	TResultMode extends ResultModeUnion,
	TThrowOnError extends boolean,
	TResponseType extends ResponseTypeUnion,
> = TErrorData extends false | undefined
	? ResultModeMap<TData, TErrorData, TResponseType>["onlySuccessWithException"]
	: ResultModeUnion | undefined extends TResultMode
		? TThrowOnError extends true
			? ResultModeMap<TData, TErrorData, TResponseType>["allWithException"]
			: ResultModeMap<TData, TErrorData, TResponseType>["all"]
		: TResultMode extends NonNullable<ResultModeUnion>
			? TResultMode extends "onlySuccess"
				? ResultModeMap<TData, TErrorData, TResponseType>["onlySuccessWithException"]
				: TResultMode extends "onlyResponse"
					? ResultModeMap<TData, TErrorData, TResponseType>["onlyResponseWithException"]
					: ResultModeMap<TData, TErrorData, TResponseType>[TResultMode]
			: never;
