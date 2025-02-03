import type { CallApiPlugin } from "@/plugins";
import type { CallApiConfig, DefaultDataType, ResultModeUnion } from "@/types";

export type CallApiConfigWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TPluginArray extends CallApiPlugin[] = CallApiPlugin[],
> = CallApiConfig<TData, TErrorData, TResultMode, TPluginArray> & { initURL: string };
