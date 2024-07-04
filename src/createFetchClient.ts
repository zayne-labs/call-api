import { isFormData, isObject, isString } from "./typeof";
import type {
	$RequestOptions,
	AbortSignalWithAny,
	BaseConfig,
	ExtraOptions,
	FetchConfig,
	GetCallApiResult,
	PossibleErrorObject,
	ResultModeUnion,
} from "./types";
import {
	$resolveErrorResult,
	HTTPError,
	defaultRetryCodes,
	defaultRetryMethods,
	getResponseData,
	isHTTPErrorInstance,
	mergeUrlWithParams,
	objectifyHeaders,
	resolveSuccessResult,
	splitConfig,
	waitUntil,
} from "./utils";

export const createFetchClient = <
	TBaseData,
	TBaseErrorData,
	TBaseResultMode extends ResultModeUnion = undefined,
>(
	baseConfig?: BaseConfig<TBaseData, TBaseErrorData, TBaseResultMode>
) => {
	const abortControllerStore = new Map<string, AbortController>();

	const [baseFetchConfig, baseExtraOptions] = splitConfig(baseConfig ?? {});

	const {
		headers: baseHeaders,
		body: baseBody,
		signal: baseSignal,
		...restOfBaseFetchConfig
	} = baseFetchConfig;

	/* eslint-disable complexity */
	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
	>(
		url: string,
		config?: FetchConfig<TData, TErrorData, TResultMode>
	): Promise<GetCallApiResult<TData, TErrorData, TResultMode>> => {
		type CallApiResult = GetCallApiResult<TData, TErrorData, TResultMode>;

		const [fetchConfig, extraOptions] = splitConfig(config ?? {});

		/** Default Options */
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

		const { signal = baseSignal, body = baseBody, headers, ...restOfFetchConfig } = fetchConfig;

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

			// == Return undefined if the following conditions are not met (so that native fetch would auto set the correct headers):
			// - headers are provided
			// - The body is an object
			// - The auth option is provided
			headers:
				baseHeaders || headers || options.auth || isObject(body)
					? {
							...(isObject(body) && {
								"Content-Type": "application/json",
								Accept: "application/json",
							}),
							...(isFormData(body) && {
								"Content-Type": "multipart/form-data",
							}),
							...(isString(body) && {
								"Content-Type": "application/x-www-form-urlencoded",
							}),
							...(isString(options.auth) && {
								Authorization: `Bearer ${options.auth}`,
							}),
							...(isObject(options.auth) && {
								Authorization:
									"bearer" in options.auth
										? `Bearer ${options.auth.bearer}`
										: `Token ${options.auth.token}`,
							}),
							...objectifyHeaders(baseHeaders),
							...objectifyHeaders(headers),
						}
					: undefined,

			...restOfBaseFetchConfig,
			...restOfFetchConfig,
		} satisfies $RequestOptions;

		try {
			await options.onRequest?.({ request: requestInit, options });

			const response = await fetch(
				`${options.baseURL}${mergeUrlWithParams(url, options.query)}`,
				requestInit
			);

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

			if (!response.ok) {
				const errorData = await getResponseData<TErrorData>(
					response.clone(),
					options.responseType,
					options.responseParser
				);

				// == Pushing all error handling responsibilities to the catch block
				throw new HTTPError({
					response: Object.assign(response.clone(), { errorData }),
					defaultErrorMessage: options.defaultErrorMessage,
				});
			}

			const successData = await getResponseData<TData>(
				response.clone(),
				options.responseType,
				options.responseParser
			);

			const validSuccessData = options.responseValidator
				? options.responseValidator(successData)
				: successData;

			await options.onResponse?.({
				// == Workaround as opposed to using the spread operator, as it doesn't work on the response object. So using Object.assign instead on a clone of the response object.
				response: Object.assign(response.clone(), { data: validSuccessData }),
				request: requestInit,
				options,
			});

			return resolveSuccessResult<CallApiResult>({ successData: validSuccessData, response, options });

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
					response: error.response,
					request: requestInit,
					options,
				});

				return resolveErrorResult({
					errorData,
					message: (errorData as PossibleErrorObject)?.message,
					response,
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

	callApi.cancel = (url: string) => abortControllerStore.get(url)?.abort();

	return callApi;
};

export const callApi = createFetchClient();
