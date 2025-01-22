import {
	type RequestInfoCache,
	generateDedupeKey,
	handleRequestCancelDedupe,
	handleRequestDeferDedupe,
} from "./dedupe";
import { hooksEnum, initializePlugins } from "./plugins";
import { createRetryStrategy } from "./retry";
import type {
	BaseCallApiConfig,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResultModeUnion,
	CombinedCallApiExtraOptions,
	GetCallApiResult,
	Interceptors,
	PossibleHTTPError,
	PossibleJavaScriptError,
} from "./types";
import { mergeUrlWithParamsAndQuery } from "./url";
import {
	HTTPError,
	combineHooks,
	executeHooks,
	getResponseData,
	isHTTPErrorInstance,
	mergeAndResolveHeaders,
	resolveErrorResult,
	resolveSuccessResult,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "./utils/common";
import { defaultRetryCodes, defaultRetryMethods } from "./utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "./utils/polyfills";
import { isFunction, isPlainObject } from "./utils/type-guards";

export const createFetchClient = <
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

	const requestInfoCache = new Map() satisfies RequestInfoCache;

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends CallApiResultModeUnion = TBaseResultMode,
	>(
		...parameters: CallApiParameters<TData, TErrorData, TResultMode>
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		const [initURL, config] = parameters;

		const [fetchConfig, extraOptions] = splitConfig(config ?? {});

		const { body = baseBody, headers, signal = baseSignal, ...restOfFetchConfig } = fetchConfig;

		const initCombinedHooks = {} as Required<Interceptors>;

		for (const key of Object.keys(hooksEnum)) {
			const combinedHook = combineHooks(
				baseExtraOptions[key as keyof Interceptors],
				extraOptions[key as keyof Interceptors]
			);

			initCombinedHooks[key as keyof Interceptors] = combinedHook as never;
		}

		// == Default Extra Options
		const defaultExtraOptions = {
			baseURL: "",
			bodySerializer: JSON.stringify,
			dedupeStrategy: "cancel",
			defaultErrorMessage: "Failed to fetch data from server!",
			mergedHooksExecutionMode: "parallel",
			mergedHooksExecutionOrder: "mainHooksLast",
			responseType: "json",
			resultMode: "all",
			retryAttempts: 0,
			retryCodes: defaultRetryCodes,
			retryDelay: 1000,
			retryMaxDelay: 10000,
			retryMethods: defaultRetryMethods,
			retryStrategy: "linear",

			...baseExtraOptions,
			...extraOptions,

			...initCombinedHooks,
		} satisfies CombinedCallApiExtraOptions;

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			initURL,
			options: defaultExtraOptions,
			request: { ...restOfBaseFetchConfig, ...restOfFetchConfig },
		});

		const options = {
			...resolvedOptions,
			...resolvedHooks,
			initURL,
		} satisfies CombinedCallApiExtraOptions as typeof defaultExtraOptions & typeof resolvedHooks;

		// == Default Request Options
		const defaultRequestOptions = {
			body: isPlainObject(body) ? options.bodySerializer(body) : body,
			method: "GET",

			...resolvedRequestOptions,
		} satisfies CallApiRequestOptions;

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(newFetchController.signal, timeoutSignal, signal);

		const fullURL = `${options.baseURL}${mergeUrlWithParamsAndQuery(url, options.params, options.query)}`;

		const request = {
			...defaultRequestOptions,
			fullURL,
			signal: combinedSignal,
		} satisfies CallApiRequestOptionsForHooks;

		const dedupeKey = options.dedupeKey ?? generateDedupeKey(fullURL, request, options);

		// == This tiny delay is required to leave the smallest window of time for the cache to be updated with the last request info, if all requests with the same key are concurrent
		if (dedupeKey !== null) {
			await waitUntil(0.1);
		}

		// == This ensures cache operations only occur when key is available
		const requestInfoCacheOrNull = dedupeKey !== null ? requestInfoCache : null;

		const prevRequestInfo = requestInfoCacheOrNull?.get(dedupeKey);

		handleRequestCancelDedupe(fullURL, options, prevRequestInfo);

		try {
			await executeHooks(options.onRequest({ options, request }));

			// == Apply determined headers after onRequest incase they were modified
			request.headers = mergeAndResolveHeaders({
				auth: options.auth,
				baseHeaders: baseHeaders ?? headers,
				body,
				headers: request.headers,
			});

			const responsePromise = handleRequestDeferDedupe(fullURL, options, request, prevRequestInfo);

			requestInfoCacheOrNull?.set(dedupeKey, { controller: newFetchController, responsePromise });

			const response = await responsePromise;

			// == Clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = options.dedupeStrategy === "defer" || options.cloneResponse;

			if (!response.ok) {
				const errorData = await getResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser,
					options.responseErrorValidator
				);

				// == Push all error handling responsibilities to the catch block if not retrying
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

			return await resolveSuccessResult({
				data: successData,
				response,
				resultMode: options.resultMode,
			});

			// == Exhaustive Error handling
		} catch (error) {
			const { apiDetails, generalErrorResult, resolveCustomErrorInfo } = resolveErrorResult({
				defaultErrorMessage: options.defaultErrorMessage,
				error,
				resultMode: options.resultMode,
			});

			const errorContext = {
				error: apiDetails.error as never,
				options,
				request,
				response: apiDetails.response,
			};

			const { getDelay, shouldAttemptRetry } = createRetryStrategy(options, errorContext);

			const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

			if (shouldRetry) {
				await executeHooks(options.onRetry(errorContext));

				const delay = getDelay();

				await waitUntil(delay);

				return await callApi(initURL, {
					...config,
					retryCount: (options.retryCount ?? 0) + 1,
				});
			}

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError(errorContext)
				: options.throwOnError;

			// eslint-disable-next-line unicorn/consistent-function-scoping -- False alarm: this function is depends on this scope
			const handleThrowOnError = () => {
				if (!shouldThrowOnError) return;

				// eslint-disable-next-line ts-eslint/only-throw-error -- It's fine to throw this
				throw apiDetails.error;
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
			requestInfoCacheOrNull?.delete(dedupeKey);
		}
	};

	callApi.create = createFetchClient;

	return callApi;
};

export const callApi = createFetchClient();
