import type {
	$BaseRequestOptions,
	$RequestOptions,
	ApiErrorVariant,
	BaseConfig,
	ExtraOptions,
	FetchConfig,
	PossibleErrorObject,
} from "../types";
import { isArray, isFunction, isObject } from "./typeof";

// prettier-ignore
export const getRequestKey = <TConfig extends Record<string, unknown>>(url: string, config?: TConfig) => `${url} | ${JSON.stringify(config ?? {})}`;

type ToQueryStringFn = {
	(params: ExtraOptions["query"]): string | null;
	(params: Required<ExtraOptions>["query"]): string;
};

export const toQueryString: ToQueryStringFn = (params) => {
	if (!params) {
		console.error("toQueryString:", "No query params provided!");

		return null as never;
	}

	return new URLSearchParams(params as Record<string, string>).toString();
};

export const mergeUrlWithParams = (url: string, query: ExtraOptions["query"]): string => {
	if (!query) {
		return url;
	}

	const paramsString = toQueryString(query);

	if (paramsString === "") {
		return url;
	}

	if (url.endsWith("?")) {
		return `${url}${paramsString}`;
	}

	if (url.includes("?")) {
		return `${url}&${paramsString}`;
	}

	return `${url}?${paramsString}`;
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

export const omitKeys = <
	TObject extends Record<string, unknown>,
	const TOmitArray extends Array<keyof TObject>,
>(
	initialObject: TObject,
	keysToOmit: TOmitArray
) => {
	const arrayFromFilteredObject = Object.entries(initialObject).filter(
		([key]) => !keysToOmit.includes(key)
	);

	const updatedObject = Object.fromEntries(arrayFromFilteredObject);

	return updatedObject as Omit<TObject, keyof TOmitArray>;
};

const pickKeys = <TObject extends Record<string, unknown>, const TPickArray extends Array<keyof TObject>>(
	initialObject: TObject,
	keysToPick: TPickArray
) => {
	const keysToPickSet = new Set(keysToPick);

	const arrayFromInitObject = Object.entries(initialObject);

	const filteredArray = arrayFromInitObject.filter(([objectKey]) => keysToPickSet.has(objectKey));

	const updatedObject = Object.fromEntries(filteredArray);

	return updatedObject as Pick<TObject, TPickArray[number]>;
};

export const splitConfig = <TObject extends object>(
	config: TObject
): ["body" extends keyof TObject ? $RequestOptions : $BaseRequestOptions, ExtraOptions] => [
	pickKeys(config as Record<string, unknown>, fetchSpecificKeys) as never,
	omitKeys(config as Record<string, unknown>, fetchSpecificKeys) as never,
];

export const handleResponseType = <TResponse>(
	response: Response,
	parser?: Required<ExtraOptions>["responseParser"]
) => ({
	arrayBuffer: () => response.arrayBuffer() as Promise<TResponse>,
	blob: () => response.blob() as Promise<TResponse>,
	formData: () => response.formData() as Promise<TResponse>,
	json: async () => {
		if (parser) {
			return parser(await response.text());
		}

		return response.json() as Promise<TResponse>;
	},
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

type SuccessInfo = {
	options: ExtraOptions;
	response: Response;
	successData: unknown;
};

// == The CallApiResult type is used to cast all return statements due to a design limitation in ts.
// LINK - See https://www.zhenghao.io/posts/type-functions for more info
export const resolveSuccessResult = <CallApiResult>(info: SuccessInfo): CallApiResult => {
	const { options, response, successData } = info;

	const apiDetails = {
		data: successData,
		error: null,
		response,
	};

	if (!options.resultMode || options.resultMode === "all") {
		return apiDetails as CallApiResult;
	}

	return {
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
	}[options.resultMode] as CallApiResult;
};

// == Using curring here so error and options are not required to be passed every time, instead to be captured once by way of closure
export const getResolveErrorResultFn = <CallApiResult>(initInfo: {
	error?: unknown;
	options: ExtraOptions;
}) => {
	const { error, options } = initInfo;

	const resolveErrorResult = <TErrorData>(errorInfo?: Partial<HTTPError<TErrorData>>): CallApiResult => {
		const { errorData, message, response } = errorInfo ?? {};

		const shouldThrowOnError = isFunction(options.throwOnError)
			? options.throwOnError(error as Error)
			: options.throwOnError;

		if (shouldThrowOnError) {
			throw error;
		}

		return {
			data: null,
			error: {
				errorData: errorData ?? error,
				message: message ?? (error as PossibleErrorObject)?.message ?? options.defaultErrorMessage,
				name: (error as PossibleErrorObject)?.name ?? "UnknownError",
			},
			response: response ?? null,
		} as CallApiResult;
	};

	return resolveErrorResult;
};

export const isHTTPError = <TErrorData>(error: ApiErrorVariant<TErrorData>["error"] | null) => {
	return isObject(error) && error.name === "HTTPError";
};

type ErrorDetails<TErrorResponse> = {
	defaultErrorMessage: string;
	errorData: TErrorResponse;
	response: Response;
};

type ErrorOptions = {
	cause?: unknown;
};

export class HTTPError<TErrorResponse = Record<string, unknown>> extends Error {
	errorData: ErrorDetails<TErrorResponse>["errorData"];
	isHTTPError = true;

	override name = "HTTPError" as const;

	response: ErrorDetails<TErrorResponse>["response"];

	constructor(errorDetails: ErrorDetails<TErrorResponse>, errorOptions?: ErrorOptions) {
		const { defaultErrorMessage, errorData, response } = errorDetails;

		super((errorData as { message?: string }).message ?? defaultErrorMessage, errorOptions);

		this.errorData = errorData;
		this.response = response;
	}
}

// prettier-ignore
export const isHTTPErrorInstance = <TErrorResponse>(
	error: unknown
): error is HTTPError<TErrorResponse> => {
	return (
		error instanceof HTTPError || (isObject(error) && error.name === "HTTPError" && error.isHTTPError === true)
	);
};

export const waitUntil = (delay: number) => {
	if (delay === 0) return;

	const { promise, resolve } = Promise.withResolvers();

	setTimeout(resolve, delay);

	return promise;
};
