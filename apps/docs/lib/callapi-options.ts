import type {
	CallApiRequestOptions,
	CombinedCallApiExtraOptions as InitCombinedCallApiExtraOptions,
	RetryOptions as InitRetryOptions,
} from "@zayne-labs/callapi";

export type { CallApiPlugin, CallApiRequestOptions, Hooks } from "@zayne-labs/callapi";

export type RetryOptions = Omit<InitRetryOptions<unknown>, "~retryAttemptCount">;

export type CombinedCallApiExtraOptions = Omit<InitCombinedCallApiExtraOptions, "~retryAttemptCount">;

export type CombinedCallApiConfig = CallApiRequestOptions & CombinedCallApiExtraOptions;
