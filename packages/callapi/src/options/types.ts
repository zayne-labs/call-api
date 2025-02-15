import type { CallApiPlugin } from "@/plugins";
import type { ResponseTypeUnion } from "@/response";
import type { CallApiExtraOptions, ResultModeUnion } from "@/types/common";
import type { DefaultDataType, DefaultPluginArray } from "@/types/default-types";
import type { UrlOptions } from "@/url";
import type { CallApiSchemas } from "@/validation";

export type CallApiExtraOptionsWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = boolean,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TSchemas extends CallApiSchemas = CallApiSchemas,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
> = CallApiExtraOptions<
	TData,
	TErrorData,
	TResultMode,
	TThrowOnError,
	TResponseType,
	TSchemas,
	TPluginArray
> & {
	initURL: UrlOptions<TSchemas>["initURL"];
};
