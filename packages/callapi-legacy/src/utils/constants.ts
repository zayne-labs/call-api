import type { BaseCallApiExtraOptions } from "../types/common";
import { defineEnum } from "./type-helpers";

export const fetchSpecificKeys = defineEnum([
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
] satisfies Array<keyof RequestInit>);

const retryStatusCodesLookup = defineEnum({
	408: "Request Timeout",
	409: "Conflict",
	425: "Too Early",
	429: "Too Many Requests",
	500: "Internal Server Error",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
});

export const defaultRetryMethods = ["GET", "POST"] satisfies BaseCallApiExtraOptions["retryMethods"];

// prettier-ignore
export const defaultRetryStatusCodes = Object.keys(retryStatusCodesLookup).map(Number) as Required<BaseCallApiExtraOptions>["retryStatusCodes"];
