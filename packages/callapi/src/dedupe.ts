import type { CallApiExtraOptions, CallApiRequestOptions } from "./types/common";
import { getFetchImpl, waitUntil } from "./utils/common";

type RequestInfo = {
	controller: AbortController;
	responsePromise: Promise<Response>;
};

export type RequestInfoCache = Map<string | null, RequestInfo>;

type DedupeContext = {
	$RequestInfoCache: RequestInfoCache;
	newFetchController: AbortController;
	options: CallApiExtraOptions;
	request: CallApiRequestOptions;
};

export const createDedupeStrategy = async (context: DedupeContext) => {
	const { $RequestInfoCache, newFetchController, options, request } = context;

	const generateDedupeKey = () => {
		const shouldHaveDedupeKey =
			options.dedupeStrategy === "cancel" || options.dedupeStrategy === "defer";

		if (!shouldHaveDedupeKey) {
			return null;
		}

		return `${options.fullURL}-${JSON.stringify({ options, request })}`;
	};

	const dedupeKey = options.dedupeKey ?? generateDedupeKey();

	// == This is to ensure cache operations only occur when key is available
	const $RequestInfoCacheOrNull = dedupeKey !== null ? $RequestInfoCache : null;

	/******
	 * == Add a small delay to the execution to ensure proper request deduplication when multiple requests with the same key start simultaneously.
	 * == This gives time for the cache to be updated with the previous request info before the next request checks it.
	 ******/
	if (dedupeKey !== null) {
		await waitUntil(0.1);
	}

	const prevRequestInfo = $RequestInfoCacheOrNull?.get(dedupeKey);

	const handleRequestCancelStrategy = () => {
		const shouldCancelRequest = prevRequestInfo && options.dedupeStrategy === "cancel";

		if (!shouldCancelRequest) return;

		const message = options.dedupeKey
			? `Duplicate request detected - Aborting previous request with key '${options.dedupeKey}' as a new request was initiated`
			: `Duplicate request detected - Aborting previous request to '${options.fullURL}' as a new request with identical options was initiated`;

		const reason = new DOMException(message, "AbortError");

		prevRequestInfo.controller.abort(reason);

		// == Adding this just so that eslint forces me put await when calling the function (it looks better that way tbh)
		return Promise.resolve();
	};

	const handleRequestDeferStrategy = () => {
		const fetchApi = getFetchImpl(options.customFetchImpl);

		const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

		const responsePromise = shouldUsePromiseFromCache
			? prevRequestInfo.responsePromise
			: fetchApi(options.fullURL as NonNullable<typeof options.fullURL>, request as RequestInit);

		$RequestInfoCacheOrNull?.set(dedupeKey, { controller: newFetchController, responsePromise });

		return responsePromise;
	};

	const removeDedupeKeyFromCache = () => $RequestInfoCacheOrNull?.delete(dedupeKey);

	return {
		handleRequestCancelStrategy,
		handleRequestDeferStrategy,
		removeDedupeKeyFromCache,
	};
};
