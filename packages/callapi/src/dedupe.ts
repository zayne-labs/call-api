import { dedupeDefaults } from "./constants/default-options";
import type { SharedHookContext } from "./hooks";
import { toStreamableRequest, toStreamableResponse } from "./stream";
import { getFetchImpl, waitFor } from "./utils/common";
import { isReadableStream } from "./utils/guards";

type RequestInfo = {
	controller: AbortController;
	responsePromise: Promise<Response>;
};

export type RequestInfoCache = Map<string | null, RequestInfo>;

type DedupeContext = SharedHookContext & {
	$RequestInfoCache: RequestInfoCache;
	newFetchController: AbortController;
};

export const getAbortErrorMessage = (
	dedupeKey: DedupeContext["options"]["dedupeKey"],
	fullURL: DedupeContext["options"]["fullURL"]
) => {
	return dedupeKey
		? `Duplicate request detected - Aborting previous request with key '${dedupeKey}' as a new request was initiated`
		: `Duplicate request detected - Aborting previous request to '${fullURL}' as a new request with identical options was initiated`;
};

export const createDedupeStrategy = async (context: DedupeContext) => {
	const {
		$RequestInfoCache,
		baseConfig,
		config,
		newFetchController,
		options: globalOptions,
		request: globalRequest,
	} = context;

	const dedupeStrategy = globalOptions.dedupeStrategy ?? dedupeDefaults.dedupeStrategy;

	const generateDedupeKey = () => {
		const shouldHaveDedupeKey = dedupeStrategy === "cancel" || dedupeStrategy === "defer";

		if (!shouldHaveDedupeKey) {
			return null;
		}

		return `${globalOptions.fullURL}-${JSON.stringify({ options: globalOptions, request: globalRequest })}`;
	};

	const dedupeKey = globalOptions.dedupeKey ?? generateDedupeKey();

	// == This is to ensure cache operations only occur when key is available
	const $RequestInfoCacheOrNull = dedupeKey !== null ? $RequestInfoCache : null;

	/******
	 * == Add a small delay to the execution to ensure proper request deduplication when multiple requests with the same key start simultaneously.
	 * == This gives time for the cache to be updated with the previous request info before the next request checks it.
	 ******/
	if (dedupeKey !== null) {
		await waitFor(0.1);
	}

	const prevRequestInfo = $RequestInfoCacheOrNull?.get(dedupeKey);

	const handleRequestCancelStrategy = () => {
		const shouldCancelRequest = prevRequestInfo && dedupeStrategy === "cancel";

		if (!shouldCancelRequest) return;

		const message = getAbortErrorMessage(globalOptions.dedupeKey, globalOptions.fullURL);

		const reason = new DOMException(message, "AbortError");

		prevRequestInfo.controller.abort(reason);

		// == Adding this just so that eslint forces me put await when calling the function (it looks better that way tbh)
		return Promise.resolve();
	};

	const handleRequestDeferStrategy = async (
		options: DedupeContext["options"],
		request: DedupeContext["request"]
	) => {
		const fetchApi = getFetchImpl(options.customFetchImpl);

		const shouldUsePromiseFromCache = prevRequestInfo && dedupeStrategy === "defer";

		const requestObjectForStream = isReadableStream(request.body)
			? { ...request, duplex: request.duplex ?? "half" }
			: request;

		const requestInstance = new Request(
			options.fullURL as NonNullable<typeof options.fullURL>,
			requestObjectForStream as RequestInit
		);

		await toStreamableRequest({
			baseConfig,
			config,
			options,
			request,
			requestInstance: requestInstance.clone(),
		});

		const getFetchApiPromise = () => {
			if (isReadableStream(request.body)) {
				return fetchApi(requestInstance.clone());
			}

			return fetchApi(options.fullURL as NonNullable<typeof options.fullURL>, request as RequestInit);
		};

		const responsePromise = shouldUsePromiseFromCache
			? prevRequestInfo.responsePromise
			: getFetchApiPromise();

		$RequestInfoCacheOrNull?.set(dedupeKey, { controller: newFetchController, responsePromise });

		const streamableResponse = toStreamableResponse({
			baseConfig,
			config,
			options,
			request,
			response: await responsePromise,
		});

		return streamableResponse;
	};

	const removeDedupeKeyFromCache = () => {
		$RequestInfoCacheOrNull?.delete(dedupeKey);
	};

	return {
		dedupeStrategy,
		handleRequestCancelStrategy,
		handleRequestDeferStrategy,
		removeDedupeKeyFromCache,
	};
};
