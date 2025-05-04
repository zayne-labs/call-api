import {
	type ErrorInfo,
	type PossibleHTTPError,
	type PossibleJavaScriptError,
	resolveErrorResult,
} from "./result";
import type { StreamProgressEvent } from "./stream";
import type {
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
} from "./types/common";
import type { DefaultDataType, DefaultMoreOptions } from "./types/default-types";
import type { AnyFunction, Awaitable, Prettify, UnmaskType } from "./utils/type-helpers";

export type WithMoreOptions<TMoreOptions = DefaultMoreOptions> = {
	options: CombinedCallApiExtraOptions & Partial<TMoreOptions>;
};

export type Hooks<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TMoreOptions = DefaultMoreOptions,
> = {
	/**
	 * Hook that will be called when any error occurs within the request/response lifecycle, regardless of whether the error is from the api or not.
	 * It is basically a combination of `onRequestError` and `onResponseError` hooks
	 */
	onError?: (context: ErrorContext<TErrorData> & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;

	/**
	 * Hook that will be called just before the request is made, allowing for modifications or additional operations.
	 */
	onRequest?: (context: Prettify<RequestContext & WithMoreOptions<TMoreOptions>>) => Awaitable<unknown>;

	/**
	 *  Hook that will be called when an error occurs during the fetch request.
	 */
	onRequestError?: (
		context: Prettify<RequestErrorContext & WithMoreOptions<TMoreOptions>>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when upload stream progress is tracked
	 */
	onRequestStream?: (
		context: Prettify<RequestStreamContext & WithMoreOptions<TMoreOptions>>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when any response is received from the api, whether successful or not
	 */
	onResponse?: (
		context: ResponseContext<TData, TErrorData> & WithMoreOptions<TMoreOptions>
	) => Awaitable<unknown>;

	/**
	 *  Hook that will be called when an error response is received from the api.
	 */
	onResponseError?: (
		context: Prettify<ResponseErrorContext<TErrorData> & WithMoreOptions<TMoreOptions>>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when download stream progress is tracked
	 */
	onResponseStream?: (
		context: Prettify<ResponseStreamContext & WithMoreOptions<TMoreOptions>>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when a request is retried.
	 */
	onRetry?: (response: RetryContext<TErrorData> & WithMoreOptions<TMoreOptions>) => Awaitable<unknown>;

	/**
	 * Hook that will be called when a successful response is received from the api.
	 */
	onSuccess?: (
		context: Prettify<SuccessContext<TData> & WithMoreOptions<TMoreOptions>>
	) => Awaitable<unknown>;
};

export type HooksOrHooksArray<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TMoreOptions = DefaultMoreOptions,
> = {
	[Key in keyof Hooks<TData, TErrorData, TMoreOptions>]:
		| Hooks<TData, TErrorData, TMoreOptions>[Key]
		// eslint-disable-next-line perfectionist/sort-union-types -- I need arrays to be last
		| Array<Hooks<TData, TErrorData, TMoreOptions>[Key]>;
};

export type SharedHookContext<TMoreOptions = DefaultMoreOptions> = {
	/**
	 * Config object passed to createFetchClient
	 */
	baseConfig: BaseCallApiExtraOptions & CallApiRequestOptions;
	/**
	 * Config object passed to the callApi instance
	 */
	config: CallApiExtraOptions & CallApiRequestOptions;
	/**
	 * Merged options consisting of extra options from createFetchClient, the callApi instance and default options.
	 *
	 */
	options: CombinedCallApiExtraOptions & Partial<TMoreOptions>;
	/**
	 * Merged request consisting of request options from createFetchClient, the callApi instance and default request options.
	 */
	request: CallApiRequestOptionsForHooks;
};

export type RequestContext = UnmaskType<SharedHookContext>;

export type ResponseContext<TData, TErrorData> = UnmaskType<
	| Prettify<
			SharedHookContext & {
				data: TData;
				error: null;
				response: Response;
			}
	  >
	// eslint-disable-next-line perfectionist/sort-union-types -- I need the first one to be first
	| Prettify<
			SharedHookContext & {
				data: null;
				error: PossibleHTTPError<TErrorData>;
				response: Response;
			}
	  >
>;

export type SuccessContext<TData> = UnmaskType<
	Prettify<
		SharedHookContext & {
			data: TData;
			response: Response;
		}
	>
>;

export type RequestErrorContext = UnmaskType<
	Prettify<
		SharedHookContext & {
			error: PossibleJavaScriptError;
			response: null;
		}
	>
>;

export type ResponseErrorContext<TErrorData> = UnmaskType<
	Prettify<
		SharedHookContext & {
			error: PossibleHTTPError<TErrorData>;
			response: Response;
		}
	>
>;

export type RetryContext<TErrorData> = UnmaskType<
	Prettify<ErrorContext<TErrorData> & { retryAttemptCount: number }>
>;

export type ErrorContext<TErrorData> = UnmaskType<
	| Prettify<
			SharedHookContext & {
				error: PossibleHTTPError<TErrorData>;
				response: Response;
			}
	  >
	| Prettify<
			SharedHookContext & {
				error: PossibleJavaScriptError;
				response: null;
			}
	  >
>;

export type RequestStreamContext = UnmaskType<
	Prettify<
		SharedHookContext & {
			event: StreamProgressEvent;
			requestInstance: Request;
		}
	>
>;

export type ResponseStreamContext = UnmaskType<
	Prettify<
		SharedHookContext & {
			event: StreamProgressEvent;
			response: Response;
		}
	>
>;

type HookRegistries = {
	[Key in keyof Hooks]: Set<Hooks[Key]>;
};

export const hookRegistries = {
	onError: new Set(),
	onRequest: new Set(),
	onRequestError: new Set(),
	onRequestStream: new Set(),
	onResponse: new Set(),
	onResponseError: new Set(),
	onResponseStream: new Set(),
	onRetry: new Set(),
	onSuccess: new Set(),
} satisfies HookRegistries;

export const composeTwoHooks = (
	hooks: Array<AnyFunction | undefined>,
	mergedHooksExecutionMode: CombinedCallApiExtraOptions["mergedHooksExecutionMode"]
) => {
	if (hooks.length === 0) return;

	const mergedHook = async (ctx: Record<string, unknown>) => {
		if (mergedHooksExecutionMode === "sequential") {
			for (const hook of hooks) {
				// eslint-disable-next-line no-await-in-loop -- This is necessary in this case
				await hook?.(ctx);
			}

			return;
		}

		if (mergedHooksExecutionMode === "parallel") {
			const hookArray = [...hooks];

			await Promise.all(hookArray.map((uniqueHook) => uniqueHook?.(ctx)));
		}
	};

	return mergedHook;
};

export const executeHooksInTryBlock = async (...hookResults: Array<Awaitable<unknown>>) => {
	await Promise.all(hookResults);
};

type Info = {
	errorInfo: ErrorInfo;
	shouldThrowOnError: boolean | undefined;
};

export const createExecuteHooksFn = (info: Info) => {
	const { errorInfo, shouldThrowOnError } = info;

	const executeHooksInCatchBlock = async (...hookResults: Array<Awaitable<unknown>>) => {
		try {
			await Promise.all(hookResults);

			return null;
		} catch (hookError) {
			const hookErrorResult = resolveErrorResult(hookError, errorInfo);

			if (shouldThrowOnError) {
				throw hookError;
			}

			return hookErrorResult;
		}
	};

	return executeHooksInCatchBlock;
};
