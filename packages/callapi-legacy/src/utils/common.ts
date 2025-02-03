import { getAuthHeader } from "@/auth";
import {
	type BaseCallApiExtraOptions,
	type CallApiConfig,
	type CallApiExtraOptions,
	type CallApiRequestOptions,
	type ResultModeMap,
	optionsEnumToOmitFromBase,
} from "../types";
import { fetchSpecificKeys } from "./constants";
import { isArray, isFunction, isPlainObject, isQueryString, isString } from "./type-guards";
import type { AnyFunction, Awaitable } from "./type-helpers";

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

// eslint-disable-next-line ts-eslint/no-explicit-any -- Any is required here so that one can pass custom function type without type errors
export const splitBaseConfig = (baseConfig: Record<string, any>) =>
	[
		pickKeys(baseConfig, fetchSpecificKeys) as CallApiRequestOptions,
		omitKeys(baseConfig, [
			...fetchSpecificKeys,
			...optionsEnumToOmitFromBase,
		]) as BaseCallApiExtraOptions,
	] as const;

// eslint-disable-next-line ts-eslint/no-explicit-any -- Any is required here so that one can pass custom function type without type errors
export const splitConfig = (config: Record<string, any>) =>
	[
		pickKeys(config, fetchSpecificKeys) as CallApiRequestOptions,
		omitKeys(config, fetchSpecificKeys) as CallApiExtraOptions,
	] as const;

export const objectifyHeaders = (headers: CallApiRequestOptions["headers"]) => {
	if (!headers || isPlainObject(headers)) {
		return headers;
	}

	return Object.fromEntries(headers);
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

// export mergeAndResolve

export const mergeAndResolveHeaders = (options: {
	auth: CallApiConfig["auth"];
	baseHeaders: CallApiConfig["headers"];
	body: CallApiConfig["body"];
	headers: CallApiConfig["headers"];
}) => {
	const { auth, baseHeaders, body, headers } = options;

	// eslint-disable-next-line ts-eslint/prefer-nullish-coalescing -- Nullish coalescing makes no sense in this boolean context
	const shouldResolveHeaders = Boolean(baseHeaders || headers || body || auth);

	// == Return early if any of the following conditions are not met (so that native fetch would auto set the correct headers):
	// == - headers are provided
	// == - The body is an object
	// == - The auth option is provided
	if (!shouldResolveHeaders) return;

	const headersObject: Record<string, string | undefined> = {
		...getAuthHeader(auth),
		...objectifyHeaders(baseHeaders),
		...objectifyHeaders(headers),
	};

	if (isQueryString(body)) {
		headersObject["Content-Type"] = "application/x-www-form-urlencoded";

		return headersObject;
	}

	if (isPlainObject(body) || (isString(body) && body.startsWith("{"))) {
		headersObject["Content-Type"] = "application/json";
		headersObject.Accept = "application/json";
	}

	return headersObject;
};

export const combineHooks = <
	TInterceptor extends
		| AnyFunction<Awaitable<unknown>>
		| Array<AnyFunction<Awaitable<unknown>> | undefined>,
>(
	baseInterceptor: TInterceptor | undefined,
	interceptor: TInterceptor | undefined
) => {
	if (isArray(baseInterceptor)) {
		return [baseInterceptor, interceptor].flat() as TInterceptor;
	}

	return interceptor ?? baseInterceptor;
};

export const getFetchImpl = (customFetchImpl: CallApiExtraOptions["customFetchImpl"]) => {
	if (customFetchImpl) {
		return customFetchImpl;
	}

	if (typeof globalThis !== "undefined" && isFunction(globalThis.fetch)) {
		return globalThis.fetch;
	}

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
	stream: () => response.body,
	text: () => response.text() as Promise<TResponse>,
});

export const executeHooks = <TInterceptor extends Awaitable<unknown>>(...interceptors: TInterceptor[]) =>
	Promise.all(interceptors);

export const getResponseData = async <TResponse>(
	response: Response,
	responseType: keyof ReturnType<typeof getResponseType>,
	parser: CallApiExtraOptions["responseParser"],
	validator?: CallApiExtraOptions["responseValidator"]
) => {
	const RESPONSE_TYPE_LOOKUP = getResponseType<TResponse>(response, parser);

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, responseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	const responseData = await RESPONSE_TYPE_LOOKUP[responseType]();

	const validResponseData = validator ? validator(responseData) : responseData;

	return validResponseData;
};

type SuccessInfo = {
	data: unknown;
	response: Response;
	resultMode: CallApiExtraOptions["resultMode"];
};

// == The CallApiResult type is used to cast all return statements due to a design limitation in ts.
// LINK - See https://www.zhenghao.io/posts/type-functions for more info
export const resolveSuccessResult = <TCallApiResult>(info: SuccessInfo): TCallApiResult => {
	const { data, response, resultMode } = info;

	const apiDetails = { data, error: null, response };

	if (!resultMode) {
		return apiDetails as TCallApiResult;
	}

	const resultModeMap: ResultModeMap = {
		all: apiDetails,
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
		onlySuccessWithException: apiDetails.data,
	};

	return resultModeMap[resultMode] as TCallApiResult;
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
