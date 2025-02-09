/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */

import type { CallApiExtraOptions } from "./types";
import { toQueryString } from "./utils";
import { isArray } from "./utils/type-guards";
import type { InferSchemaResult, Schemas } from "./validation";

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

export const mergeUrlWithParamsAndQuery = (
	url: string,
	params: CallApiExtraOptions["params"],
	query: CallApiExtraOptions["query"]
) => {
	const urlWithMergedParams = mergeUrlWithParams(url, params);

	return mergeUrlWithQuery(urlWithMergedParams, query);
};

// eslint-disable-next-line perfectionist/sort-union-types -- I need the Record to be first
type Params = Record<string, boolean | number | string> | Array<boolean | number | string>;

type Query = Record<string, boolean | number | string>;

type InitURL = string;

export interface UrlOptions<TSchemas extends Schemas> {
	/**
	 * URL to be used in the request.
	 */
	readonly initURL?: InferSchemaResult<TSchemas["initURL"], InitURL>;

	/**
	 * Parameters to be appended to the URL (i.e: /:id)
	 */
	params?: InferSchemaResult<TSchemas["params"], Params>;

	/**
	 * Query parameters to append to the URL.
	 */
	query?: InferSchemaResult<TSchemas["query"], Query>;
}
