import { createFetchClient } from "@/createFetchClient";
import { initializePlugins } from "@/plugins";
import type {
	BaseCallApiConfig,
	CallApiConfigWithRequiredURL,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
	GetCallApiResult,
	PossibleHTTPError,
	PossibleJavaScriptError,
	ResultModeUnion,
} from "@/types";
import { mergeUrlWithParamsAndQuery } from "@/url";
import {
	HTTPError,
	executeInterceptors,
	generateRequestKey,
	getFetchImpl,
	getHeaders,
	getResponseData,
	isHTTPErrorInstance,
	resolveErrorResult,
	resolveSuccessResult,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "@/utils/common";
import { defaultRetryCodes, defaultRetryMethods } from "@/utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "@/utils/polyfills";
import { isFunction, isPlainObject } from "@/utils/typeof";

export const createFetchClientWithOptions = <
	TBaseData = unknown,
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

	const requestInfoCache = new Map<
		string | null,
		{ controller: AbortController; responsePromise: Promise<Response> }
	>();

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
	>(
		config: CallApiConfigWithRequiredURL<TBaseData, TBaseErrorData, TBaseResultMode>
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		type CallApiResult = never;

		const [fetchConfig, extraOptions] = splitConfig(config);

		const { body = baseBody, headers, signal = baseSignal, ...restOfFetchConfig } = fetchConfig;

		const { interceptors, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			initUrl: config.url,
			options: { ...baseExtraOptions, ...extraOptions },
			request: { ...restOfBaseFetchConfig, ...restOfFetchConfig },
		});

		// == Default Extra Options
		const defaultOptions = {
			baseURL: "",
			bodySerializer: JSON.stringify,
			dedupeStrategy: "cancel",
			defaultErrorMessage: "Failed to fetch data from server!",
			mergedInterceptorsExecutionMode: "parallel",
			mergedInterceptorsExecutionOrder: "mainInterceptorLast",
			responseType: "json",
			resultMode: "all",
			retries: 0,
			retryCodes: defaultRetryCodes,
			retryDelay: 0,
			retryMethods: defaultRetryMethods,

			...resolvedOptions,
			...interceptors,
		} satisfies CombinedCallApiExtraOptions;

		const defaultRequestOptions = {
			body: isPlainObject(body) ? defaultOptions.bodySerializer(body) : body,

			headers: getHeaders({ auth: defaultOptions.auth, baseHeaders, body, headers }),

			method: "GET",

			...resolvedRequestOptions,
		} satisfies CallApiRequestOptions;

		// == Default Request Init

		const options = {
			...defaultOptions,
			url,
		} satisfies CombinedCallApiExtraOptions;

		const fullURL = `${options.baseURL}${mergeUrlWithParamsAndQuery(url, options.params, options.query)}`;

		// prettier-ignore
		const shouldHaveRequestKey = options.dedupeStrategy === "cancel" || options.dedupeStrategy === "defer";

		const requestKey =
			options.requestKey ??
			generateRequestKey(fullURL, { shouldHaveRequestKey, ...resolvedRequestOptions, ...options });

		// == This is required to leave the smallest window of time for the cache to be updated with the last request info, if all requests with the same key start at the same time
		if (requestKey != null) {
			await waitUntil(0.1);
		}

		// == This ensures cache operations only occur when key is available
		const requestInfoCacheOrNull = requestKey != null ? requestInfoCache : null;

		const prevRequestInfo = requestInfoCacheOrNull?.get(requestKey);

		if (prevRequestInfo && options.dedupeStrategy === "cancel") {
			const message = options.requestKey
				? `Request aborted as another request with the same request key: '${requestKey}' was initiated while the current request was in progress.`
				: `Request aborted as another request to the endpoint: '${fullURL}', with the same request options was initiated while the current request was in progress.`;

			const reason = new DOMException(message, "AbortError");

			prevRequestInfo.controller.abort(reason);
		}

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(newFetchController.signal, timeoutSignal, signal);

		const requestInit = {
			signal: combinedSignal,
			...defaultRequestOptions,
		} satisfies CallApiRequestOptions;

		const request = { fullURL, ...requestInit } satisfies CallApiRequestOptionsForHooks;

		const fetch = getFetchImpl(options.customFetchImpl);

		try {
			await executeInterceptors(options.onRequest({ options, request }));

			// == Incase options.auth was updated in the request interceptor
			requestInit.headers = getHeaders({
				auth: options.auth,
				baseHeaders,
				body: request.body,
				headers: request.headers,
			});

			request.headers = requestInit.headers;

			const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

			const responsePromise = shouldUsePromiseFromCache
				? prevRequestInfo.responsePromise
				: fetch(fullURL, requestInit as RequestInit);

			requestInfoCacheOrNull?.set(requestKey, { controller: newFetchController, responsePromise });

			const response = await responsePromise;

			const shouldRetry =
				!response.ok &&
				!combinedSignal.aborted &&
				options.retries > 0 &&
				options.retryCodes.includes(response.status) &&
				options.retryMethods.includes(request.method);

			if (shouldRetry) {
				await waitUntil(options.retryDelay);

				return await callApi({ ...config, retries: options.retries - 1 });
			}

			// == Clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			// == Also clone response when resultMode is set to "onlyResponse", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse =
				options.dedupeStrategy === "defer" ||
				options.resultMode === "onlyResponse" ||
				options.cloneResponse;

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
				options.responseParser,
				options.responseValidator
			);

			await executeInterceptors(
				options.onSuccess({
					data: successData,
					options,
					request,
					response: options.cloneResponse ? response.clone() : response,
				}),

				options.onResponse({
					data: successData,
					error: null,
					options,
					request,
					response: options.cloneResponse ? response.clone() : response,
				})
			);

			return resolveSuccessResult<CallApiResult>({
				data: successData,
				response,
				resultMode: options.resultMode,
			});

			// == Exhaustive Error handling
		} catch (error) {
			const { apiDetails, generalErrorResult, resolveCustomErrorInfo } =
				resolveErrorResult<CallApiResult>({
					defaultErrorMessage: options.defaultErrorMessage,
					error,
					resultMode: options.resultMode,
				});

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError({
						error: apiDetails.error,
						options,
						request,
					})
				: options.throwOnError;

			// eslint-disable-next-line unicorn/consistent-function-scoping
			const handleThrowOnError = () => {
				if (!shouldThrowOnError) return;

				throw apiDetails.error as Error;
			};

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.error(`${error.name}:`, message);

				handleThrowOnError();

				return resolveCustomErrorInfo({ message });
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const { message, name } = error;

				console.error(`${name}:`, message);

				handleThrowOnError();

				return generalErrorResult;
			}

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const { response } = error;

				const possibleHttpError = (generalErrorResult as { error: PossibleHTTPError<TErrorData> })
					.error;

				await executeInterceptors(
					options.onResponseError({
						error: possibleHttpError,
						options,
						request,
						response: options.cloneResponse ? response.clone() : response,
					}),

					options.onResponse({
						data: null,
						error: possibleHttpError,
						options,
						request,
						response: options.cloneResponse ? response.clone() : response,
					}),

					// == Also call the onError interceptor
					options.onError({
						error: possibleHttpError,
						options,
						request,
						response: options.cloneResponse ? response.clone() : response,
					})
				);

				handleThrowOnError();

				return generalErrorResult;
			}

			const possibleJavascriptError = (generalErrorResult as { error: PossibleJavaScriptError }).error;

			await executeInterceptors(
				// == At this point only the request errors exist, so the request error interceptor is called
				options.onRequestError({
					error: possibleJavascriptError,
					options,
					request,
				}),

				// == Also call the onError interceptor
				options.onError({
					error: possibleJavascriptError,
					options,
					request,
					response: null,
				})
			);

			handleThrowOnError();

			return generalErrorResult;

			// == Removing the now unneeded AbortController from store
		} finally {
			requestInfoCacheOrNull?.delete(requestKey);
		}
	};

	callApi.create = createFetchClient;

	return callApi;
};

export const callApiWithOptions = createFetchClientWithOptions();
