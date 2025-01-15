export { callApi, createFetchClient } from "./createFetchClient";

export { definePlugin } from "./plugins";
export type { CallApiPlugin, PluginInitContext } from "./plugins";

export type {
	BaseCallApiConfig,
	BaseCallApiExtraOptions,
	CallApiConfig,
	CallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResultErrorVariant,
	CallApiResultModeUnion,
	CallApiResultSuccessVariant,
	CombinedCallApiExtraOptions,
	PossibleJavascriptErrorNames,
	ErrorContext,
	Register,
	RequestContext,
	RequestErrorContext,
	ResponseContext,
	ResponseErrorContext,
	SuccessContext,
} from "./types";
