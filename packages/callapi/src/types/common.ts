import type { Auth } from "../auth";
import type { fetchSpecificKeys } from "../constants/common";
import type { ErrorContext, Hooks, HooksOrHooksArray } from "../hooks";
import type { CallApiPlugin, InferPluginOptions, Plugins } from "../plugins";
import type { GetCallApiResult, ResponseTypeUnion, ResultModeUnion } from "../result";
import type { RetryOptions } from "../retry";
import type { UrlOptions } from "../url";
import type { BaseCallApiSchemas, CallApiSchemas, CallApiValidators } from "../validation";
import type {
	Body,
	GlobalMeta,
	Headers,
	InferExtraOptions,
	InferInitURL,
	InferRequestOptions,
	Method,
	ResultModeOption,
	ThrowOnErrorOption,
} from "./conditional-types";
import type { DefaultDataType, DefaultPluginArray, DefaultThrowOnError } from "./default-types";
import { type Awaitable, type Prettify, type UnmaskType, defineEnum } from "./type-helpers";

type FetchSpecificKeysUnion = Exclude<(typeof fetchSpecificKeys)[number], "body" | "headers" | "method">;

export type ModifiedRequestInit = RequestInit & { duplex?: "half" };

export type CallApiRequestOptions = Prettify<
	{
		/**
		 * Body of the request, can be a object or any other supported body type.
		 */
		body?: Body;
		/**
		 * Headers to be used in the request.
		 */
		headers?: Headers;
		/**
		 * HTTP method for the request.
		 * @default "GET"
		 */
		method?: Method;
		// eslint-disable-next-line perfectionist/sort-intersection-types -- Allow
	} & Pick<ModifiedRequestInit, FetchSpecificKeysUnion>
>;

export type CallApiRequestOptionsForHooks = Omit<CallApiRequestOptions, "headers"> & {
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
> = {
	/**
	 * Authorization header value.
	 */
	auth?: string | Auth | null;

	/**
	 * Custom function to serialize the body object into a string.
	 */
	bodySerializer?: (bodyData: Record<string, unknown>) => string;

	/**
	 * Whether or not to clone the response, so response.json() and the like can be read again else where.
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
	 * - An optional field you can fill with additional information,
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
	meta?: GlobalMeta;

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
	& RetryOptions<TErrorData>
	& ResultModeOption<TErrorData, TResultMode>
	& ThrowOnErrorOption<TErrorData>
	& UrlOptions;
/* eslint-enable perfectionist/sort-intersection-types -- Allow these to be last for the sake of docs */

export const optionsEnumToOmitFromBase = defineEnum(["dedupeKey"] satisfies Array<keyof ExtraOptions>);

export type BaseCallApiExtraOptions<
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchema extends BaseCallApiSchemas = BaseCallApiSchemas,
> = Omit<
	Partial<
		ExtraOptions<
			TBaseData,
			TBaseErrorData,
			TBaseResultMode,
			TBaseThrowOnError,
			TBaseResponseType,
			TBasePluginArray
		>
	>,
	(typeof optionsEnumToOmitFromBase)[number]
> & {
	baseURL?: string;

	/**
	 * Base schemas for the client.
	 */
	schemas?: TBaseSchema;

	/**
	 * Specifies which configuration parts should skip automatic merging between base and main configs.
	 * Use this when you need manual control over how configs are combined.
	 *
	 * @enum
	 * - `"all"` - Disables automatic merging for both request and options
	 * - `"options"` - Disables automatic merging of options only
	 * - `"request"` - Disables automatic merging of request only
	 *
	 * **Example**
	 *
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

export type CallApiExtraOptions<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends BaseCallApiSchemas = BaseCallApiSchemas,
	TSchemas extends CallApiSchemas = CallApiSchemas,
> = ExtraOptions<TData, TErrorData, TResultMode, TThrowOnError, TResponseType, TPluginArray> & {
	/**
	 * Plugins for the callapi instance
	 */
	plugins?:
		| Plugins<TPluginArray>
		| ((context: { basePlugins: Plugins<TPluginArray> }) => Plugins<TPluginArray>);

	/**
	 * Schemas for the callapi instance
	 */
	schemas?: TSchemas | ((context: { baseSchemas: TBaseSchemas }) => TSchemas);

	/**
	 * Validators for the callapi instance
	 */
	validators?:
		| CallApiValidators<TData, TErrorData>
		| ((context: {
				baseValidators: CallApiValidators<TData, TErrorData> | undefined;
		  }) => CallApiValidators<TData, TErrorData>);
};

// eslint-disable-next-line ts-eslint/consistent-type-definitions -- Allow this to be an interface
export interface CombinedCallApiExtraOptions extends Omit<CallApiExtraOptions, keyof Hooks>, Hooks {}

export type BaseCallApiConfig<
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends BaseCallApiSchemas = BaseCallApiSchemas,
> =
	| (CallApiRequestOptions // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow
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
	  }) => CallApiRequestOptions // eslint-disable-next-line perfectionist/sort-intersection-types -- Allow
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
	TBaseSchemas extends BaseCallApiSchemas = BaseCallApiSchemas,
	TSchemas extends CallApiSchemas = CallApiSchemas,
	TInitURL extends InferInitURL<BaseCallApiSchemas> = InferInitURL<BaseCallApiSchemas>,
	TRouteKey extends string = string,
> = InferExtraOptions<TSchemas, TRouteKey>
	& InferRequestOptions<TSchemas, TInitURL>
	& Omit<
		CallApiExtraOptions<
			TData,
			TErrorData,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TPluginArray,
			TBaseSchemas,
			TSchemas
		>,
		keyof InferExtraOptions<CallApiSchemas, string>
	>
	& Omit<CallApiRequestOptions, keyof InferRequestOptions<CallApiSchemas, string>>;

export type CallApiParameters<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends BaseCallApiSchemas = BaseCallApiSchemas,
	TSchemas extends CallApiSchemas = CallApiSchemas,
	TInitURL extends InferInitURL<BaseCallApiSchemas> = InferInitURL<BaseCallApiSchemas>,
	TRouteKey extends string = string,
> = [
	initURL: TInitURL,
	config?: CallApiConfig<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TPluginArray,
		TBaseSchemas,
		TSchemas,
		TInitURL,
		TRouteKey
	>,
];

export type CallApiResult<
	TData,
	TErrorData,
	TResultMode extends ResultModeUnion,
	TThrowOnError extends boolean,
	TResponseType extends ResponseTypeUnion,
> = Promise<GetCallApiResult<TData, TErrorData, TResultMode, TThrowOnError, TResponseType>>;
