import { isFormData, isObject, isString } from "./typeof";
import type {
	$RequestOptions,
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
	TBaseErrorData = unknown,
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

		const { signal = baseSignal, body = baseBody, headers, ...restOfFetchConfig } = fetchConfig;

		// == Default Options
		const options = {
			bodySerializer: JSON.stringify,
			responseType: "json",
			baseURL: "",
			retries: 0,
			retryDelay: 0,
			retryCodes: defaultRetryCodes,
			retryMethods: defaultRetryMethods,
			defaultErrorMessage: "Failed to fetch data from server!",
			...baseExtraOptions,
			...extraOptions,
		} satisfies ExtraOptions;

		const prevFetchController = abortControllerStore.get(url);

		if (prevFetchController && options.cancelRedundantRequests) {
			const reason = new DOMException(
				`Automatic cancelation of the previous unfinished request to this same url: ${url}`,
				"AbortError"
			);
			prevFetchController.abort(reason);
		}

		const newFetchController = new AbortController();

		abortControllerStore.set(url, newFetchController);

		const timeoutSignal = options.timeout ? AbortSignal.timeout(options.timeout) : null;

		const combinedSignal = AbortSignal.any([
			newFetchController.signal,
			...(timeoutSignal ? [timeoutSignal] : []),
			...(signal ? [signal] : []),
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
					options.cloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser
				);

				await options.onResponseError?.({
					response: options.cloneResponse ? response.clone() : response,
					errorData,
					request: requestInit,
					options,
				});

				// == Pushing all error handling responsibilities to the catch block
				throw new HTTPError({
					errorData,
					response,
					defaultErrorMessage: options.defaultErrorMessage,
				});
			}

			const successData = await getResponseData<TData>(
				options.cloneResponse ? response.clone() : response,
				options.responseType,
				options.responseParser
			);

			const validSuccessData = options.responseValidator
				? options.responseValidator(successData)
				: successData;

			await options.onResponse?.({
				response: options.cloneResponse ? response.clone() : response,
				data: validSuccessData,
				request: requestInit,
				options,
			});

			return resolveSuccessResult<CallApiResult>({ successData: validSuccessData, response, options });

			// == Exhaustive Error handling
		} catch (error) {
			const resolveErrorResult = $resolveErrorResult<CallApiResult>({ error, options });

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.error(`${error.name}:`, message);

				return resolveErrorResult({ message });
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const message = `Request aborted due to ${error.message}`;

				console.error(`${error.name}:`, message);

				return resolveErrorResult({ message });
			}

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const { errorData, response } = error;

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

	callApi.cancel = (url: string, reason?: unknown) => {
		reason ? abortControllerStore.get(url)?.abort(reason) : abortControllerStore.get(url)?.abort();
	};

	return callApi;
};

export const callApi = createFetchClient();
