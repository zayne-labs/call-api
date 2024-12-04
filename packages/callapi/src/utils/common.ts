import type {
	BaseCallApiExtraOptions,
	CallApiConfig,
	CallApiExtraOptions,
	CallApiResultErrorVariant,
	ErrorObjectUnion,
	PossibleHTTPError,
	PossibleJavascriptErrorNames,
} from "../types";
import { fetchSpecificKeys } from "./constants";
import type { Awaitable } from "./type-helpers";
import { isFunction, isObject, isPlainObject, isQueryString, isString } from "./typeof";

const omitKeys = <TObject extends Record<string, unknown>, const TOmitArray extends Array<keyof TObject>>(
	initialObject: TObject,
	keysToOmit: TOmitArray
) => {
	const updatedObject = {} as Record<string, unknown>;

	const keysToOmitSet = new Set(keysToOmit);

	for (const [key, value] of Object.entries(initialObject)) {
		if (!keysToOmitSet.has(key)) {
			updatedObject[key] = value;
		}
	}

	return updatedObject as Omit<TObject, TOmitArray[number]>;
};

const pickKeys = <TObject extends Record<string, unknown>, const TPickArray extends Array<keyof TObject>>(
	initialObject: TObject,
	keysToPick: TPickArray
) => {
	const updatedObject = {} as Record<string, unknown>;

	const keysToPickSet = new Set(keysToPick);

	for (const [key, value] of Object.entries(initialObject)) {
		if (keysToPickSet.has(key)) {
			updatedObject[key] = value;
		}
	}

	return updatedObject as Pick<TObject, TPickArray[number]>;
};

// eslint-disable-next-line ts-eslint/no-explicit-any
export const splitBaseConfig = (baseConfig: Record<string, any>) =>
	[
		pickKeys(baseConfig, fetchSpecificKeys) as RequestInit,
		omitKeys(baseConfig, [...fetchSpecificKeys, "requestKey"] satisfies Array<
			keyof CallApiConfig
		>) as BaseCallApiExtraOptions,
	] as const;

// eslint-disable-next-line ts-eslint/no-explicit-any
export const splitConfig = (config: Record<string, any>) =>
	[
		pickKeys(config, fetchSpecificKeys) as RequestInit,
		omitKeys(config, fetchSpecificKeys) as CallApiExtraOptions,
	] as const;

export const objectifyHeaders = (headers: RequestInit["headers"]): Record<string, string> | undefined => {
	if (!headers || isPlainObject(headers)) {
		return headers;
	}

	return Object.fromEntries(headers);
};

export const generateRequestKey = (
	url: string,
	config: Record<string, unknown> & { shouldHaveRequestKey: boolean }
) => {
	if (!config.shouldHaveRequestKey) {
		return null;
	}

	return `${url}-${JSON.stringify(config)}`;
};

type ToQueryStringFn = {
	(params: CallApiConfig["query"]): string | null;
	(params: Required<CallApiConfig>["query"]): string;
};

export const toQueryString: ToQueryStringFn = (params) => {
	if (!params) {
		console.error("toQueryString:", "No query params provided!");

		return null as never;
	}

	return new URLSearchParams(params as Record<string, string>).toString();
};

export const getHeaders = (options: {
	auth: CallApiConfig["auth"];
	baseHeaders: CallApiConfig["headers"];
	body: CallApiConfig["body"];
	headers: CallApiConfig["headers"];
}) => {
	const { auth, baseHeaders, body, headers } = options;

	// eslint-disable-next-line ts-eslint/prefer-nullish-coalescing
	const shouldResolveHeaders = Boolean(baseHeaders || headers || body || auth);

	// == Return early if the following conditions are not met (so that native fetch would auto set the correct headers):
	// == - headers are provided
	// == - The body is an object
	// == - The auth option is provided
	if (!shouldResolveHeaders) return;

	const headersObject: Record<string, string> = {
		...(isPlainObject(body) && {
			Accept: "application/json",
			"Content-Type": "application/json",
		}),
		...(isQueryString(body) && {
			"Content-Type": "application/x-www-form-urlencoded",
		}),
		...((isString(auth) || auth === null) && {
			Authorization: `Bearer ${auth}`,
		}),
		...(isObject(auth) && {
			Authorization: "bearer" in auth ? `Bearer ${auth.bearer}` : `Token ${auth.token}`,
		}),

		...objectifyHeaders(baseHeaders),
		...objectifyHeaders(headers),
	};

	return headersObject;
};

