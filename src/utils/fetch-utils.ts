import { omitKeys, pickKeys } from "./regular-utils";
import { isArray, isFunction, isObject } from "./type-helpers";

import type {
	$BaseRequestConfig,
	$RequestConfig,
	BaseConfig,
	ExtraOptions,
	FetchConfig,
	PossibleErrorObject,
} from "../types";

export const mergeUrlWithParams = (url: string, params: ExtraOptions["query"]): string => {
	if (!params) {
		return url;
	}

	const paramsString = new URLSearchParams(params as Record<string, string>).toString();

	if (!url.includes("?")) {
		return `${url}?${paramsString}`;
	}

	if (url.at(-1) === "?") {
		return `${url}${paramsString}`;
	}

	return `${url}&${paramsString}`;
};

export const objectifyHeaders = (headers: RequestInit["headers"]): Record<string, string> | undefined => {
	if (!headers || isObject(headers)) {
		return headers;
	}

	return Object.fromEntries(isArray(headers) ? headers : headers.entries());
};

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

export const defaultRetryCodes: Required<BaseConfig>["retryCodes"] =
	Object.keys(retryCodesLookup).map(Number);

export const defaultRetryMethods: Required<BaseConfig>["retryMethods"] = ["GET"];

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
] satisfies Array<keyof FetchConfig>;

export const splitConfig = <TObject extends Record<string, unknown>>(
	config: TObject
): ["body" extends keyof TObject ? $RequestConfig : $BaseRequestConfig, ExtraOptions] => [
	pickKeys(config, fetchSpecificKeys) as never,
	omitKeys(config, fetchSpecificKeys) as never,
];

export const handleResponseType = <TResponse>(
	response: Response,
	parser?: Required<ExtraOptions>["responseParser"]
) => ({
	json: async () => {
		if (parser) {
			return parser<TResponse>(await response.text());
		}

		return response.json() as Promise<TResponse>;
	},
	arrayBuffer: () => response.arrayBuffer() as Promise<TResponse>,
	blob: () => response.blob() as Promise<TResponse>,
	formData: () => response.formData() as Promise<TResponse>,
	text: () => response.text() as Promise<TResponse>,
});

export const getResponseData = <TResponse>(
	response: Response,
	responseType: keyof ReturnType<typeof handleResponseType>,
	parser: ExtraOptions["responseParser"]
) => {
	const RESPONSE_TYPE_LOOKUP = handleResponseType<TResponse>(response, parser);

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, responseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	return RESPONSE_TYPE_LOOKUP[responseType]();
};

type DataInfo = {
	successData: unknown;
	options: ExtraOptions;
	response: Response;
};

export const resolveSuccessResult = <CallApiResult>(info: DataInfo): CallApiResult => {
	const { options, response, successData } = info;

	const apiDetails = { dataInfo: successData, errorInfo: null, response };

	if (options.resultMode === undefined || options.resultMode === "all") {
		return apiDetails as CallApiResult;
	}

	return {
		onlySuccess: apiDetails.dataInfo,
		onlyError: apiDetails.errorInfo,
		onlyResponse: apiDetails.response,
	}[options.resultMode] as CallApiResult;
};

// == Using curring here so error and options are not required to be passed every time, instead to be captured once by way of closure
export const $resolveErrorResult = <CallApiResult>($info: { error?: unknown; options: ExtraOptions }) => {
	const { error, options } = $info;

	type ErrorInfo = {
		response?: Response;
		errorData?: unknown;
		message?: string;
	};

	const resolveErrorResult = (info: ErrorInfo = {}): CallApiResult => {
		const { errorData, message, response } = info;

		const shouldThrowOnError = isFunction(options.throwOnError)
			? options.throwOnError(error as Error)
			: options.throwOnError;

		if (shouldThrowOnError) {
			throw error;
		}

		return {
			dataInfo: null,
			errorInfo: {
				errorName: (error as PossibleErrorObject)?.name ?? "UnknownError",
				message: message ?? (error as PossibleErrorObject)?.message ?? options.defaultErrorMessage,
				...(Boolean(errorData) && { errorData }),
			},
			response: response ?? null,
		} as CallApiResult;
	};

	return resolveErrorResult;
};
export const isHTTPErrorInfo = (
	errorInfo: Record<string, unknown> | null
): errorInfo is { errorName: "HTTPError" } => isObject(errorInfo) && errorInfo.errorName === "HTTPError";

type ErrorDetails<TErrorResponse> = {
	response: Response & { errorData: TErrorResponse };
	defaultErrorMessage: string;
};

export class HTTPError<TErrorResponse = Record<string, unknown>> extends Error {
	response: ErrorDetails<TErrorResponse>["response"];

	override name = "HTTPError" as const;

	isHTTPError = true;

	constructor(errorDetails: ErrorDetails<TErrorResponse>, errorOptions?: ErrorOptions) {
		const { defaultErrorMessage, response } = errorDetails;

		super((response.errorData as { message?: string }).message ?? defaultErrorMessage, errorOptions);

		this.response = response;
	}
}

export const isHTTPErrorInstance = <TErrorResponse>(
	error: unknown
): error is HTTPError<TErrorResponse> => {
	return (
		error instanceof HTTPError ||
		(isObject(error) && error.name === "HTTPError" && error.isHTTPError === true)
	);
};
