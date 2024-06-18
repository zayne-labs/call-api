import { isFormData, isObject } from "./type-helpers";
import type {
	$RequestConfig,
	AbortSignalWithAny,
	BaseConfig,
	ExtraOptions,
	FetchConfig,
	GetCallApiResult,
	PossibleErrorObject,
	ResultStyleUnion,
} from "./types";
import {
	$resolveErrorResult,
	HTTPError,
	defaultRetryCodes,
	defaultRetryMethods,
	getResponseData,
	isHTTPErrorInfo,
	isHTTPErrorInstance,
	mergeUrlWithParams,
	objectifyHeaders,
	resolveSuccessResult,
	splitConfig,
	wait,
} from "./utils";

const createFetchClient = <
	TBaseData,
	TBaseErrorData,
	TBaseResultMode extends ResultStyleUnion = undefined,
>(
	baseConfig?: BaseConfig<TBaseData, TBaseErrorData, TBaseResultMode>
) => {
	const abortControllerStore = new Map<string, AbortController>();

	const [baseFetchConfig, baseExtraOptions] = splitConfig(baseConfig ?? {});

	const { headers: baseHeaders, signal: baseSignal, ...restOfBaseFetchConfig } = baseFetchConfig;

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultStyleUnion = TBaseResultMode,
	>(
		url: string,
		config?: FetchConfig<TData, TErrorData, TResultMode>
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		// == This type is used to cast all return statements due to a design limitation in ts.
		// LINK - See https://www.zhenghao.io/posts/type-functions for more info
		type CallApiResult = GetCallApiResult<TData, TErrorData, TResultMode>;

		const [fetchConfig, extraOptions] = splitConfig(config ?? {});

		const options = {
			bodySerializer: JSON.stringify,
			responseType: "json",
			baseURL: "",
			retries: 0,
			retryDelay: 0,
			retryCodes: defaultRetryCodes,
			retryMethods: defaultRetryMethods,
			defaultErrorMessage: "Failed to fetch data from server!",
			cancelRedundantRequests: true,
			...baseExtraOptions,
			...extraOptions,
		} satisfies ExtraOptions;

		const { signal = baseSignal, body, headers, ...restOfFetchConfig } = fetchConfig;

		const prevFetchController = abortControllerStore.get(url);

		if (prevFetchController && options.cancelRedundantRequests) {
			const reason = new DOMException("Cancelled the previous unfinished request", "AbortError");
			prevFetchController.abort(reason);
		}

		const newFetchController = new AbortController();

		abortControllerStore.set(url, newFetchController);

		const timeoutSignal = options.timeout ? AbortSignal.timeout(options.timeout) : null;

		// FIXME - Remove this type cast once TS updates its lib-dom types for AbortSignal to include the any() method
		const combinedSignal = (AbortSignal as AbortSignalWithAny).any([
			newFetchController.signal,
			timeoutSignal ?? newFetchController.signal,
			signal ?? newFetchController.signal,
		]);

		const requestInit = {
			signal: combinedSignal,

			method: "GET",

			body: isObject(body) ? options.bodySerializer(body) : body,

			// == Return undefined if there are no headers provided or if the body is not an object
			headers:
				baseHeaders || headers || isObject(body)
					? {
							...(isObject(body) && {
								"Content-Type": "application/json",
								Accept: "application/json",
							}),
							...(isFormData(body) && {
								"Content-Type": "multipart/form-data",
							}),
							...objectifyHeaders(baseHeaders),
							...objectifyHeaders(headers),
						}
					: undefined,

			...restOfBaseFetchConfig,
			...restOfFetchConfig,
		} satisfies $RequestConfig;

		try {
			await options.onRequest?.({ request: requestInit, options });

			const response = await fetch(
				`${options.baseURL}${mergeUrlWithParams(url, options.query)}`,
				requestInit
			);

			const shouldRetry =
				!combinedSignal.aborted &&
				options.retries !== 0 &&
				!response.ok &&
				options.retryCodes.includes(response.status) &&
				options.retryMethods.includes(requestInit.method);

			if (shouldRetry) {
				await wait(options.retryDelay);

				return await callApi(url, { ...config, retries: options.retries - 1 });
			}

			if (!response.ok) {
				const errorData = await getResponseData<TErrorData>(
					response,
					options.responseType,
					options.responseParser
				);

				// == Pushing all error handling responsibilities to the catch block
				throw new HTTPError({
					response: { ...response, errorData },
					defaultErrorMessage: options.defaultErrorMessage,
				});
			}

			const successData = await getResponseData<TData>(
				response,
				options.responseType,
				options.responseParser
			);

			await options.onResponse?.({
				response: { ...response.clone(), data: successData },
				request: requestInit,
				options,
			});

			return resolveSuccessResult<CallApiResult>({ successData, response: response.clone(), options });

			// == Exhaustive Error handling
		} catch (error) {
			const resolveErrorResult = $resolveErrorResult<CallApiResult>({ error, options });

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.info(`%cTimeoutError: ${message}`, "color: red; font-weight: 500; font-size: 14px;");
				console.trace("TimeoutError");

				return resolveErrorResult({ message });
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const message = `Request was cancelled`;

				console.info(`%AbortError: ${message}`, "color: red; font-weight: 500; font-size: 14px;");
				console.trace("AbortError");

				return resolveErrorResult({ message });
			}

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const { errorData, ...response } = error.response;

				await options.onResponseError?.({
					response: { ...response.clone(), errorData },
					request: requestInit,
					options,
				});

				return resolveErrorResult({
					errorData,
					response: response.clone(),
					message: (errorData as PossibleErrorObject)?.message,
				});
			}

			// == At this point only the request errors exist, so the request error interceptor is called
			await options.onRequestError?.({ request: requestInit, error: error as Error, options });

			return resolveErrorResult();

			// == Removing the now unneeded AbortController from store
		} finally {
			abortControllerStore.delete(url);
		}
	};

	callApi.create = createFetchClient;
	callApi.isHTTPErrorInfo = isHTTPErrorInfo;
	callApi.isHTTPErrorInstance = isHTTPErrorInstance;
	callApi.cancel = (url: string) => abortControllerStore.get(url)?.abort();

	return callApi;
};

const callApi = createFetchClient();

export default callApi;
