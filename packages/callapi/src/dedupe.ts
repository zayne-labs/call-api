import type { CallApiExtraOptions, CallApiRequestOptions } from "./types";
import { getFetchImpl } from "./utils/common";

export const generateDedupeKey = (
	fullURL: string,
	request: CallApiRequestOptions,
	options: CallApiExtraOptions
) => {
	const shouldHaveDedupeKey = options.dedupeStrategy === "cancel" || options.dedupeStrategy === "defer";

	if (!shouldHaveDedupeKey) {
		return null;
	}

	return `${options.fullURL}-${JSON.stringify({ options, request })}`;
};

type RequestInfo = { controller: AbortController; responsePromise: Promise<Response> };

export type RequestInfoCache = Map<string | null, RequestInfo>;

export const handleRequestCancelDedupe = (
	fullURL: string,
	options: CallApiExtraOptions,
	prevRequestInfo: RequestInfo | undefined
) => {
	const shouldCancelRequest = prevRequestInfo && options.dedupeStrategy === "cancel";

	if (shouldCancelRequest) {
		const message = options.dedupeKey
			? `Duplicate request detected - Aborting previous request with key '${options.dedupeKey}' as a new request was initiated`
			: `Duplicate request detected - Aborting previous request to '${options.fullURL}' as a new request with identical options was initiated`;

		const reason = new DOMException(message, "AbortError");

		prevRequestInfo.controller.abort(reason);
	}
};

export const handleRequestDeferDedupe = (
	fullURL: string,
	options: CallApiExtraOptions,
	request: CallApiRequestOptions,
	prevRequestInfo: RequestInfo | undefined
) => {
	const fetchApi = getFetchImpl(options.customFetchImpl);

	const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

	const responsePromise = shouldUsePromiseFromCache
		? prevRequestInfo.responsePromise
		: fetchApi(fullURL, request as RequestInit);

	return responsePromise;
};
