import type { BaseCallApiConfig } from "@/types";

export const fetchSpecificKeys = [
	"body",
	"integrity",
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
] satisfies Array<keyof RequestInit>;

const retryCodesLookup = {
	408: "Request Timeout",
	409: "Conflict",
	425: "Too Early",
	429: "Too Many Requests",
	500: "Internal Server Error",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
};

export const defaultRetryMethods: Required<BaseCallApiConfig>["retryMethods"] = ["GET"];

export const defaultRetryCodes: Required<BaseCallApiConfig>["retryCodes"] =
	Object.keys(retryCodesLookup).map(Number);
