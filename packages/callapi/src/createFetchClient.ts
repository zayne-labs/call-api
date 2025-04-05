import { type RequestInfoCache, createDedupeStrategy } from "./dedupe";
import { HTTPError, resolveErrorResult } from "./error";
import { type CallApiPlugin, type PluginInitContext, hooksEnum, initializePlugins } from "./plugins";
import { type ResponseTypeUnion, resolveResponseData, resolveSuccessResult } from "./response";
import { createRetryStrategy } from "./retry";
import type {
	BaseCallApiConfig,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResult,
	CombinedCallApiExtraOptions,
	ErrorContext,
	Interceptors,
	ResultModeUnion,
	SuccessContext,
} from "./types/common";
import type {
	DefaultDataType,
	DefaultMoreOptions,
	DefaultPluginArray,
	DefaultThrowOnError,
} from "./types/default-types";
import { mergeUrlWithParamsAndQuery } from "./url";
import {
	combineHooks,
	executeHooks,
	mergeAndResolveHeaders,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "./utils/common";
import { defaultExtraOptions, defaultRequestOptions } from "./utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "./utils/polyfills";
import { isFunction, isHTTPErrorInstance, isSerializable } from "./utils/type-guards";
import {
	type CallApiSchemas,
	type InferSchemaResult,
	createExtensibleSchemasAndValidators,
	handleValidation,
} from "./validation";

export const createFetchClient = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
>(
	baseConfig: BaseCallApiConfig<
		TBaseData,
		TBaseErrorData,
		TBaseResultMode,
		TBaseThrowOnError,
		TBaseResponseType,
		TBasePluginArray,
		TBaseSchemas
	> = {} as never
) => {
	const $RequestInfoCache: RequestInfoCache = new Map();

	const callApi = async <
		TData = InferSchemaResult<TBaseSchemas["data"], TBaseData>,
		TErrorData = InferSchemaResult<TBaseSchemas["errorData"], TBaseErrorData>,
		TResultMode extends ResultModeUnion = TBaseResultMode,
		TThrowOnError extends boolean = TBaseThrowOnError,
		TResponseType extends ResponseTypeUnion = TBaseResponseType,
		TPluginArray extends CallApiPlugin[] = TBasePluginArray,
		TSchemas extends CallApiSchemas = TBaseSchemas,
	>(
		...parameters: CallApiParameters<
			TData,
			TErrorData,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TPluginArray,
			TSchemas
		>
	): CallApiResult<
		InferSchemaResult<TSchemas["data"], TData>,
		InferSchemaResult<TSchemas["errorData"], TErrorData>,
		TResultMode,
		TThrowOnError,
		TResponseType
	> => {
		const [initURL, config = {} as never] = parameters;

		const [fetchOptions, extraOptions] = splitConfig(config);

		const resolvedBaseConfig = isFunction(baseConfig)
			? baseConfig({
					initURL: initURL.toString(),
					options: extraOptions,
					request: fetchOptions,
				})
			: baseConfig;

		const [baseFetchOptions, baseExtraOptions] = splitBaseConfig(resolvedBaseConfig);

		const initCombinedHooks = {} as Required<Interceptors>;

		for (const key of Object.keys(hooksEnum)) {
			const combinedHook = combineHooks(
				baseExtraOptions[key as keyof Interceptors],
				extraOptions[key as keyof Interceptors]
			);

			initCombinedHooks[key as keyof Interceptors] = combinedHook as never;
		}

		// == Merged Extra Options
		const mergedExtraOptions = {
			...defaultExtraOptions,
			...baseExtraOptions,
			...extraOptions,
		};

		// == Merged Request Options
		const mergedRequestOptions = {
			...defaultRequestOptions,
			...baseFetchOptions,
			...fetchOptions,
		} satisfies CallApiRequestOptions;

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			baseConfig: resolvedBaseConfig as PluginInitContext["config"],
			config: config as PluginInitContext["config"],
			initURL,
			options: mergedExtraOptions,
			request: mergedRequestOptions,
		});

		const fullURL = `${resolvedOptions.baseURL}${mergeUrlWithParamsAndQuery(url, resolvedOptions.params, resolvedOptions.query)}`;

		// FIXME -  Consider adding an option for refetching a callApi request
		const options = {
			...resolvedOptions,
			...resolvedHooks,
			fullURL,
			initURL: initURL.toString(),
		} satisfies CombinedCallApiExtraOptions as typeof mergedExtraOptions & typeof resolvedHooks;

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(
			resolvedRequestOptions.signal,
			timeoutSignal,
			newFetchController.signal
		);

		const request = {
			...resolvedRequestOptions,

			body: isSerializable(resolvedRequestOptions.body)
				? options.bodySerializer(resolvedRequestOptions.body)
				: resolvedRequestOptions.body,

			headers: mergeAndResolveHeaders({
				auth: options.auth,
				baseHeaders: baseFetchOptions.headers,
				body: resolvedRequestOptions.body,
				headers: fetchOptions.headers,
			}),

			signal: combinedSignal,
		} satisfies CallApiRequestOptionsForHooks;

		const { handleRequestCancelStrategy, handleRequestDeferStrategy, removeDedupeKeyFromCache } =
			await createDedupeStrategy({ $RequestInfoCache, newFetchController, options, request });

		await handleRequestCancelStrategy();

		try {
			await executeHooks(options.onRequest({ options, request }));

			// == Apply determined headers again after onRequest incase they were modified
			request.headers = mergeAndResolveHeaders({
				auth: options.auth,
				body: request.body,
				headers: request.headers,
			});

			const response = await handleRequestDeferStrategy();

			const { schemas, validators } = createExtensibleSchemasAndValidators(options);

			// == Also clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = options.dedupeStrategy === "defer" || options.cloneResponse;

			if (!response.ok) {
				const errorData = await resolveResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser
				);

				const validErrorData = await handleValidation(
					errorData,
					schemas?.errorData,
					validators?.errorData
				);

				// == Push all error handling responsibilities to the catch block if not retrying
				throw new HTTPError({
					defaultErrorMessage: options.defaultErrorMessage,
					errorData: validErrorData,
					response,
				});
			}

			const successData = await resolveResponseData<TData>(
				shouldCloneResponse ? response.clone() : response,
				options.responseType,
				options.responseParser
			);

			const validSuccessData = await handleValidation(successData, schemas?.data, validators?.data);

			const successContext = {
				data: validSuccessData,
				options,
				request,
				response: options.cloneResponse ? response.clone() : response,
			} satisfies SuccessContext<unknown>;

			await executeHooks(
				options.onSuccess(successContext),

				options.onResponse({ ...successContext, error: null })
			);

			return await resolveSuccessResult({
				data: successContext.data,
				response: successContext.response,
				resultMode: options.resultMode,
			});

			// == Exhaustive Error handling
		} catch (error) {
			const { apiDetails, getErrorResult } = resolveErrorResult({
				cloneResponse: options.cloneResponse,
				defaultErrorMessage: options.defaultErrorMessage,
				error,
				resultMode: options.resultMode,
			});

			const errorContext = {
				error: apiDetails.error as never,
				options,
				request,
				response: apiDetails.response as never,
			} satisfies ErrorContext<unknown>;

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError(errorContext)
				: options.throwOnError;

			// eslint-disable-next-line unicorn/consistent-function-scoping -- False alarm: this function is depends on this scope
			const handleThrowOnError = (errorObject: unknown) => {
				if (!shouldThrowOnError) return;

				throw errorObject;
			};

			// FIXME: Handle this nested mess later
			// eslint-disable-next-line unicorn/consistent-function-scoping -- False alarm: this function is depends on this scope
			const handleRetryAndGetResult = async (customInfo: { message?: string } = {}): Promise<never> => {
				const { getDelay, shouldAttemptRetry } = createRetryStrategy(errorContext);

				const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

				if (shouldRetry) {
					try {
						await executeHooks(options.onRetry(errorContext));
					} catch (innerError) {
						const { apiDetails: innerApiDetails, getErrorResult: getInnerErrorResult } =
							resolveErrorResult({
								cloneResponse: options.cloneResponse,
								defaultErrorMessage: options.defaultErrorMessage,
								error: innerError,
								resultMode: options.resultMode,
							});

						handleThrowOnError(innerApiDetails.error);

						return getInnerErrorResult();
					}

					const delay = getDelay();

					await waitUntil(delay);

					const updatedOptions = {
						...config,
						"~retryCount": (options["~retryCount"] ?? 0) + 1,
					} satisfies typeof config;

					return callApi(initURL, updatedOptions as never) as never;
				}

				handleThrowOnError(apiDetails.error);

				return customInfo.message ? getErrorResult(customInfo) : getErrorResult();
			};

			if (isHTTPErrorInstance<TErrorData>(error)) {
				await executeHooks(
					options.onResponseError(errorContext),

					options.onError(errorContext),

					options.onResponse({ ...errorContext, data: null })
				);

				return await handleRetryAndGetResult();
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const { message, name } = error;

				console.error(`${name}:`, message);

				return await handleRetryAndGetResult();
			}

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.error(`${error.name}:`, message);

				return await handleRetryAndGetResult({ message });
			}

			await executeHooks(
				// == At this point only the request errors exist, so the request error interceptor is called
				options.onRequestError(errorContext as never),

				// == Also call the onError interceptor
				options.onError(errorContext)
			);

			return await handleRetryAndGetResult();

			// == Removing the now unneeded AbortController from store
		} finally {
			removeDedupeKeyFromCache();
		}
	};

	return callApi;
};

export const callApi = createFetchClient();
