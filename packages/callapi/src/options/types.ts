import type { CallApiPlugin, DefaultPlugins } from "@/plugins";
import type { ResponseTypeUnion } from "@/response";
import type { CallApiExtraOptions, DefaultDataType, ResultModeUnion } from "@/types/common";
import type { UrlOptions } from "@/url";
import type { CallApiSchemas } from "@/validation";

export type CallApiExtraOptionsWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TSchemas extends CallApiSchemas = CallApiSchemas,
	TPluginArray extends CallApiPlugin[] = DefaultPlugins,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
> = CallApiExtraOptions<TData, TErrorData, TResultMode, TSchemas, TPluginArray, TResponseType> & {
	initURL: UrlOptions<TSchemas>["initURL"];
};
