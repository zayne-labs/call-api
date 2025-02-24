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
	TSchemas extends CallApiSchemas = CallApiSchemas,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
> = Omit<
	CallApiExtraOptions<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TSchemas,
		TPluginArray
	>,
	"initURL"
> & {
	initURL: InferSchemaResult<TSchemas["initURL"], InitURL>;
};
