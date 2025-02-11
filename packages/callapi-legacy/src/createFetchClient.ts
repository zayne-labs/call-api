import { type RequestInfoCache, createDedupeStrategy } from "./dedupe";
import { HTTPError, resolveErrorResult } from "./error";
import { type CallApiPlugin, type DefaultPlugins, hooksEnum, initializePlugins } from "./plugins";
import { type ResponseTypeUnion, resolveResponseData, resolveSuccessResult } from "./response";
import { createRetryStrategy } from "./retry";
import type {
	BaseCallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
	DefaultDataType,
	DefaultMoreOptions,
	GetCallApiResult,
	Interceptors,
	ResultModeUnion,
} from "./types/common";
import { mergeUrlWithParamsAndQuery } from "./url";
import {
	combineHooks,
	executeHooks,
	mergeAndResolveHeaders,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "./utils/common";
import { defaultRetryMethods, defaultRetryStatusCodes } from "./utils/constants";
import { createCombinedSignal, createTimeoutSignal } from "./utils/polyfills";
import { isFunction, isHTTPErrorInstance, isPlainObject } from "./utils/type-guards";
import {
	type CallApiSchemas,
	type InferSchemaResult,
	createExtensibleSchemasAndValidators,
} from "./validation";

export const createFetchClient = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
	TBasePluginArray extends CallApiPlugin[] = DefaultPlugins,
	TBaseComputedData = InferSchemaResult<TBaseSchemas["data"], TBaseData>,
	TBaseComputedErrorData = InferSchemaResult<TBaseSchemas["errorData"], TBaseErrorData>,
>(
	baseConfig?: BaseCallApiExtraOptions<
		TBaseData,
		TBaseErrorData,
		TBaseResultMode,
		TBaseSchemas,
		TBasePluginArray,
		TBaseResponseType
	>
) => {
	const [baseFetchOptions, baseExtraOptions] = splitBaseConfig(baseConfig ?? {});

	const $RequestInfoCache: RequestInfoCache = new Map();

	const callApi = async <
		TData = TBaseComputedData,
		TErrorData = TBaseComputedErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
		TResponseType extends ResponseTypeUnion = TBaseResponseType,
		TSchemas extends CallApiSchemas = TBaseSchemas,
		TPluginArray extends CallApiPlugin[] = TBasePluginArray,
		TComputedData = InferSchemaResult<TSchemas["data"], TData>,
		TComputedErrorData = InferSchemaResult<TSchemas["errorData"], TErrorData>,
	>(
		...parameters: CallApiParameters<
			TData,
			TErrorData,
			TResultMode,
			TSchemas,
			TPluginArray,
			TResponseType
		>
	): Promise<GetCallApiResult<TComputedData, TComputedErrorData, TResultMode, TBaseResponseType>> => {
		const [initURL, config = {} as never] = parameters;

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
			body: isPlainObject(body) ? defaultExtraOptions.bodySerializer(body) : body,

			...baseFetchOptions,
			...fetchOptions,

			headers: mergeAndResolveHeaders({
				auth: defaultExtraOptions.auth,
				baseHeaders: baseFetchOptions.headers,
				body,
				headers: fetchOptions.headers,
			}),

			signal: fetchOptions.signal ?? baseFetchOptions.signal,
		} satisfies CallApiRequestOptions;

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			initURL: initURL as string,
			options: defaultExtraOptions,
			request: defaultRequestOptions,
		});

		const fullURL = `${resolvedOptions.baseURL}${mergeUrlWithParamsAndQuery(url, resolvedOptions.params, resolvedOptions.query)}`;

		const options = {
			...resolvedOptions,
			...resolvedHooks,
			fullURL,
			initURL: initURL as string,
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

		const {
			handleRequestCancelDedupeStrategy,
			handleRequestDeferDedupeStrategy,
			removeDedupeKeyFromCache,
		} = await createDedupeStrategy({ $RequestInfoCache, newFetchController, options, request });

		handleRequestCancelDedupeStrategy();

		try {
			await executeHooks(options.onRequest({ options, request }));

			// == Apply determined headers again after onRequest incase they were modified
			request.headers = mergeAndResolveHeaders({
				auth: options.auth,
				baseHeaders: baseFetchOptions.headers,
				body,
				headers: request.headers,
			});

			const response = await handleRequestDeferDedupeStrategy();

			// == Also clone response when dedupeStrategy is set to "defer", to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = options.dedupeStrategy === "defer" || options.cloneResponse;

			const { schemas, validators } = createExtensibleSchemasAndValidators(options);

			if (!response.ok) {
				const errorData = await resolveResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser,
					schemas?.errorData,
					validators?.errorData
				);

				// == Push all error handling responsibilities to the catch block if not retrying
				throw new HTTPError({
					defaultErrorMessage: options.defaultErrorMessage,
					errorData,
					response,
				});
			}

			const successData = await resolveResponseData<TData>(
				shouldCloneResponse ? response.clone() : response,
				options.responseType,
				options.responseParser,
				schemas?.data,
				validators?.data
			);

			const successContext = {
				data: successData as never,
				options,
				request,
				response: options.cloneResponse ? response.clone() : response,
			};

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
			const { errorVariantDetails, getErrorResult } = resolveErrorResult({
				cloneResponse: options.cloneResponse,
				defaultErrorMessage: options.defaultErrorMessage,
				error,
				resultMode: options.resultMode,
			});

			const errorContext = {
				error: errorVariantDetails.error as never,
				options,
				request,
			};

			const errorContextWithResponse = {
				...errorContext,
				response: errorVariantDetails.response as NonNullable<typeof errorVariantDetails.response>,
			};

			const { getDelay, shouldAttemptRetry } = createRetryStrategy(options, errorContextWithResponse);

			const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

			if (shouldRetry) {
				await executeHooks(options.onRetry(errorContextWithResponse));

				const delay = getDelay();

				await waitUntil(delay);

				const updatedOptions = {
					...config,
					"~retryCount": (options["~retryCount"] ?? 0) + 1,
				} satisfies typeof config as typeof config;

				return await callApi(initURL, updatedOptions);
			}

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError(errorContextWithResponse)
				: options.throwOnError;

			// eslint-disable-next-line unicorn/consistent-function-scoping -- False alarm: this function is depends on this scope
			const handleThrowOnError = () => {
				if (!shouldThrowOnError) return;

				// eslint-disable-next-line ts-eslint/only-throw-error -- It's fine to throw this
				throw errorVariantDetails.error;
			};

			if (isHTTPErrorInstance<TErrorData>(error)) {
				await executeHooks(
					options.onResponseError(errorContextWithResponse),

					options.onError(errorContextWithResponse),

					options.onResponse({ ...errorContextWithResponse, data: null })
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
				options.onRequestError(errorContext),

				// == Also call the onError interceptor
				options.onError(errorContextWithResponse)
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

export const callApi = createFetchClient();
