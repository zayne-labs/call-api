/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import { resolveErrorResult } from "./error";
import type { Method } from "./types";
import type { ErrorContext } from "./types/common";
import { executeHooks } from "./utils/common";
import type { AnyNumber, Awaitable } from "./utils/type-helpers";

type RetryCondition<TErrorData> = (context: ErrorContext<TErrorData>) => Awaitable<boolean>;

export interface RetryOptions<TErrorData> {
	/**
	 * Keeps track of the number of times the request has already been retried
	 * @deprecated This property is used internally to track retries. Please abstain from modifying it.
	 */
	readonly ["~retryCount"]?: number;

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
	retryDelay?: number;

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
	 * @default [409, 425, 429, 500, 502, 503, 504]
	 */
	retryStatusCodes?: Array<409 | 425 | 429 | 500 | 502 | 503 | 504 | AnyNumber>;

	/**
	 * Strategy to use when retrying
	 * @default "linear"
	 */
	retryStrategy?: "exponential" | "linear";
}

const getLinearDelay = <TErrorData>(options: RetryOptions<TErrorData>) => options.retryDelay ?? 1000;

const getExponentialDelay = <TErrorData>(
	currentAttemptCount: number,
	options: RetryOptions<TErrorData>
) => {
	const maxDelay = options.retryMaxDelay ?? 10000;

	const exponentialDelay = (options.retryDelay ?? 1000) * 2 ** currentAttemptCount;

	return Math.min(exponentialDelay, maxDelay);
};

export const createRetryStrategy = <TErrorData>(ctx: ErrorContext<TErrorData>) => {
	const { options } = ctx;

	const currentRetryCount = options["~retryCount"] ?? 0;

	const getDelay = () => {
		if (options.retryStrategy === "exponential") {
			return getExponentialDelay(currentRetryCount, options);
		}

		return getLinearDelay(options);
	};

	const shouldAttemptRetry = async () => {
		const customRetryCondition = (await options.retryCondition?.(ctx)) ?? true;

		const maxRetryAttempts = options.retryAttempts ?? 0;

		const baseRetryCondition = maxRetryAttempts > currentRetryCount && customRetryCondition;

		if (ctx.error.name !== "HTTPError") {
			return baseRetryCondition;
		}

		const includesMethod =
			// eslint-disable-next-line no-implicit-coercion -- Boolean doesn't narrow
			!!ctx.request.method && options.retryMethods?.includes(ctx.request.method);

		const includesCodes =
			// eslint-disable-next-line no-implicit-coercion -- Boolean doesn't narrow
			!!ctx.response?.status && options.retryStatusCodes?.includes(ctx.response.status);

		return includesCodes && includesMethod && baseRetryCondition;
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
