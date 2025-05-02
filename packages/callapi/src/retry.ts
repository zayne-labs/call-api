/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import { resolveErrorResult } from "./error";
import { type ErrorContext, executeHooks } from "./hooks";
import type { BaseCallApiExtraOptions, Method } from "./types";
import { isFunction } from "./utils/guards";
import { type AnyNumber, type Awaitable, type UnmaskType, defineEnum } from "./utils/type-helpers";

type RetryCondition<TErrorData> = (context: ErrorContext<TErrorData>) => Awaitable<boolean>;

type InnerRetryKeys<TErrorData> = Exclude<keyof RetryOptions<TErrorData>, "~retryCount" | "retry">;

type InnerRetryOptions<TErrorData> = UnmaskType<
	{
		[Key in InnerRetryKeys<TErrorData> as Key extends `retry${infer TRest}`
			? Uncapitalize<TRest> extends "attempts"
				? never
				: Uncapitalize<TRest>
			: Key]?: RetryOptions<TErrorData>[Key];
	} & {
		attempts: NonNullable<RetryOptions<TErrorData>["retryAttempts"]>;
	}
>;

export interface RetryOptions<TErrorData> {
	/**
	 * Keeps track of the number of times the request has already been retried
	 * @deprecated This property is used internally to track retries. Please abstain from modifying it.
	 */
	readonly ["~retryAttemptCount"]?: number;

	retry?: InnerRetryOptions<TErrorData>;

	/**
	 * Number of allowed retry attempts on HTTP errors
	 * @default 0
	 */
	retryAttempts?: number;

	/**
	 * Callback whose return value determines if a request should be retried or not
	 */
	retryCondition?: RetryCondition<TErrorData>;

	/**
	 * Delay between retries in milliseconds
	 * @default 1000
	 */
	retryDelay?: number | ((currentAttemptCount: number) => number);

	/**
	 * Maximum delay in milliseconds. Only applies to exponential strategy
	 * @default 10000
	 */
	retryMaxDelay?: number;

	/**
	 * HTTP methods that are allowed to retry
	 * @default ["GET", "POST"]
	 */
	retryMethods?: Method[];

	/**
	 * HTTP status codes that trigger a retry
	 */
	retryStatusCodes?: DefaultRetryStatusCodes;

	/**
	 * Strategy to use when retrying
	 * @default "linear"
	 */
	retryStrategy?: "exponential" | "linear";
}

const getLinearDelay = <TErrorData>(currentAttemptCount: number, options: RetryOptions<TErrorData>) => {
	const retryDelay = options.retryDelay ?? options.retry?.delay;

	const resolveRetryDelay =
		(isFunction(retryDelay) ? retryDelay(currentAttemptCount) : retryDelay) ?? defaultRetryDelay;

	return resolveRetryDelay;
};

const getExponentialDelay = <TErrorData>(
	currentAttemptCount: number,
	options: RetryOptions<TErrorData>
) => {
	const retryDelay = options.retryDelay ?? options.retry?.delay ?? defaultRetryDelay;

	const resolveRetryDelay = Number(isFunction(retryDelay) ? retryDelay(currentAttemptCount) : retryDelay);

	const maxDelay = Number(options.retryMaxDelay ?? options.retry?.maxDelay ?? defaultRetryMaxDelay);

	const exponentialDelay = resolveRetryDelay * 2 ** currentAttemptCount;

	return Math.min(exponentialDelay, maxDelay);
};

export const createRetryStrategy = <TErrorData>(ctx: ErrorContext<TErrorData>) => {
	const { options } = ctx;

	const currentAttemptCount = options["~retryAttemptCount"] ?? 0;

	const retryStrategy = options.retryStrategy ?? options.retry?.strategy ?? defaultRetryStrategy;

	const getDelay = () => {
		switch (retryStrategy) {
			case "exponential": {
				return getExponentialDelay(currentAttemptCount, options);
			}
			case "linear": {
				return getLinearDelay(currentAttemptCount, options);
			}
			default: {
				throw new Error(`Invalid retry strategy: ${retryStrategy as string}`);
			}
		}
	};

	const shouldAttemptRetry = async () => {
		const retryCondition = options.retryCondition ?? options.retry?.condition ?? defaultRetryCondition;

		const maxRetryAttempts = options.retryAttempts ?? options.retry?.attempts ?? defaultRetryAttempts;

		const customRetryCondition = await retryCondition(ctx);

		const baseShouldRetry = maxRetryAttempts > currentAttemptCount && customRetryCondition;

		if (ctx.error.name !== "HTTPError") {
			return baseShouldRetry;
		}

		const retryMethods = new Set(options.retryMethods ?? options.retry?.methods ?? defaultRetryMethods);

		const selectedStatusCodeArray = options.retryStatusCodes ?? options.retry?.statusCodes;

		const retryStatusCodes = selectedStatusCodeArray ? new Set(selectedStatusCodeArray) : null;

		const includesMethod = Boolean(ctx.request.method) && retryMethods.has(ctx.request.method);

		const includesStatusCodes =
			Boolean(ctx.response?.status) && (retryStatusCodes?.has(ctx.response.status) ?? true);

		const shouldRetry = baseShouldRetry && includesMethod && includesStatusCodes;

		return shouldRetry;
	};

	const executeRetryHook = async (shouldThrowOnError: boolean | undefined) => {
		try {
			return await executeHooks(options.onRetry?.(ctx));
		} catch (error) {
			const { apiDetails } = resolveErrorResult({
				cloneResponse: options.cloneResponse,
				defaultErrorMessage: options.defaultErrorMessage as string,
				error,
				resultMode: options.resultMode,
			});

			if (shouldThrowOnError) {
				throw error;
			}

			return apiDetails;
		}
	};

	return {
		executeRetryHook,
		getDelay,
		shouldAttemptRetry,
	};
};

const defaultRetryDelay = 1000;

const defaultRetryCondition = () => true;

const defaultRetryMaxDelay = 10000;

const defaultRetryAttempts = 0;

const defaultRetryStrategy = "linear";

export const defaultRetryMethods = ["GET", "POST"] satisfies BaseCallApiExtraOptions["retryMethods"];

export const defaultRetryStatusCodesLookup = defineEnum({
	408: "Request Timeout",
	409: "Conflict",
	425: "Too Early",
	429: "Too Many Requests",
	500: "Internal Server Error",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
});

// eslint-disable-next-line perfectionist/sort-union-types -- Allow
type DefaultRetryStatusCodes = UnmaskType<Array<keyof typeof defaultRetryStatusCodesLookup | AnyNumber>>;

export const defaultRetryStatusCodes = [] satisfies DefaultRetryStatusCodes;

// // prettier-ignore
// export const defaultRetryStatusCodes = Object.keys(retryStatusCodesLookup).map(
// 	Number
// ) as DefaultRetryStatusCodes;
