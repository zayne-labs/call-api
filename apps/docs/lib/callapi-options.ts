import type { CallApiExtraOptions as InitCallApiExtraOptions } from "@zayne-labs/callapi";

export type {
	CallApiPlugin,
	CallApiRequestOptions,
	InterceptorsOrInterceptorArray,
} from "@zayne-labs/callapi";

export type CallApiExtraOptions = Omit<InitCallApiExtraOptions, "~retryCount">;