export const getFetchImpl = (customFetchImpl: CallApiExtraOptions["customFetchImpl"]) => {
	if (customFetchImpl) {
		return customFetchImpl;
	}

	if (typeof globalThis !== "undefined" && isFunction(globalThis.fetch)) {
		return globalThis.fetch;
	}
	/* eslint-disable unicorn/prefer-global-this */
	if (typeof window !== "undefined" && isFunction(window.fetch)) {
		return window.fetch;
	}
	/* eslint-enable unicorn/prefer-global-this */

	throw new Error("No fetch implementation found");
};

export const getResponseType = <TResponse>(
	response: Response,
	parser?: Required<CallApiExtraOptions>["responseParser"]
) => ({
	arrayBuffer: () => response.arrayBuffer() as Promise<TResponse>,
	blob: () => response.blob() as Promise<TResponse>,
	formData: () => response.formData() as Promise<TResponse>,
	json: async () => {
		if (parser) {
			const text = await response.text();
			return parser(text);
		}

		return response.json() as Promise<TResponse>;
	},
	text: () => response.text() as Promise<TResponse>,
});

export const executeInterceptors = <TInterceptor extends Awaitable<void>>(
	...interceptors: TInterceptor[]
) => Promise.all(interceptors);

export const getResponseData = <TResponse>(
	response: Response,
	responseType: keyof ReturnType<typeof getResponseType>,
	parser: CallApiExtraOptions["responseParser"]
) => {
	const RESPONSE_TYPE_LOOKUP = getResponseType<TResponse>(response, parser);

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, responseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	return RESPONSE_TYPE_LOOKUP[responseType]();
};

type SuccessInfo = {
	response: Response;
	resultMode: CallApiExtraOptions["resultMode"];
	successData: unknown;
};

// == The CallApiResult type is used to cast all return statements due to a design limitation in ts.
// LINK - See https://www.zhenghao.io/posts/type-functions for more info
export const resolveSuccessResult = <CallApiResult>(info: SuccessInfo): CallApiResult => {
	const { response, resultMode, successData } = info;

	const apiDetails = {
		data: successData,
		error: null,
		response,
	};

	if (!resultMode) {
		return apiDetails as CallApiResult;
	}

	return {
		all: apiDetails,
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
	}[resultMode] as CallApiResult;
};

type ErrorInfo = {
	defaultErrorMessage: Required<CallApiExtraOptions>["defaultErrorMessage"];
	error?: unknown;
	message?: string;
	resultMode: CallApiExtraOptions["resultMode"];
};

export const resolveErrorResult = <TCallApiResult>(info: ErrorInfo) => {
	const { defaultErrorMessage, error, message: customErrorMessage, resultMode } = info;

	let apiDetails!: CallApiResultErrorVariant<unknown>;

	if (isHTTPErrorInstance(error)) {
		const { errorData, message = defaultErrorMessage, name, response } = error;

		apiDetails = {
			data: null,
			error: {
				errorData,
				message,
				name,
			},
			response,
		};
	}

	if (!isHTTPErrorInstance(error)) {
		const { message, name } = error as Error;

		apiDetails = {
			data: null,
			error: {
				errorData: error as Error,
				message: customErrorMessage ?? message,
				name: name as PossibleJavascriptErrorNames,
			},
			response: null,
		};
	}

	const generalErrorResult = ({
		all: apiDetails,
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
	}[resultMode ?? "all"] ?? apiDetails) as TCallApiResult;

	// prettier-ignore
	const resolveCustomErrorInfo = ({ message }: Pick<ErrorInfo, "message">) => {
		const errorResult = resolveErrorResult<TCallApiResult>({ ...info, message });

		return errorResult.generalErrorResult;
	};

	return { apiDetails, generalErrorResult, resolveCustomErrorInfo };
};

export const isHTTPError = <TErrorData>(
	error: ErrorObjectUnion<TErrorData> | null
): error is PossibleHTTPError<TErrorData> => {
	return isPlainObject(error) && error.name === "HTTPError";
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

		super((errorData as { message?: string } | undefined)?.message ?? defaultErrorMessage, errorOptions);

		this.errorData = errorData;
		this.response = response;

		Error.captureStackTrace(this, this.constructor);
	}
}

export const isHTTPErrorInstance = <TErrorResponse>(
	error: unknown
): error is HTTPError<TErrorResponse> => {
	return (
		// prettier-ignore
		error instanceof HTTPError || (isPlainObject(error, HTTPError) && error.name === "HTTPError" && error.isHTTPError === true)
	);
};

const PromiseWithResolvers = () => {
	let reject!: (reason?: unknown) => void;
	let resolve!: (value: unknown) => void;

	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, reject, resolve };
};

export const waitUntil = (delay: number) => {
	if (delay === 0) return;

	const { promise, resolve } = PromiseWithResolvers();

	setTimeout(resolve, delay);

	return promise;
};
