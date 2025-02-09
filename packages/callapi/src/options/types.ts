import type { CallApiPlugin } from "@/plugins";
import type { CallApiExtraOptions, DefaultDataType, ResultModeUnion } from "@/types";
import type { UrlOptions } from "@/url";
import type { Schemas } from "@/validation";

export type CallApiExtraOptionsWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TPluginArray extends CallApiPlugin[] = CallApiPlugin[],
	TSchemas extends Schemas = Schemas,
> = CallApiExtraOptions<TData, TErrorData, TResultMode, TPluginArray, TSchemas> & {
	initURL: UrlOptions<TSchemas>["initURL"];
};
