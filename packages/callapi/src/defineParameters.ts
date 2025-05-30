import type { CallApiPlugin } from "./plugins";
import type { ResponseTypeUnion, ResultModeUnion } from "./result";
import type { CallApiParameters } from "./types";
import type {
	DefaultDataType,
	DefaultMoreOptions,
	DefaultPluginArray,
	DefaultThrowOnError,
} from "./types/default-types";
import type { CallApiSchemas } from "./validation";

const defineParameters = <
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TSchemas extends CallApiSchemas = DefaultMoreOptions,
>(
	...parameters: CallApiParameters<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TPluginArray,
		TSchemas
	>
) => {
	return parameters;
};

export { defineParameters };
