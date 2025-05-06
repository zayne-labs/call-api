export { callApi, createFetchClient } from "./createFetchClient";

export {
	definePlugin,
	type CallApiPlugin,
	type PluginInitContext,
	type PluginHooks,
	type PluginHooksWithMoreOptions,
} from "./plugins";

export { defineParameters } from "./defineParameters";

export type { CallApiSchemas, InferSchemaResult } from "./validation";

export type { RetryOptions } from "./retry";

export { HTTPError } from "./error";

export {
	type PossibleHTTPError,
	type PossibleJavaScriptError,
	type ResponseTypeUnion,
	type CallApiResultErrorVariant,
	type CallApiResultSuccessVariant,
	type ResultModeUnion,
} from "./result";

export type {
	ErrorContext,
	Hooks,
	HooksOrHooksArray,
	SharedHookContext,
	RequestContext,
	RequestErrorContext,
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
	CombinedCallApiExtraOptions,
	Register,
} from "./types";
