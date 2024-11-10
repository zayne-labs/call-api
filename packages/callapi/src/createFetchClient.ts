import type {
	BaseCallApiConfig,
	CallApiConfig,
	CallApiExtraOptions,
	GetCallApiResult,
	InterceptorUnion,
	RequestOptions,
	ResultModeUnion,
} from "./types";
import {
	HTTPError,
	defaultRetryCodes,
	defaultRetryMethods,
	executeInterceptors,
	generateRequestKey,
	getResponseData,
	handleInterceptorsMerge,
	isHTTPErrorInstance,
	mergeUrlWithParamsAndQuery,
	resolveErrorResult,
	resolveHeaders,
	resolveSuccessResult,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "./utils/common";
import { createCombinedSignal, createTimeoutSignal } from "./utils/polyfills";
import { isFunction, isObject } from "./utils/typeof";

export const createFetchClient = <
	TBaseData,
	TBaseErrorData = unknown,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
>(
	baseConfig: BaseCallApiConfig<TBaseData, TBaseErrorData, TBaseResultMode> = {}
) => {
	const [baseFetchConfig, baseExtraOptions] = splitBaseConfig(baseConfig);

	const {
		body: baseBody,
		headers: baseHeaders,
		signal: baseSignal,
		...restOfBaseFetchConfig
	} = baseFetchConfig;

	const {
		onError: onBaseError,
		onRequest: onBaseRequest,
		onRequestError: onBaseRequestError,
		onResponse: onBaseResponse,
		onResponseError: onBaseResponseError,
		onSuccess: onBaseSuccess,
		...restOfBaseExtraOptions
	} = baseExtraOptions;

	const requestInfoCache = new Map<
		string | null,
		{ controller: AbortController; responsePromise: Promise<Response> }
	>();

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
	>(
		url: string,
		config: CallApiConfig<TData, TErrorData, TResultMode> = {}
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		type CallApiResult = GetCallApiResult<TData, TErrorData, TResultMode>;

		const [fetchConfig, extraOptions] = splitConfig(config);

		const { body = baseBody, headers, signal = baseSignal, ...restOfFetchConfig } = fetchConfig;

		// prettier-ignore
		const {
			onError,
			onRequest,
			onRequestError,
			onResponse,
			onResponseError,
			onSuccess,
			...restOfExtraOptions
		} = extraOptions;

		// == Default Extra Options
		const defaultOptions = {
			baseURL: "",
			bodySerializer: JSON.stringify,
			dedupeStrategy: "cancel",
			defaultErrorMessage: "Failed to fetch data from server!",
			mergedInterceptorsExecutionMode: "parallel",
			mergeInterceptors: true,
			responseType: "json",
			resultMode: "all",
			retries: 0,
			retryCodes: defaultRetryCodes,
			retryDelay: 0,
			retryMethods: defaultRetryMethods,

			...restOfBaseExtraOptions,
			...restOfExtraOptions,
		} satisfies Omit<CallApiExtraOptions, InterceptorUnion>;

		const interceptors = {
			onError: handleInterceptorsMerge(
				onBaseError,
				onError,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
			onRequest: handleInterceptorsMerge(
				onBaseRequest,
				onRequest,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
			onRequestError: handleInterceptorsMerge(
				onBaseRequestError,
				onRequestError,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
			onResponse: handleInterceptorsMerge(
				onBaseResponse,
				onResponse,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
			onResponseError: handleInterceptorsMerge(
				onBaseResponseError,
				onResponseError,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
			onSuccess: handleInterceptorsMerge(
				onBaseSuccess,
				onSuccess,
				defaultOptions.mergeInterceptors,
				defaultOptions.mergedInterceptorsExecutionMode
			),
		} satisfies Pick<CallApiExtraOptions, InterceptorUnion>;

		const options = {
			...interceptors,
			...defaultOptions,
		};

		const fullUrl = `${options.baseURL}${mergeUrlWithParamsAndQuery(url, options.params, options.query)}`;

		// == Default Request Init
		const defaultRequestOptions = {
			method: "GET",
			// eslint-disable-next-line perfectionist/sort-objects
			body: isObject(body) ? options.bodySerializer(body) : body,

			headers: resolveHeaders({ auth: options.auth, baseHeaders, body, headers }),

			...restOfBaseFetchConfig,
			...restOfFetchConfig,
		} satisfies RequestInit;

		// prettier-ignore
		const shouldHaveRequestKey = options.dedupeStrategy === "cancel" || options.dedupeStrategy === "defer";

		const requestKey =
			options.requestKey ??
			(shouldHaveRequestKey
				? generateRequestKey(fullUrl, { ...defaultRequestOptions, ...options })
				: null);

		// == This is required to leave the smallest window of time for the cache to be updated with the last request info, if all requests with the same key start at the same time
		if (requestKey != null) {
			await waitUntil(0.1);
		}

		// == This ensures cache operations only occur when key is available
		const requestInfoCacheOrNull = requestKey ? requestInfoCache : null;

		const prevRequestInfo = requestInfoCacheOrNull?.get(requestKey);

		if (prevRequestInfo && options.dedupeStrategy === "cancel") {
			const reason = new DOMException(
				`Request aborted as another request to the endpoint: ${url}, with the same request options was initiated.`,
				"AbortError"
			);

			prevRequestInfo.controller.abort(reason);
		}

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(newFetchController.signal, timeoutSignal, signal);

		const requestInit = {
			signal: combinedSignal,
			...defaultRequestOptions,
		} satisfies RequestInit;

		const request = {
			url: fullUrl,
			...requestInit,
		} satisfies RequestOptions;

		try {
			await executeInterceptors(options.onRequest?.({ options, request }));

			// == Incase options.auth was updated in the request interceptor
			requestInit.headers = resolveHeaders({
				auth: options.auth,
				baseHeaders,
				body: request.body,
				headers: request.headers,
			});

			request.headers = requestInit.headers;

			const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

			const responsePromise = shouldUsePromiseFromCache
				? prevRequestInfo.responsePromise
				: fetch(fullUrl, requestInit);

			requestInfoCacheOrNull?.set(requestKey, { controller: newFetchController, responsePromise });

			const response = await responsePromise;

			const shouldRetry =
				!response.ok &&
				!combinedSignal.aborted &&
				options.retries > 0 &&
				options.retryCodes.includes(response.status) &&
				options.retryMethods.includes(requestInit.method);

			if (shouldRetry) {
				await waitUntil(options.retryDelay);

				return await callApi(url, { ...config, retries: options.retries - 1 });
			}

			// == Also clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			// == Also clone response when resultMode is set to "onlyResponse", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse =
				options.dedupeStrategy === "defer" ||
				options.resultMode === "onlyResponse" ||
				options.shouldCloneResponse;

			if (!response.ok) {
				const errorData = await getResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser
				);

				// == Pushing all error handling responsibilities to the catch block
				throw new HTTPError({
					defaultErrorMessage: options.defaultErrorMessage,
					errorData,
					response,
				});
			}

			const successData = await getResponseData<TData>(
				shouldCloneResponse ? response.clone() : response,
				options.responseType,
				options.responseParser
			);

			const validSuccessData = options.responseValidator
				? options.responseValidator(successData)
				: successData;

			await executeInterceptors(
				options.onSuccess?.({
					data: validSuccessData,
					options,
					request,
					response: options.shouldCloneResponse ? response.clone() : response,
				}),

				options.onResponse?.({
					data: validSuccessData,
					errorData: null,
					options,
					request,
					response: options.shouldCloneResponse ? response.clone() : response,
				})
			);

			return resolveSuccessResult<CallApiResult>({
				response,
				resultMode: options.resultMode,
				successData: validSuccessData,
			});

			// == Exhaustive Error handling
		} catch (error) {
			const { generalErrorResult, resolveCustomErrorInfo } = resolveErrorResult<CallApiResult>({
				defaultErrorMessage: options.defaultErrorMessage,
				error,
				resultMode: options.resultMode,
			});

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError({
						error: (generalErrorResult as { error: never }).error,
						options,
						request,
					})
				: options.throwOnError;

			if (shouldThrowOnError) {
				throw error;
			}

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.error(`${error.name}:`, message);

				return resolveCustomErrorInfo({ message });
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const { message, name } = error;

				console.error(`${name}:`, message);

				return generalErrorResult;
			}

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const { errorData, response } = error;

				await executeInterceptors(
					options.onResponseError?.({
						errorData,
						options,
						request,
						response: options.shouldCloneResponse ? response.clone() : response,
					}),

					options.onResponse?.({
						data: null,
						errorData,
						options,
						request,
						response: options.shouldCloneResponse ? response.clone() : response,
					}),

					// == Also call the onError interceptor
					options.onError?.({
						error,
						options,
						request,
						response: options.shouldCloneResponse ? response.clone() : response,
					})
				);

				return generalErrorResult;
			}

			await executeInterceptors(
				// == At this point only the request errors exist, so the request error interceptor is called
				options.onRequestError?.({ error: error as Error, options, request }),

				// == Also call the onError interceptor
				options.onError?.({
					error: (generalErrorResult as { error: never }).error,
					options,
					request,
					response: null,
				})
			);

			return generalErrorResult;

			// == Removing the now unneeded AbortController from store
		} finally {
			requestInfoCacheOrNull?.delete(requestKey);
		}
	};

	callApi.create = createFetchClient;

	return callApi;
};

export const callApi = createFetchClient();
