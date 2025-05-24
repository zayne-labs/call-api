/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import { requestOptionDefaults, retryDefaults } from "./constants/default-options";
import type { ErrorContext } from "./hooks";
import type { Method } from "./types";
import { isFunction, isHTTPError } from "./utils/guards";
import type { Awaitable } from "./utils/type-helpers";

type RetryCondition<TErrorData> = (context: ErrorContext<TErrorData>) => Awaitable<boolean>;

type InnerRetryKeys<TErrorData> = Exclude<keyof RetryOptions<TErrorData>, "~retryAttemptCount" | "retry">;

type InnerRetryOptions<TErrorData> = {
	[Key in InnerRetryKeys<TErrorData> as Key extends `retry${infer TRest}`
		? Uncapitalize<TRest> extends "attempts"
			? never
			: Uncapitalize<TRest>
		: Key]?: RetryOptions<TErrorData>[Key];
} & {
	attempts: NonNullable<RetryOptions<TErrorData>["retryAttempts"]>;
};

export interface RetryOptions<TErrorData> {
	/**
	 * Keeps track of the number of times the request has already been retried
	 *
	 * **NOTE**: This property is used internally to track retries. Please abstain from modifying it.
	 */
	readonly ["~retryAttemptCount"]?: number;

	/**
	 * All retry options in a single object instead of separate properties
	 */
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
	retryStatusCodes?: number[];

	/**
	 * Strategy to use when retrying
	 * @default "linear"
	 */
	retryStrategy?: "exponential" | "linear";
}

const getLinearDelay = <TErrorData>(currentAttemptCount: number, options: RetryOptions<TErrorData>) => {
	const retryDelay = options.retryDelay ?? options.retry?.delay;

	const resolveRetryDelay =
		(isFunction(retryDelay) ? retryDelay(currentAttemptCount) : retryDelay) ?? retryDefaults.delay;

	return resolveRetryDelay;
};

const getExponentialDelay = <TErrorData>(
	currentAttemptCount: number,
	options: RetryOptions<TErrorData>
) => {
	const retryDelay = options.retryDelay ?? options.retry?.delay ?? retryDefaults.delay;

	const resolvedRetryDelay = Number(
		isFunction(retryDelay) ? retryDelay(currentAttemptCount) : retryDelay
	);

	const maxDelay = Number(options.retryMaxDelay ?? options.retry?.maxDelay ?? retryDefaults.maxDelay);

	const exponentialDelay = resolvedRetryDelay * 2 ** currentAttemptCount;

	return Math.min(exponentialDelay, maxDelay);
};

export const createRetryStrategy = <TErrorData>(ctx: ErrorContext<TErrorData>) => {
	const { options } = ctx;

	const currentAttemptCount = options["~retryAttemptCount"] ?? 1;

	const retryStrategy = options.retryStrategy ?? options.retry?.strategy ?? retryDefaults.strategy;

	const getDelay = () => {
		switch (retryStrategy) {
			case "exponential": {
				return getExponentialDelay(currentAttemptCount, options);
			}
			case "linear": {
				return getLinearDelay(currentAttemptCount, options);
			}
			default: {
				throw new Error(`Invalid retry strategy: ${String(retryStrategy)}`);
			}
		}
	};

	const shouldAttemptRetry = async () => {
		const retryCondition = options.retryCondition ?? options.retry?.condition ?? retryDefaults.condition;

		const maximumRetryAttempts =
			options.retryAttempts ?? options.retry?.attempts ?? retryDefaults.attempts;

		const customRetryCondition = await retryCondition(ctx);

		const baseShouldRetry = maximumRetryAttempts >= currentAttemptCount && customRetryCondition;

		if (!baseShouldRetry) {
			return false;
		}

		// == If error is not an HTTP error, just return true since at this point we know it's a retryable error
		if (!isHTTPError(ctx.error)) {
			return true;
		}

		const selectedMethodArray = options.retryMethods ?? options.retry?.methods ?? retryDefaults.methods;

		const retryMethods = new Set(selectedMethodArray);

		const method = ctx.request.method ?? requestOptionDefaults.method;

		const includesMethod = Boolean(method) && retryMethods.has(method);

		const selectedStatusCodeArray = options.retryStatusCodes ?? options.retry?.statusCodes;

		const retryStatusCodes = selectedStatusCodeArray ? new Set(selectedStatusCodeArray) : null;

		const includesStatusCodes =
			Boolean(ctx.response?.status) && (retryStatusCodes?.has(ctx.response.status) ?? true);

		const shouldRetry = includesMethod && includesStatusCodes;

		return shouldRetry;
	};

	return {
		currentAttemptCount,
		getDelay,
		shouldAttemptRetry,
	};
};
