import { createFetchClient } from "@/createFetchClient";
import { initializePlugins } from "@/plugins";
import type {
	BaseCallApiConfig,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResultModeUnion,
	CombinedCallApiExtraOptions,
	GetCallApiResult,
	PossibleHTTPError,
	PossibleJavaScriptError,
} from "@/types";
import { mergeUrlWithParamsAndQuery } from "@/url";
import {
	HTTPError,
	executeHooks,
	flattenHooks,
	generateRequestKey,
	getFetchImpl,
	getResponseData,
	isHTTPErrorInstance,
	mergeAndResolveHeaders,
	resolveErrorResult,
	resolveSuccessResult,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "@/utils/common";
import { defaultRetryCodes, defaultRetryMethods } from "@/utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "@/utils/polyfills";
import { isFunction, isPlainObject } from "@/utils/type-guards";
import type { CallApiConfigWithRequiredURL } from "./types";

export const createFetchClientWithOptions = <
	TBaseData = unknown,
	TBaseErrorData = unknown,
	TBaseResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
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
		TResultMode extends CallApiResultModeUnion = TBaseResultMode,
	>(
		configWithRequiredURL: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		const { initURL, ...config } = configWithRequiredURL;

		type CallApiResult = never;

		const [fetchConfig, extraOptions] = splitConfig(config);

		const { body = baseBody, headers, signal = baseSignal, ...restOfFetchConfig } = fetchConfig;

		// == Default Extra Options
		const defaultExtraOptions = {
			baseURL: "",
			bodySerializer: JSON.stringify,
			dedupeStrategy: "cancel",
			defaultErrorMessage: "Failed to fetch data from server!",
			mergedInterceptorsExecutionMode: "parallel",
			mergedInterceptorsExecutionOrder: "mainInterceptorLast",
			responseType: "json",
			resultMode: "all",
			retryAttempts: 0,
			retryCodes: defaultRetryCodes,
			retryDelay: 0,
			retryMethods: defaultRetryMethods,

			...baseExtraOptions,
			...extraOptions,

			onError: flattenHooks(baseExtraOptions.onError, extraOptions.onError),
			onRequest: flattenHooks(baseExtraOptions.onRequest, extraOptions.onRequest),
			onRequestError: flattenHooks(baseExtraOptions.onRequestError, extraOptions.onRequestError),
			onResponse: flattenHooks(baseExtraOptions.onResponse, extraOptions.onResponse),
			onResponseError: flattenHooks(baseExtraOptions.onResponseError, extraOptions.onResponseError),
			onSuccess: flattenHooks(baseExtraOptions.onSuccess, extraOptions.onSuccess),
		} satisfies CombinedCallApiExtraOptions;

		const { interceptors, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			initURL,
			options: defaultExtraOptions,
			request: { ...restOfBaseFetchConfig, ...restOfFetchConfig },
		});

		const options = {
			...resolvedOptions,
			...interceptors,
			initURL,
		} satisfies CombinedCallApiExtraOptions as typeof defaultExtraOptions & typeof interceptors;

		// == Default Request Options
		const defaultRequestOptions = {
			body: isPlainObject(body) ? options.bodySerializer(body) : body,
			method: "GET",

			...resolvedRequestOptions,
		} satisfies CallApiRequestOptions;

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
				? `Duplicate request detected - Aborting previous request with key '${requestKey}' as a new request was initiated`
				: `Duplicate request detected - Aborting previous request to '${fullURL}' as a new request with identical options was initiated`;

			const reason = new DOMException(message, "AbortError");

			prevRequestInfo.controller.abort(reason);
		}

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(newFetchController.signal, timeoutSignal, signal);

		const request = {
			fullURL,
			signal: combinedSignal,
			...defaultRequestOptions,
		} satisfies CallApiRequestOptionsForHooks;

		const fetch = getFetchImpl(options.customFetchImpl);

		try {
			await executeHooks(options.onRequest({ options, request }));

			// == Apply determined headers
			request.headers = mergeAndResolveHeaders({
				auth: options.auth,
				baseHeaders: baseHeaders ?? headers,
				body,
				headers: request.headers,
			});

			const shouldUsePromiseFromCache = prevRequestInfo && options.dedupeStrategy === "defer";

			const responsePromise = shouldUsePromiseFromCache
				? prevRequestInfo.responsePromise
				: fetch(fullURL, request as RequestInit);

			requestInfoCacheOrNull?.set(requestKey, { controller: newFetchController, responsePromise });

			const response = await responsePromise;

			const shouldRetry =
				!response.ok &&
				!combinedSignal.aborted &&
				options.retryAttempts > 0 &&
				options.retryCodes.includes(response.status) &&
				options.retryMethods.includes(request.method);

			if (shouldRetry) {
				await waitUntil(options.retryDelay);

				return await callApi({ ...configWithRequiredURL, retryAttempts: options.retryAttempts - 1 });
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
					options.responseParser,
					options.responseErrorValidator
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

			await executeHooks(
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
						error: apiDetails.error as never,
						options,
						request,
						response: apiDetails.response,
					})
				: options.throwOnError;

			// eslint-disable-next-line unicorn/consistent-function-scoping -- This error is wrong cause the function is using some variables within the catch block
			const handleThrowOnError = () => {
				if (!shouldThrowOnError) return;

				throw apiDetails.error as Error;
			};

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const { response } = error;

				const possibleHttpError = (generalErrorResult as { error: PossibleHTTPError<TErrorData> })
					.error;

				await executeHooks(
					options.onResponseError({
						error: possibleHttpError,
						options,
						request,
						response: options.cloneResponse ? response.clone() : response,
					}),

					options.onError({
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
					})
				);

				handleThrowOnError();

				return generalErrorResult;
			}

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

			const possibleJavascriptError = (generalErrorResult as { error: PossibleJavaScriptError }).error;

			await executeHooks(
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
