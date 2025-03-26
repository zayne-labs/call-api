import type { CallApiPlugin } from "@/plugins";
import type { ResponseTypeUnion } from "@/response";
import type { CallApiExtraOptions, ResultModeUnion } from "@/types/common";
import type { DefaultDataType, DefaultPluginArray } from "@/types/default-types";
import type { InitURL } from "@/url";
import type { CallApiSchemas, InferSchemaResult } from "@/validation";

export type CallApiExtraOptionsWithRequiredURL<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = boolean,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = CallApiSchemas,
> = Omit<
	CallApiExtraOptions<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TPluginArray,
		TSchemas
	>,
	"initURL"
> & {
	initURL: InferSchemaResult<TSchemas["initURL"], InitURL>;
};
