import { toStreamableRequest, toStreamableResponse } from "./stream";
import type {
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
} from "./types/common";
import { getFetchImpl, waitUntil } from "./utils/common";
import { isReadableStream } from "./utils/guards";

type RequestInfo = {
	controller: AbortController;
	responsePromise: Promise<Response>;
};

export type RequestInfoCache = Map<string | null, RequestInfo>;

type DedupeContext = {
	$RequestInfoCache: RequestInfoCache;
	newFetchController: AbortController;
	options: CombinedCallApiExtraOptions;
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

	const handleRequestDeferStrategy = async () => {
		const fetchApi = getFetchImpl(options.customFetchImpl);

		const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

		const requestInstance = new Request(
			options.fullURL as NonNullable<typeof options.fullURL>,
			(isReadableStream(request.body) && !request.duplex
				? { ...request, duplex: "half" }
				: request) as RequestInit
		);

		void toStreamableRequest({
			options,
			request: request as CallApiRequestOptionsForHooks,
			requestInstance: requestInstance.clone(),
		});

		const responsePromise = shouldUsePromiseFromCache
			? prevRequestInfo.responsePromise
			: // eslint-disable-next-line unicorn/no-nested-ternary -- Allow
				isReadableStream(request.body)
				? fetchApi(requestInstance.clone())
				: fetchApi(options.fullURL as NonNullable<typeof options.fullURL>, request as RequestInit);

		$RequestInfoCacheOrNull?.set(dedupeKey, { controller: newFetchController, responsePromise });

		const streamableResponse = toStreamableResponse({
			options,
			request: request as CallApiRequestOptionsForHooks,
			response: await responsePromise,
		});

		return streamableResponse;
	};

	const removeDedupeKeyFromCache = () => $RequestInfoCacheOrNull?.delete(dedupeKey);

	return {
		handleRequestCancelStrategy,
		handleRequestDeferStrategy,
		removeDedupeKeyFromCache,
	};
};
