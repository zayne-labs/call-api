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

export type { ResponseTypeUnion } from "./response";

export { getDefaultOptions } from "./utils/constants";

export type { RetryOptions } from "./retry";

export { HTTPError, type PossibleHTTPError, type PossibleJavaScriptError } from "./error";

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
	CallApiResultErrorVariant,
	CallApiResultSuccessVariant,
	CombinedCallApiExtraOptions,
	Register,
	ResultModeUnion,
} from "./types";
