export { callApi, createFetchClient } from "./createFetchClient";

export { defineParameters } from "./defineParameters";

export {
	definePlugin,
	type CallApiPlugin,
	type PluginInitContext,
	type PluginHooks,
	type PluginHooksWithMoreOptions,
} from "./plugins";

export type { URLOptions } from "./url";

export type { DedupeOptions } from "./dedupe";

export {
	type CallApiSchema,
	type BaseCallApiSchema,
	type InferSchemaResult,
	type CallApiSchemaConfig,
	defineSchema,
} from "./validation";

export type { RetryOptions } from "./retry";

export { HTTPError, ValidationError } from "./error";

export {
	type PossibleHTTPError,
	type PossibleJavaScriptError,
	type PossibleValidationError,
	type ResponseTypeUnion,
	type CallApiResultErrorVariant,
	type CallApiResultSuccessVariant,
	type ResultModeUnion,
} from "./result";

export type {
	ErrorContext,
	Hooks,
	HooksOrHooksArray,
	RequestContext,
	RequestStreamContext,
	ResponseContext,
	ResponseErrorContext,
	ResponseStreamContext,
	SuccessContext,
} from "./hooks";

export type {
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResult,
	InferParamFromPath,
	CombinedCallApiExtraOptions,
	Register,
} from "./types";
