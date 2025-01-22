/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */

import type { ErrorContext } from "./types";
import type { AnyNumber, AnyString } from "./utils/type-helpers";

type RetryCondition<TErrorData> = (context: ErrorContext<TErrorData>) => boolean | Promise<boolean>;

export interface RetryOptions<TErrorData> {
	/**
	 * @description Number of allowed retry attempts on HTTP errors
	 * @default 0
	 */
	retryAttempts?: number;

	/**
	 * @description HTTP status codes that trigger a retry
	 * @default [409, 425, 429, 500, 502, 503, 504]
	 */
	retryCodes?: Array<409 | 425 | 429 | 500 | 502 | 503 | 504 | AnyNumber>;

	/**
	 * @description Callback whose return value determines if a request should be retried or not
	 */
	retryCondition?: RetryCondition<TErrorData>;

	/**
	 * @description Keeps track of the number of times the request has already been retried
	 */
	retryCount?: number;

	/**
	 * @description Delay between retries in milliseconds
	 * @default 1000
	 */
	retryDelay?: number;

	/**
	 * @description Maximum delay in milliseconds. Only applies to exponential strategy
	 * @default 10000
	 */
	retryMaxDelay?: number;

	/**
	 * HTTP methods that are allowed to retry
	 * @default ["GET", "POST"]
	 */
	retryMethods?: Array<"GET" | "POST" | AnyString>;

	/**
	 * @description Strategy to use when retrying
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

export const createRetryStrategy = <TErrorData>(
	options: RetryOptions<TErrorData>,
	ctx: ErrorContext<TErrorData>
) => {
	const currentRetryCount = options.retryCount ?? 0;

	return {
		getDelay: () => {
			if (options.retryStrategy === "exponential") {
				return getExponentialDelay(currentRetryCount, options);
			}

			return getLinearDelay(options);
		},

		shouldAttemptRetry: async () => {
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
				!!ctx.response?.status && options.retryCodes?.includes(ctx.response.status);

			return includesCodes && includesMethod && baseRetryCondition;
		},
	};
};
