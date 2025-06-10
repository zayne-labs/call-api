import type { CallApiPlugin } from "./plugins";
import type { ResponseTypeUnion, ResultModeUnion } from "./result";
import type { CallApiParameters, InferInitURL, ThrowOnErrorUnion } from "./types";
import type { DefaultDataType, DefaultPluginArray, DefaultThrowOnError } from "./types/default-types";
import type { BaseCallApiSchema, CallApiSchema, CallApiSchemaConfig } from "./validation";

const defineParameters = <
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends ThrowOnErrorUnion = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBaseSchema extends BaseCallApiSchema = BaseCallApiSchema,
	TSchema extends CallApiSchema = CallApiSchema,
	TBaseSchemaConfig extends CallApiSchemaConfig = CallApiSchemaConfig,
	TSchemaConfig extends CallApiSchemaConfig = CallApiSchemaConfig,
	TInitURL extends InferInitURL<BaseCallApiSchema, TSchemaConfig> = InferInitURL<
		BaseCallApiSchema,
		TSchemaConfig
	>,
	TCurrentRouteKey extends string = string,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
>(
	...parameters: CallApiParameters<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TBaseSchema,
		TSchema,
		TBaseSchemaConfig,
		TSchemaConfig,
		TInitURL,
		TCurrentRouteKey,
		TBasePluginArray,
		TPluginArray
	>
) => {
	return parameters;
};

export { defineParameters };
