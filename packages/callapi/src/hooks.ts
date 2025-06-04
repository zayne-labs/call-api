/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces */
import {
	type ErrorInfo,
	type PossibleHTTPError,
	type PossibleJavaScriptOrValidationError,
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
import type { DefaultDataType } from "./types/default-types";
import type { AnyFunction, Awaitable, UnmaskType } from "./types/type-helpers";
import type { ValidationError } from "./validation";

export interface PluginExtraOptions<TPluginOptions = unknown> {
	options: Partial<TPluginOptions>;
}

/* eslint-disable perfectionist/sort-intersection-types -- Plugin options should come last */
export interface Hooks<TData = DefaultDataType, TErrorData = DefaultDataType, TPluginOptions = unknown> {
	/**
	 * Hook that will be called when any error occurs within the request/response lifecycle, regardless of whether the error is from the api or not.
	 * It is basically a combination of `onRequestError` and `onResponseError` hooks
	 */
	onError?: (
		context: ErrorContext<TErrorData> & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called just before the request is being made.
	 */
	onRequest?: (context: RequestContext & PluginExtraOptions<TPluginOptions>) => Awaitable<unknown>;

	/**
	 *  Hook that will be called when an error occurs during the fetch request.
	 */
	onRequestError?: (
		context: RequestErrorContext & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when upload stream progress is tracked
	 */
	onRequestStream?: (
		context: RequestStreamContext & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when any response is received from the api, whether successful or not
	 */
	onResponse?: (
		context: ResponseContext<TData, TErrorData> & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 *  Hook that will be called when an error response is received from the api.
	 */
	onResponseError?: (
		context: ResponseErrorContext<TErrorData> & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when download stream progress is tracked
	 */
	onResponseStream?: (
		context: ResponseStreamContext & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when a request is retried.
	 */
	onRetry?: (
		response: RetryContext<TErrorData> & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;

	/**
	 * Hook that will be called when a successful response is received from the api.
	 */
	onSuccess?: (context: SuccessContext<TData> & PluginExtraOptions<TPluginOptions>) => Awaitable<unknown>;

	/**
	 * Hook that will be called when a validation error occurs.
	 */
	onValidationError?: (
		context: ValidationErrorContext & PluginExtraOptions<TPluginOptions>
	) => Awaitable<unknown>;
}
/* eslint-enable perfectionist/sort-intersection-types -- Plugin options should come last */

export type HooksOrHooksArray<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TMoreOptions = unknown,
> = {
	[Key in keyof Hooks<TData, TErrorData, TMoreOptions>]:
		| Hooks<TData, TErrorData, TMoreOptions>[Key]
		// eslint-disable-next-line perfectionist/sort-union-types -- I need arrays to be last
		| Array<Hooks<TData, TErrorData, TMoreOptions>[Key]>;
};

export interface SharedHookContext<TMoreOptions = unknown> {
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
}

export type RequestContext = UnmaskType<SharedHookContext>;

export type ResponseContext<TData, TErrorData> = UnmaskType<
	SharedHookContext
		& (
			| {
					data: null;
					error: PossibleHTTPError<TErrorData>;
					response: Response;
			  }
			| {
					data: null;
					error: PossibleJavaScriptOrValidationError;
					response: Response | null;
			  }
			| {
					data: TData;
					error: null;
					response: Response;
			  }
		)
>;

export type ValidationErrorContext = UnmaskType<
	SharedHookContext & {
		error: ValidationError;
		response: Response | null;
	}
>;

export type SuccessContext<TData> = UnmaskType<
	SharedHookContext & {
		data: TData;
		response: Response;
	}
>;

export type RequestErrorContext = UnmaskType<
	SharedHookContext & {
		error: PossibleJavaScriptOrValidationError;
		response: null;
	}
>;

export type ResponseErrorContext<TErrorData> = UnmaskType<
	SharedHookContext & {
		error: PossibleHTTPError<TErrorData>;
		response: Response;
	}
>;

export type RetryContext<TErrorData> = UnmaskType<
	ErrorContext<TErrorData> & { retryAttemptCount: number }
>;

export type ErrorContext<TErrorData> = UnmaskType<
	SharedHookContext
		& (
			| {
					error: PossibleHTTPError<TErrorData>;
					response: Response;
			  }
			| {
					error: PossibleJavaScriptOrValidationError;
					response: Response | null;
			  }
		)
>;

export type RequestStreamContext = UnmaskType<
	SharedHookContext & {
		event: StreamProgressEvent;
		requestInstance: Request;
	}
>;

export type ResponseStreamContext = UnmaskType<
	SharedHookContext & {
		event: StreamProgressEvent;
		response: Response;
	}
>;

type HookRegistries = Required<{
	[Key in keyof Hooks]: Set<Hooks[Key]>;
}>;

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
	onValidationError: new Set(),
} satisfies HookRegistries;

export const composeTwoHooks = (
	hooks: Array<AnyFunction | undefined>,
	mergedHooksExecutionMode: CombinedCallApiExtraOptions["mergedHooksExecutionMode"]
) => {
	if (hooks.length === 0) return;

	const mergedHook = async (ctx: unknown) => {
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

export const executeHooksInTryBlock = async (...hookResultsOrPromise: Array<Awaitable<unknown>>) => {
	await Promise.all(hookResultsOrPromise);
};

export type ExecuteHookInfo = {
	errorInfo: ErrorInfo;
	shouldThrowOnError: boolean | undefined;
};

export const executeHooksInCatchBlock = async (
	hookResultsOrPromise: Array<Awaitable<unknown>>,
	hookInfo: ExecuteHookInfo
) => {
	const { errorInfo, shouldThrowOnError } = hookInfo;

	try {
		await Promise.all(hookResultsOrPromise);

		return null;
	} catch (hookError) {
		const hookErrorResult = resolveErrorResult(hookError, errorInfo);

		if (shouldThrowOnError) {
			throw hookError;
		}

		return hookErrorResult;
	}
};
