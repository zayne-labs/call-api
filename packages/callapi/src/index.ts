export { callApi, createFetchClient } from "./createFetchClient";

export { defineCallApiPlugin } from "./plugins";
export type { CallApiPlugin, PluginInitContext } from "./plugins";

export type {
	CallApiConfig,
	CallApiExtraOptions,
	CallApiResultErrorVariant,
	CallApiResultSuccessVariant,
	ErrorContext,
	Register,
	RequestContext,
	RequestErrorContext,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	ResponseContext,
	ResponseErrorContext,
	SuccessContext,
} from "./types";
