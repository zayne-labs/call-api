export { callApi, createFetchClient } from "./createFetchClient";

export { definePlugin } from "./plugins";
export type { CallApiPlugin, PluginInitContext } from "./plugins";
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
	CallApiResultModeUnion,
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

export * from "./utils";
