import type { CallApiPlugin } from "./plugins";
import type { ResponseTypeUnion, ResultModeUnion } from "./result";
import type { CallApiParameters, InferInitURL } from "./types";
import type { DefaultDataType, DefaultPluginArray, DefaultThrowOnError } from "./types/default-types";
import type { BaseCallApiSchema, CallApiSchema, CallApiSchemaConfig } from "./validation";

const defineParameters = <
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResultMode extends ResultModeUnion = ResultModeUnion,
	TThrowOnError extends boolean = DefaultThrowOnError,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TPluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchema extends BaseCallApiSchema = BaseCallApiSchema,
	TBaseSchemaConfig extends CallApiSchemaConfig = BaseCallApiSchema,
	TSchema extends CallApiSchema = CallApiSchema,
	TSchemaConfig extends CallApiSchemaConfig = CallApiSchemaConfig,
	TInitURL extends InferInitURL<BaseCallApiSchema, TSchemaConfig> = InferInitURL<
		BaseCallApiSchema,
		TSchemaConfig
	>,
	TCurrentRouteKey extends string = string,
>(
	...parameters: CallApiParameters<
		TData,
		TErrorData,
		TResultMode,
		TThrowOnError,
		TResponseType,
		TBasePluginArray,
		TPluginArray,
		TBaseSchema,
		TBaseSchemaConfig,
		TSchema,
		TSchemaConfig,
		TInitURL,
		TCurrentRouteKey
	>
) => {
	return parameters;
};

export { defineParameters };
