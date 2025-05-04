import type { Auth } from "../auth";
import type { fetchSpecificKeys } from "../constants/common";
import type { ErrorContext, Hooks, HooksOrHooksArray } from "../hooks";
import type { CallApiPlugin, InferPluginOptions, Plugins } from "../plugins";
import type { GetCallApiResult, ResponseTypeUnion, ResultModeUnion } from "../result";
import type { RetryOptions } from "../retry";
import type { InitURL, UrlOptions } from "../url";
import { type Awaitable, type Prettify, type UnmaskType, defineEnum } from "../utils/type-helpers";
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

export type ModifiedRequestInit = RequestInit & { duplex?: "half" };

export type CallApiRequestOptions<TSchemas extends CallApiSchemas = DefaultMoreOptions> = Prettify<
	BodyOption<TSchemas>
		& HeadersOption<TSchemas>
		& MethodOption<TSchemas>
		& Pick<ModifiedRequestInit, FetchSpecificKeysUnion>
>;

export type CallApiRequestOptionsForHooks<TSchemas extends CallApiSchemas = DefaultMoreOptions> = Omit<
	CallApiRequestOptions<TSchemas>,
	"headers"
> & {
	headers?: Record<string, string | undefined>;
};

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
	 * If true, forces the calculation of the total byte size from the request or response body, in case the content-length header is not present or is incorrect.
	 * @default false
	 */
	forceCalculateStreamSize?: boolean | { request?: boolean; response?: boolean };

	/**
	 * Resolved request URL
	 */
	readonly fullURL?: string;

	/**
	 * Defines the mode in which the composed hooks are executed".
	 * - If set to "parallel", main and plugin hooks will be executed in parallel.
	 * - If set to "sequential", the plugin hooks will be executed first, followed by the main hook.
	 * @default "parallel"
	 */
	mergedHooksExecutionMode?: "parallel" | "sequential";

	/**
	 * - Controls what order in which the composed hooks execute
	 * @default "mainHooksAfterPlugins"
	 */
	mergedHooksExecutionOrder?: "mainHooksAfterPlugins" | "mainHooksBeforePlugins";

	/**
	 * An array of CallApi plugins. It allows you to extend the behavior of the library.
	 */
	plugins?: Plugins<TPluginArray>;

	/**
	 * Custom function to parse the response string
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
} & HooksOrHooksArray<TData, TErrorData, Partial<InferPluginOptions<TPluginArray>>>
	& Partial<InferPluginOptions<TPluginArray>>
	& MetaOption<TSchemas>
	& RetryOptions<TErrorData>
	& ResultModeOption<TErrorData, TResultMode>
	& UrlOptions<TSchemas>;
/* eslint-enable perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs */

export type CallApiExtraOptions<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
> = ExtraOptions<TData, TErrorData, TResultMode, TThrowOnError, TResponseType, TPluginArray, TSchemas> & {
	plugins?:
		| Plugins<TPluginArray>
		| ((context: { basePlugins: Plugins<TPluginArray> }) => Plugins<TPluginArray>);

	schemas?: TSchemas | ((context: { baseSchemas: TSchemas | undefined }) => TSchemas);

	validators?:
		| CallApiValidators<TData, TErrorData>
		| ((context: {
				baseValidators: CallApiValidators<TData, TErrorData> | undefined;
		  }) => CallApiValidators<TData, TErrorData>);
};

export const optionsEnumToOmitFromBase = defineEnum(["dedupeKey"] satisfies Array<
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
> & {
	/**
	 * Specifies which configuration parts should skip automatic merging between base and main configs.
	 * Use this when you need manual control over how configs are combined.
	 *
	 * @values
	 * - "all" - Disables automatic merging for both request and options
	 * - "options" - Disables automatic merging of options only
	 * - "request" - Disables automatic merging of request only
	 *
	 * @example
	 * ```ts
	 * const client = createFetchClient((ctx) => ({
	 *   skipAutoMergeFor: "options",
	 *
	 *   // Now you can manually merge options in your config function
	 *   ...ctx.options,
	 * }));
	 * ```
	 */
	skipAutoMergeFor?: "all" | "options" | "request";
};

type CombinedExtraOptionsWithoutHooks = Omit<BaseCallApiExtraOptions & CallApiExtraOptions, keyof Hooks>;

// eslint-disable-next-line ts-eslint/consistent-type-definitions -- Allow this to be an interface
export interface CombinedCallApiExtraOptions extends CombinedExtraOptionsWithoutHooks, Hooks {}

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

export type CallApiConfig<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
> = CallApiRequestOptions<TSchemas> // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs
	& CallApiExtraOptions<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TPluginArray,
		TSchemas
	>;

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
	config?: CallApiConfig<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TPluginArray,
		TSchemas
	>,
];

export type CallApiResult<
	TData,
	TErrorData,
	TResultMode extends ResultModeUnion,
	TThrowOnError extends boolean,
	TResponseType extends ResponseTypeUnion,
> = Promise<GetCallApiResult<TData, TErrorData, TResultMode, TThrowOnError, TResponseType>>;
