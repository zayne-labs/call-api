import type { CallApiConfig, DefaultDataType, DefaultMoreOptions, ResultModeUnion } from "@/types";
import type { AnyObject } from "@/utils/type-helpers";

export type CallApiConfigWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TMoreOptions extends AnyObject = DefaultMoreOptions,
> = CallApiConfig<TData, TErrorData, TResultMode, TMoreOptions> & { initURL: string };
