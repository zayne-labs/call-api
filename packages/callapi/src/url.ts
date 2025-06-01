/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { CallApiExtraOptions, ExtraOptions } from "./types/common";
import type { UnmaskType } from "./types/type-helpers";
import { toQueryString } from "./utils";
import { isArray } from "./utils/guards";
import { routeKeyMethods } from "./validation";

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

export const getMethodFromURL = (url: string | undefined) => {
	if (!url?.startsWith("@")) return;

	const method = url.split("@")[1]?.split("/")[0];

	if (!method || !routeKeyMethods.includes(method)) return;

	return method;
};

const removeMethodFromURL = (url: string) => {
	const method = getMethodFromURL(url);

	if (method) {
		const actualUrl = url.replace(`@${method}/`, "/");

		return actualUrl;
	}

	return url;
};

export const getMainURL = (
	url: string | undefined,
	params: ExtraOptions["params"],
	query: ExtraOptions["query"]
) => {
	if (!url) return;

	// == Remove method modifiers
	const actualUrl = removeMethodFromURL(url);

	const urlWithMergedParams = mergeUrlWithParams(actualUrl, params);

	return mergeUrlWithQuery(urlWithMergedParams, query);
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
