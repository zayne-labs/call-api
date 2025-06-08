import type {
	BaseCallApiExtraOptions as InitBaseCallApiExtraOptions,
	CallApiExtraOptions as InitCallApiExtraOptions,
} from "@zayne-labs/callapi";

export type TimeoutOptions = Pick<InitCallApiExtraOptions, "timeout">;

export type {
	CallApiPlugin,
	RetryOptions,
	CallApiRequestOptions,
	CallApiSchema,
	URLOptions,
	DedupeOptions,
	CallApiSchemaConfig,
	Hooks,
} from "@zayne-labs/callapi";

export type BaseCallApiExtraOptions = Omit<InitBaseCallApiExtraOptions, "~retryAttemptCount">;

export type CallApiExtraOptions = Omit<InitCallApiExtraOptions, "~retryAttemptCount">;
