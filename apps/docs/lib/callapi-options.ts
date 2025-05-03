import type {
	CallApiRequestOptions,
	CombinedCallApiExtraOptions as InitCombinedCallApiExtraOptions,
	RetryOptions,
} from "@zayne-labs/callapi";

export type { CallApiPlugin, CallApiRequestOptions, Hooks } from "@zayne-labs/callapi";

export type RetryAndTimeoutOptions<TErrorData> = Omit<RetryOptions<TErrorData>, "~retryAttemptCount">
	& Pick<CombinedCallApiExtraOptions, "timeout">;

export type CombinedCallApiExtraOptions = Omit<InitCombinedCallApiExtraOptions, "~retryAttemptCount">;

export type CombinedCallApiConfig = CallApiRequestOptions & CombinedCallApiExtraOptions;
