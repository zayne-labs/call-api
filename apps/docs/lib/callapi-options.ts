import type {
	CallApiRequestOptions,
	CombinedCallApiExtraOptions as InitCombinedCallApiExtraOptions,
	RetryOptions as InitRetryOptions,
} from "@zayne-labs/callapi";

export type { CallApiPlugin, CallApiRequestOptions, Hooks } from "@zayne-labs/callapi";

export type RetryOptions = Omit<InitRetryOptions<unknown>, "~retryCount">;

export type CombinedCallApiExtraOptions = Omit<InitCombinedCallApiExtraOptions, "~retryCount">;

export type CombinedCallApiConfig = CallApiRequestOptions & CombinedCallApiExtraOptions;
