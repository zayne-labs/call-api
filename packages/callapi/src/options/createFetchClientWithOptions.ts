import { createFetchClient } from "@/createFetchClient";
import { type RequestInfoCache, createDedupeStrategy } from "@/dedupe";
import { HTTPError, resolveErrorResult } from "@/error";
import { type CallApiPlugin, hooksEnum, initializePlugins } from "@/plugins";
import { type ResponseTypeUnion, resolveResponseData, resolveSuccessResult } from "@/response";
import { createRetryStrategy } from "@/retry";
import type {
	BaseCallApiExtraOptions,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
	ErrorContext,
	GetCallApiResult,
	Interceptors,
	ResultModeUnion,
	SuccessContext,
} from "@/types/common";
import type {
	DefaultDataType,
	DefaultMoreOptions,
	DefaultPluginArray,
	DefaultThrowOnError,
} from "@/types/default-types";
import { mergeUrlWithParamsAndQuery } from "@/url";
import {
	combineHooks,
	executeHooks,
	mergeAndResolveHeaders,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "@/utils/common";
import { defaultRetryMethods, defaultRetryStatusCodes } from "@/utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "@/utils/polyfills";
import { isFunction, isHTTPErrorInstance, isPlainObject } from "@/utils/type-guards";
import {
	type CallApiSchemas,
	type InferSchemaResult,
	createExtensibleSchemasAndValidators,
	handleValidation,
} from "@/validation";
import type { CallApiExtraOptionsWithRequiredURL } from "./types";

export const createFetchClientWithOptions = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
>(
	baseConfig?: BaseCallApiExtraOptions<
		TBaseData,
		TBaseErrorData,
		TBaseResultMode,
		TBaseThrowOnError,
		TBaseResponseType,
		TBasePluginArray,
		TBaseSchemas
	>
) => {
	const [baseFetchOptions, baseExtraOptions] = splitBaseConfig(baseConfig ?? {});

	const $RequestInfoCache: RequestInfoCache = new Map();

	const callApi = async <
		TData = InferSchemaResult<TBaseSchemas["data"], TBaseData>,
		TErrorData = InferSchemaResult<TBaseSchemas["errorData"], TBaseErrorData>,
		TResultMode extends ResultModeUnion = TBaseResultMode,
		TThrowOnError extends boolean = TBaseThrowOnError,
		TResponseType extends ResponseTypeUnion = TBaseResponseType,
		TSchemas extends CallApiSchemas = TBaseSchemas,
		TPluginArray extends CallApiPlugin[] = TBasePluginArray,
	>(
		config: CallApiExtraOptionsWithRequiredURL<
			TData,
			TErrorData,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TPluginArray,
			TSchemas
		>
	): Promise<
		GetCallApiResult<
			InferSchemaResult<TSchemas["data"], TData>,
			InferSchemaResult<TSchemas["errorData"], TErrorData>,
			TResultMode,
			TThrowOnError,
			TResponseType
		>
	> => {
		const { initURL } = config;

		const [fetchOptions, extraOptions] = splitConfig(config);

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
			mergedHooksExecutionOrder: "mainHooksAfterPlugins",
			responseType: "json",
			resultMode: "all",
			retryAttempts: 0,
			retryDelay: 1000,
			retryMaxDelay: 10000,
			retryMethods: defaultRetryMethods,
			retryStatusCodes: defaultRetryStatusCodes,
			retryStrategy: "linear",

			...baseExtraOptions,
			...extraOptions,

			...initCombinedHooks,
		} satisfies CombinedCallApiExtraOptions;

		const body = fetchOptions.body ?? baseFetchOptions.body;

		// == Default Request Options
		const defaultRequestOptions = {
			...baseFetchOptions,
			...fetchOptions,

			body: isPlainObject(body) ? defaultExtraOptions.bodySerializer(body) : body,

			headers: mergeAndResolveHeaders({
				auth: defaultExtraOptions.auth,
				baseHeaders: baseFetchOptions.headers,
				body,
				headers: fetchOptions.headers,
			}),

			signal: fetchOptions.signal ?? baseFetchOptions.signal,
		} satisfies CallApiRequestOptions;

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			initURL,
			options: defaultExtraOptions,
			request: defaultRequestOptions,
		});

		const fullURL = `${resolvedOptions.baseURL}${mergeUrlWithParamsAndQuery(url, resolvedOptions.params, resolvedOptions.query)}`;

		const options = {
			...resolvedOptions,
			...resolvedHooks,
			fullURL,
			initURL: initURL.toString(),
		} satisfies CombinedCallApiExtraOptions as typeof defaultExtraOptions & typeof resolvedHooks;

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(
			resolvedRequestOptions.signal,
			timeoutSignal,
			newFetchController.signal
		);

		const request = {
			...resolvedRequestOptions,
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
				baseHeaders: baseFetchOptions.headers,
				body,
				headers: request.headers,
			});

			const response = await handleRequestDeferStrategy();

			// == Also clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = options.dedupeStrategy === "defer" || options.cloneResponse;

			const { schemas, validators } = createExtensibleSchemasAndValidators(options);

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

			const { getDelay, shouldAttemptRetry } = createRetryStrategy(options, errorContext);

			const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

			if (shouldRetry) {
				await executeHooks(options.onRetry(errorContext));

				const delay = getDelay();

				await waitUntil(delay);

				const updatedOptions = {
					...config,
					"~retryCount": (options["~retryCount"] ?? 0) + 1,
				} satisfies typeof config as typeof config;

				return await callApi(updatedOptions);
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
				await executeHooks(
					options.onResponseError(errorContext),

					options.onError(errorContext),

					options.onResponse({ ...errorContext, data: null })
				);

				handleThrowOnError();

				return getErrorResult();
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const { message, name } = error;

				console.error(`${name}:`, message);

				handleThrowOnError();

				return getErrorResult();
			}

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				console.error(`${error.name}:`, message);

				handleThrowOnError();

				return getErrorResult({ message });
			}

			await executeHooks(
				// == At this point only the request errors exist, so the request error interceptor is called
				options.onRequestError(errorContext as never),

				// == Also call the onError interceptor
				options.onError(errorContext)
			);

			handleThrowOnError();

			return getErrorResult();

			// == Removing the now unneeded AbortController from store
		} finally {
			removeDedupeKeyFromCache();
		}
	};

	callApi.create = createFetchClient;

	return callApi;
};
export const callApiWithOptions = createFetchClientWithOptions();
