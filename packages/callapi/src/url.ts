/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import { requestOptionDefaults } from "./constants/default-options";
import type { CallApiExtraOptions, CallApiRequestOptions, SharedExtraOptions } from "./types/common";
import type { UnmaskType } from "./types/type-helpers";
import { toQueryString } from "./utils";
import { isArray } from "./utils/guards";
import { type CallApiSchemaConfig, routeKeyMethods } from "./validation";

const slash = "/";
const column = ":";
const mergeUrlWithParams = (url: string, params: CallApiExtraOptions["params"]) => {
	if (!params) {
		return url;
	}

	let newUrl = url;

	if (isArray(params)) {
		const matchedParamArray = newUrl.split(slash).filter((param) => param.startsWith(column));

		for (const [index, matchedParam] of matchedParamArray.entries()) {
			const realParam = params[index] as string;
			newUrl = newUrl.replace(matchedParam, realParam);
		}

		return newUrl;
	}

	for (const [key, value] of Object.entries(params)) {
		newUrl = newUrl.replace(`${column}${key}`, String(value));
	}

	return newUrl;
};

const questionMark = "?";
const ampersand = "&";
const mergeUrlWithQuery = (url: string, query: CallApiExtraOptions["query"]): string => {
	if (!query) {
		return url;
	}

	const queryString = toQueryString(query);

	if (queryString?.length === 0) {
		return url;
	}

	if (url.endsWith(questionMark)) {
		return `${url}${queryString}`;
	}

	if (url.includes(questionMark)) {
		return `${url}${ampersand}${queryString}`;
	}

	return `${url}${questionMark}${queryString}`;
};

export const getCurrentRouteKey = (url: string, schemaConfig: CallApiSchemaConfig | undefined) => {
	let currentRouteKey = url;

	if (schemaConfig?.baseURL && currentRouteKey.startsWith(schemaConfig.baseURL)) {
		currentRouteKey = currentRouteKey.replace(schemaConfig.baseURL, "");
	}

	return currentRouteKey;
};

/**
 * @description
 * Extracts the method from the URL if it is a schema modifier.
 *
 * @param url - The URL to extract the method from.
 * @returns The method if it is a schema modifier, otherwise undefined.
 */
export const getMethodFromURL = (url: string | undefined) => {
	if (!url?.startsWith("@")) return;

	const method = url.split("@")[1]?.split("/")[0];

	if (!method || !routeKeyMethods.includes(method)) return;

	return method;
};

export type GetMethodOptions = {
	method: CallApiRequestOptions["method"];
	schemaConfig?: CallApiSchemaConfig;
	url: string | undefined;
};

export const getMethod = (options: GetMethodOptions) => {
	const { method, schemaConfig, url } = options;

	if (schemaConfig?.requireHttpMethodProvision === true) {
		return method?.toUpperCase() ?? requestOptionDefaults.method;
	}

	return method?.toUpperCase() ?? getMethodFromURL(url)?.toUpperCase() ?? requestOptionDefaults.method;
};

export const removeMethodFromURL = (url: string) => {
	const methodFromURL = getMethodFromURL(url);

	if (!methodFromURL) {
		return url;
	}

	const actualUrl = url.replace(`@${methodFromURL}/`, "/");

	return actualUrl;
};

export const getMainURL = (
	url: string,
	baseURL: string | undefined,
	params: SharedExtraOptions["params"],
	query: SharedExtraOptions["query"]
) => {
	// == Remove method modifiers
	const actualUrl = removeMethodFromURL(url);

	const urlWithMergedParams = mergeUrlWithParams(actualUrl, params);

	const urlWithMergedQueryAndParams = mergeUrlWithQuery(urlWithMergedParams, query);

	if (urlWithMergedQueryAndParams.startsWith("http") || !baseURL) {
		return urlWithMergedQueryAndParams;
	}

	return `${baseURL}${urlWithMergedQueryAndParams}`;
};

export type AllowedQueryParamValues = UnmaskType<boolean | number | string>;

export type Params = UnmaskType<
	// eslint-disable-next-line perfectionist/sort-union-types -- I need the Record to be first
	Record<string, AllowedQueryParamValues> | AllowedQueryParamValues[]
>;

export type Query = UnmaskType<Record<string, AllowedQueryParamValues>>;

export interface UrlOptions {
	/**
	 * Base URL to be prepended to all request URLs
	 */
	baseURL?: string;

	/**
	 * Resolved request URL
	 */
	readonly fullURL?: string;

	/**
	 * URL to be used in the request.
	 *
	 * This is the URL after method modifiers have been removed.
	 */
	readonly initURL?: string;

	/**
	 * Parameters to be appended to the URL (i.e: /:id)
	 */
	params?: Params;

	/**
	 * Query parameters to append to the URL.
	 */
	query?: Query;

	/**
	 * URL to be used in the request.
	 *
	 * This is the URL before any method modifiers have been removed.
	 */
	readonly rawInitURL?: string;
}
