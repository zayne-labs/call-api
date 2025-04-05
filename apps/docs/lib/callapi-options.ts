import type {
	CallApiExtraOptions as InitCallApiExtraOptions,
	RetryOptions as InitRetryOptions,
} from "@zayne-labs/callapi";

export type {
	CallApiPlugin,
	CallApiRequestOptions,
	InterceptorsOrInterceptorArray,
} from "@zayne-labs/callapi";

export type RetryOptions = Omit<InitRetryOptions<unknown>, "~retryCount">;

export type CallApiExtraOptions = Omit<InitCallApiExtraOptions, "~retryCount">;
