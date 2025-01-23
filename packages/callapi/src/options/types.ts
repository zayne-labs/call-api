import type { CallApiConfig, CallApiResultModeUnion } from "@/types";

export type CallApiConfigWithRequiredURL<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
	TMoreOptions extends Record<string, unknown> = Record<string, unknown>,
> = CallApiConfig<TData, TErrorData, TResultMode, TMoreOptions> & { initURL: string };
