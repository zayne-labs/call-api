export { callApi, createFetchClient } from "./createFetchClient";

export { defineCallApiPlugin } from "./plugins";
export type { CallApiPlugin, PluginInitContext } from "./plugins";

export type {
	CallApiConfig,
	CallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResultErrorVariant,
	CallApiResultModeUnion,
	CallApiResultSuccessVariant,
	ErrorContext,
	Register,
	RequestContext,
	RequestErrorContext,
	ResponseContext,
	ResponseErrorContext,
	SuccessContext,
} from "./types";
