import type { CallApiRequestOptions, CombinedCallApiExtraOptions } from "../types/common";
import { defineEnum } from "./type-helpers";

export type ModifiedRequestInit = RequestInit & { duplex?: "half" };

export const fetchSpecificKeys = defineEnum([
	"body",
	"integrity",
	"duplex",
	"method",
	"headers",
	"signal",
	"cache",
	"redirect",
	"window",
	"credentials",
	"keepalive",
	"referrer",
	"priority",
	"mode",
	"referrerPolicy",
] satisfies Array<keyof ModifiedRequestInit> as Array<keyof ModifiedRequestInit>);

export const getDefaultOptions = () => {
	return {
		baseURL: "",
		bodySerializer: JSON.stringify,
		dedupeStrategy: "cancel",
		defaultErrorMessage: "Failed to fetch data from server!",
		mergedHooksExecutionMode: "parallel",
		mergedHooksExecutionOrder: "mainHooksAfterPlugins",
		responseType: "json",
		resultMode: "all",
	} satisfies CombinedCallApiExtraOptions;
};

export const getDefaultRequest = () => {
	return {
		method: "GET",
	} satisfies CallApiRequestOptions;
};
