import type { BaseCallApiExtraOptions } from "../types";
import { defineEnum } from "../utils/type-helpers";

export const retryDefaults = defineEnum({
	attempts: 0,
	condition: () => true,
	delay: 1000,
	maxDelay: 10000,
	methods: ["GET", "POST"] satisfies BaseCallApiExtraOptions["retryMethods"],
	statusCodes: [] satisfies BaseCallApiExtraOptions["retryStatusCodes"],
	strategy: "linear",
});

export const defaultRetryStatusCodesLookup = defineEnum({
	408: "Request Timeout",
	409: "Conflict",
	425: "Too Early",
	429: "Too Many Requests",
	500: "Internal Server Error",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
});

export const commonDefaults = defineEnum({
	bodySerializer: JSON.stringify,
	defaultErrorMessage: "Failed to fetch data from server!",
});

export const responseDefaults = defineEnum({
	responseParser: JSON.parse,
	responseType: "json",
	resultMode: "all",
});

export const hookDefaults = defineEnum({
	mergedHooksExecutionMode: "parallel",
	mergedHooksExecutionOrder: "mainHooksAfterPlugins",
});

export const dedupeDefaults = defineEnum({
	dedupeStrategy: "cancel",
});

export const requestOptionDefaults = defineEnum({
	method: "GET",
});
