import type { CallApiConfig, CallApiResultModeUnion, DefaultDataType, DefaultMoreOptions } from "@/types";
import type { AnyObject } from "@/utils/type-helpers";

export type CallApiConfigWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
	TMoreOptions extends AnyObject = DefaultMoreOptions,
> = CallApiConfig<TData, TErrorData, TResultMode, TMoreOptions> & { initURL: string };
