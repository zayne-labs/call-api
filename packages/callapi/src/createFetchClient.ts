import { type RequestInfoCache, createDedupeStrategy } from "./dedupe";
import { HTTPError, resolveErrorResult } from "./error";
import { type ErrorContext, type SuccessContext, executeHooks } from "./hooks";
import { type CallApiPlugin, initializePlugins } from "./plugins";
import { type ResponseTypeUnion, resolveResponseData, resolveSuccessResult } from "./response";
import { createRetryStrategy } from "./retry";
import type {
	BaseCallApiConfig,
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResult,
	CombinedCallApiExtraOptions,
	ResultModeUnion,
} from "./types/common";
import type {
	DefaultDataType,
	DefaultMoreOptions,
	DefaultPluginArray,
	DefaultThrowOnError,
} from "./types/default-types";
import { mergeUrlWithParamsAndQuery } from "./url";
import {
	createCombinedSignal,
	createTimeoutSignal,
	mergeAndResolveHeaders,
	splitBaseConfig,
	splitConfig,
	waitUntil,
} from "./utils/common";
import { defaultExtraOptions, defaultRequestOptions } from "./utils/constants";
import { isFunction, isHTTPErrorInstance, isSerializable } from "./utils/guards";
import { type CallApiSchemas, type InferSchemaResult, handleValidation } from "./validation";

export const createFetchClient = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
	TBaseSchemas extends CallApiSchemas = DefaultMoreOptions,
>(
	initBaseConfig: BaseCallApiConfig<
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
		const [initURL, initConfig = {}] = parameters;

		const [fetchOptions, extraOptions] = splitConfig(initConfig);

		const resolvedBaseConfig = isFunction(initBaseConfig)
			? initBaseConfig({ initURL: initURL.toString(), options: extraOptions, request: fetchOptions })
			: initBaseConfig;

		const [baseFetchOptions, baseExtraOptions] = splitBaseConfig(resolvedBaseConfig);

		// == Merged Extra Options
		const mergedExtraOptions = {
			...defaultExtraOptions,
			...baseExtraOptions,
			...(baseExtraOptions.skipAutoMergeFor !== "all"
				&& baseExtraOptions.skipAutoMergeFor !== "options"
				&& extraOptions),
		};

		// == Merged Request Options
		const mergedRequestOptions = {
			...defaultRequestOptions,
			...baseFetchOptions,
			...(baseExtraOptions.skipAutoMergeFor !== "all"
				&& baseExtraOptions.skipAutoMergeFor !== "request"
				&& fetchOptions),
		} satisfies CallApiRequestOptions;

		const baseConfig = resolvedBaseConfig as BaseCallApiExtraOptions & CallApiRequestOptions;
		const config = initConfig as CallApiExtraOptions & CallApiRequestOptions;

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			baseConfig,
			config,
			initURL,
			options: mergedExtraOptions as CombinedCallApiExtraOptions,
			request: mergedRequestOptions as CallApiRequestOptionsForHooks,
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
			await createDedupeStrategy({
				$RequestInfoCache,
				baseConfig,
				config,
				newFetchController,
				options,
				request,
			});

		await handleRequestCancelStrategy();

		try {
			await executeHooks(options.onRequest?.({ baseConfig, config, options, request }));

			// == Apply determined headers again after onRequest incase they were modified
			request.headers = mergeAndResolveHeaders({
				auth: options.auth,
				body: request.body,
				headers: request.headers,
			});

			const response = await handleRequestDeferStrategy();

			// == Also clone response when dedupeStrategy is set to "defer" or when onRequestStream is set, to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = options.dedupeStrategy === "defer" || options.cloneResponse;

			const schemas = (
				isFunction(options.schemas)
					? options.schemas({ baseSchemas: baseExtraOptions.schemas ?? {} })
					: options.schemas
			) as CallApiSchemas | undefined;

			const validators = isFunction(options.validators)
				? options.validators({ baseValidators: baseExtraOptions.validators ?? {} })
				: options.validators;

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
				// eslint-disable-next-line ts-eslint/only-throw-error -- This is intended
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
				baseConfig,
				config,
				data: validSuccessData,
				options,
				request,
				response,
			} satisfies SuccessContext<unknown>;

			await executeHooks(
				options.onSuccess?.(successContext),

				options.onResponse?.({ ...successContext, error: null })
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
				baseConfig,
				config,
				error: apiDetails.error as never,
				options,
				request,
				response: apiDetails.response as never,
			} satisfies ErrorContext<unknown>;

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError(errorContext)
				: options.throwOnError;

			const handleRetryOrGetResult = async (customInfo?: { message?: string }) => {
				const { executeRetryHook, getDelay, shouldAttemptRetry } = createRetryStrategy(errorContext);

				const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

				if (shouldRetry) {
					await executeRetryHook(shouldThrowOnError);

					const delay = getDelay();

					await waitUntil(delay);

					const updatedOptions = {
						...config,
						"~retryCount": (options["~retryCount"] ?? 0) + 1,
					} satisfies typeof config;

					return callApi(initURL, updatedOptions as never) as never;
				}

				if (shouldThrowOnError) {
					throw error;
				}

				return customInfo ? getErrorResult(customInfo) : getErrorResult();
			};

			if (isHTTPErrorInstance<TErrorData>(error)) {
				await executeHooks(
					options.onResponseError?.(errorContext),

					options.onError?.(errorContext),

					options.onResponse?.({ ...errorContext, data: null })
				);

				return await handleRetryOrGetResult();
			}

			if (error instanceof DOMException && error.name === "AbortError") {
				const { message, name } = error;

				!shouldThrowOnError && console.error(`${name}:`, message);

				return await handleRetryOrGetResult();
			}

			if (error instanceof DOMException && error.name === "TimeoutError") {
				const message = `Request timed out after ${options.timeout}ms`;

				!shouldThrowOnError && console.error(`${error.name}:`, message);

				return await handleRetryOrGetResult({ message });
			}

			await executeHooks(
				// == At this point only the request errors exist, so the request error hook is called
				options.onRequestError?.(errorContext as never),

				// == Also call the onError hook
				options.onError?.(errorContext)
			);

			return await handleRetryOrGetResult();

			// == Removing the now unneeded AbortController from store
		} finally {
			removeDedupeKeyFromCache();
		}
	};

	return callApi;
};

export const callApi = createFetchClient();
