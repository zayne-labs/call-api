import type { CallApiPlugin } from "@/plugins";
import type { CallApiConfig, DefaultDataType, ResultModeUnion } from "@/types";
import type { Schemas } from "@/validation";

export type CallApiConfigWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TPluginArray extends CallApiPlugin[] = never[],
	TSchemas extends Schemas = Schemas,
> = CallApiConfig<TData, TErrorData, TResultMode, TPluginArray, TSchemas> & {
	initURL: string;
};
