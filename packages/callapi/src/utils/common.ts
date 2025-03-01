import { getAuthHeader } from "@/auth";
import {
	type BaseCallApiExtraOptions,
	type CallApiExtraOptions,
	type CallApiRequestOptions,
	optionsEnumToOmitFromBase,
} from "../types/common";
import { fetchSpecificKeys } from "./constants";
import { isArray, isFunction, isPlainObject, isQueryString, isString } from "./type-guards";
import type { AnyFunction, Awaitable } from "./type-helpers";

export const omitKeys = <
	TObject extends Record<string, unknown>,
	const TOmitArray extends Array<keyof TObject>,
>(
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

export const pickKeys = <
	TObject extends Record<string, unknown>,
	const TPickArray extends Array<keyof TObject>,
>(
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
	(params: CallApiExtraOptions["query"]): string | null;
	(params: Required<CallApiExtraOptions>["query"]): string;
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
	auth: CallApiExtraOptions["auth"];
	baseHeaders: CallApiExtraOptions["headers"];
	body: CallApiExtraOptions["body"];
	headers: CallApiExtraOptions["headers"];
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

export const combineHooks = <TInterceptor extends AnyFunction | Array<AnyFunction | undefined>>(
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

export const executeHooks = <TInterceptor extends Awaitable<unknown>>(...interceptors: TInterceptor[]) =>
	Promise.all(interceptors);

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
