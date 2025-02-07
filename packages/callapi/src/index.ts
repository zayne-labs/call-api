export { callApi, createFetchClient } from "./createFetchClient";

export { definePlugin, type CallApiPlugin, type PluginInitContext } from "./plugins";

export type { InferSchemaResult } from "./validation";

export { HTTPError } from "./error";

export type {
	BaseCallApiConfig,
	BaseCallApiExtraOptions,
	CallApiConfig,
	CallApiExtraOptions,
	PossibleJavaScriptError,
	PossibleHTTPError,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResultErrorVariant,
	ResultModeUnion,
	CallApiResultSuccessVariant,
	CombinedCallApiExtraOptions,
	ErrorContext,
	Interceptors,
	InterceptorsOrInterceptorArray,
	PossibleJavascriptErrorNames,
	Register,
	RequestContext,
	RequestErrorContext,
	ResponseContext,
	ResponseErrorContext,
	SuccessContext,
} from "./types";
