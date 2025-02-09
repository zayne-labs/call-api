import type { CallApiPlugin, DefaultPlugins } from "@/plugins";
import type { CallApiExtraOptions, DefaultDataType, ResultModeUnion } from "@/types/common";
import type { UrlOptions } from "@/url";
import type { Schemas } from "@/validation";

export type CallApiExtraOptionsWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TSchemas extends Schemas = Schemas,
	TPluginArray extends CallApiPlugin[] = DefaultPlugins,
> = CallApiExtraOptions<TData, TErrorData, TResultMode, TSchemas, TPluginArray> & {
	initURL: UrlOptions<TSchemas>["initURL"];
};
