import { type RequestInfoCache, createDedupeStrategy, getAbortErrorMessage } from "./dedupe";
import { HTTPError } from "./error";
import {
	type ErrorContext,
	type ExecuteHookInfo,
	type RetryContext,
	type SuccessContext,
	executeHooksInCatchBlock,
	executeHooksInTryBlock,
} from "./hooks";
import { type CallApiPlugin, initializePlugins } from "./plugins";
import {
	type ErrorInfo,
	type ResponseTypeUnion,
	type ResultModeUnion,
	getCustomizedErrorResult,
	resolveErrorResult,
	resolveResponseData,
	resolveSuccessResult,
} from "./result";
import { createRetryStrategy } from "./retry";
import type { GetCurrentRouteKey, InferInitURL } from "./types";
import type {
	BaseCallApiConfig,
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiParameters,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CallApiResult,
	CombinedCallApiExtraOptions,
} from "./types/common";
import type { DefaultDataType, DefaultPluginArray, DefaultThrowOnError } from "./types/default-types";
import { getCurrentRouteKey, getFullURL, getMethod, normalizeURL } from "./url";
import {
	createCombinedSignal,
	createTimeoutSignal,
	getBody,
	getHeaders,
	splitBaseConfig,
	splitConfig,
	waitFor,
} from "./utils/common";
import { isFunction, isHTTPErrorInstance, isValidationErrorInstance } from "./utils/guards";
import {
	type BaseCallApiSchema,
	type CallApiSchema,
	type CallApiSchemaConfig,
	type InferSchemaResult,
	handleOptionsValidation,
	handleValidation,
} from "./validation";

export const createFetchClient = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	const TBaseSchema extends BaseCallApiSchema = BaseCallApiSchema,
	const TBaseSchemaConfig extends CallApiSchemaConfig = CallApiSchemaConfig,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
>(
	initBaseConfig: BaseCallApiConfig<
		TBaseData,
		TBaseErrorData,
		TBaseResultMode,
		TBaseThrowOnError,
		TBaseResponseType,
		TBaseSchema,
		TBaseSchemaConfig,
		TBasePluginArray
	> = {} as never
) => {
	const $RequestInfoCache: RequestInfoCache = new Map();

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
		TThrowOnError extends boolean = TBaseThrowOnError,
		TResponseType extends ResponseTypeUnion = TBaseResponseType,
		TSchemaConfig extends CallApiSchemaConfig = TBaseSchemaConfig,
		TInitURL extends InferInitURL<TBaseSchema, TSchemaConfig> = InferInitURL<TBaseSchema, TSchemaConfig>,
		TCurrentRouteKey extends GetCurrentRouteKey<TSchemaConfig, TInitURL> = GetCurrentRouteKey<
			TSchemaConfig,
			TInitURL
		>,
		TSchema extends CallApiSchema = NonNullable<TBaseSchema[TCurrentRouteKey]>,
		TPluginArray extends CallApiPlugin[] = TBasePluginArray,
	>(
		...parameters: CallApiParameters<
			InferSchemaResult<TSchema["data"], TData>,
			InferSchemaResult<TSchema["errorData"], TErrorData>,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TBaseSchema,
			TSchema,
			TBaseSchemaConfig,
			TSchemaConfig,
			TInitURL,
			TCurrentRouteKey,
			TBasePluginArray,
			TPluginArray
		>
	): CallApiResult<
		InferSchemaResult<TSchema["data"], TData>,
		InferSchemaResult<TSchema["errorData"], TErrorData>,
		TResultMode,
		TThrowOnError,
		TResponseType
	> => {
		const [initURLOrURLObject, initConfig = {}] = parameters;

		const [fetchOptions, extraOptions] = splitConfig(initConfig);

		const resolvedBaseConfig = isFunction(initBaseConfig)
			? initBaseConfig({
					initURL: initURLOrURLObject.toString(),
					options: extraOptions,
					request: fetchOptions,
				})
			: initBaseConfig;

		const [baseFetchOptions, baseExtraOptions] = splitBaseConfig(resolvedBaseConfig);

		// == Merged Extra Options
		const mergedExtraOptions = {
			...baseExtraOptions,
			...(baseExtraOptions.skipAutoMergeFor !== "all"
				&& baseExtraOptions.skipAutoMergeFor !== "options"
				&& extraOptions),
		};

		// == Merged Request Options
		const mergedRequestOptions = {
			...baseFetchOptions,
			...(baseExtraOptions.skipAutoMergeFor !== "all"
				&& baseExtraOptions.skipAutoMergeFor !== "request"
				&& fetchOptions),
		} satisfies CallApiRequestOptions;

		const baseConfig = resolvedBaseConfig as BaseCallApiExtraOptions & CallApiRequestOptions;
		const config = initConfig as CallApiExtraOptions & CallApiRequestOptions;

		const { resolvedHooks, resolvedInitURL, resolvedOptions, resolvedRequestOptions } =
			await initializePlugins({
				baseConfig,
				config,
				initURL: initURLOrURLObject.toString(),
				options: mergedExtraOptions as CombinedCallApiExtraOptions,
				request: mergedRequestOptions as CallApiRequestOptionsForHooks,
			});

		const fullURL = getFullURL({
			baseURL: resolvedOptions.baseURL,
			initURL: resolvedInitURL,
			params: resolvedOptions.params,
			query: resolvedOptions.query,
		});

		const resolvedSchemaConfig = isFunction(extraOptions.schemaConfig)
			? extraOptions.schemaConfig({ baseSchemaConfig: baseExtraOptions.schemaConfig ?? {} })
			: (extraOptions.schemaConfig ?? baseExtraOptions.schemaConfig);

		const currentRouteKey = getCurrentRouteKey(resolvedInitURL, resolvedSchemaConfig);

		const routeSchema = baseExtraOptions.schema?.[currentRouteKey];

		const resolvedSchema = isFunction(extraOptions.schema)
			? extraOptions.schema({
					baseSchema: baseExtraOptions.schema ?? {},
					currentRouteSchema: routeSchema ?? {},
				})
			: (extraOptions.schema ?? routeSchema);

		let options = {
			...resolvedOptions,
			...resolvedHooks,

			fullURL,
			initURL: resolvedInitURL,
			initURLNormalized: normalizeURL(resolvedInitURL),
		} satisfies CombinedCallApiExtraOptions;

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(
			resolvedRequestOptions.signal,
			timeoutSignal,
			newFetchController.signal
		);

		let request = {
			...resolvedRequestOptions,
			signal: combinedSignal,
		} satisfies CallApiRequestOptionsForHooks;

		const {
			dedupeStrategy,
			handleRequestCancelStrategy,
			handleRequestDeferStrategy,
			removeDedupeKeyFromCache,
		} = await createDedupeStrategy({
			$RequestInfoCache,
			baseConfig,
			config,
			newFetchController,
			options,
			request,
		});

		try {
			await handleRequestCancelStrategy();

			await executeHooksInTryBlock(options.onRequest?.({ baseConfig, config, options, request }));

			const { extraOptionsValidationResult, requestOptionsValidationResult } =
				await handleOptionsValidation({
					extraOptions: options,
					requestOptions: request,
					schema: resolvedSchema,
					schemaConfig: resolvedSchemaConfig,
				});

			const shouldApplySchemaOutput =
				Boolean(extraOptionsValidationResult)
				|| Boolean(requestOptionsValidationResult)
				|| !resolvedSchemaConfig?.disableValidationOutputApplication;

			if (shouldApplySchemaOutput) {
				options = {
					...options,
					...extraOptionsValidationResult,
				};
			}

			const validBody = getBody({
				body: shouldApplySchemaOutput ? requestOptionsValidationResult?.body : request.body,
				bodySerializer: options.bodySerializer,
			});

			const validHeaders = await getHeaders({
				auth: options.auth,
				baseHeaders: request.headers,
				body: request.body,
				headers: shouldApplySchemaOutput ? requestOptionsValidationResult?.headers : request.headers,
			});

			const validMethod = getMethod({
				initURL: resolvedInitURL,
				method: shouldApplySchemaOutput ? requestOptionsValidationResult?.method : request.method,
				schemaConfig: resolvedSchemaConfig,
			});

			request = {
				...request,
				...(Boolean(validBody) && { body: validBody }),
				...(Boolean(validHeaders) && { headers: validHeaders }),
				...(Boolean(validMethod) && { method: validMethod }),
			};

			const response = await handleRequestDeferStrategy(options, request);

			// == Also clone response when dedupeStrategy is set to "defer" or when onRequestStream is set, to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = dedupeStrategy === "defer" || options.cloneResponse;

			if (!response.ok) {
				const errorData = await resolveResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser
				);

				const validErrorData = await handleValidation(resolvedSchema?.errorData, {
					inputValue: errorData,
					response,
					schemaConfig: resolvedSchemaConfig,
				});

				// == Push all error handling responsibilities to the catch block if not retrying
				throw new HTTPError(
					{
						defaultErrorMessage: options.defaultErrorMessage,
						errorData: validErrorData,
						response,
					},
					{ cause: validErrorData }
				);
			}

			const successData = await resolveResponseData<TData>(
				shouldCloneResponse ? response.clone() : response,
				options.responseType,
				options.responseParser
			);

			const validSuccessData = await handleValidation(resolvedSchema?.data, {
				inputValue: successData,
				response,
				schemaConfig: resolvedSchemaConfig,
			});

			const successContext = {
				baseConfig,
				config,
				data: validSuccessData,
				options,
				request,
				response,
			} satisfies SuccessContext<unknown>;

			await executeHooksInTryBlock(
				options.onSuccess?.(successContext),

				options.onResponse?.({ ...successContext, error: null })
			);

			const successResult = resolveSuccessResult(successContext.data, {
				response: successContext.response,
				resultMode: options.resultMode,
			});

			return successResult as never;

			// == Exhaustive Error handling
		} catch (error) {
			const errorInfo = {
				cloneResponse: options.cloneResponse,
				defaultErrorMessage: options.defaultErrorMessage,
				resultMode: options.resultMode,
			} satisfies ErrorInfo;

			const generalErrorResult = resolveErrorResult(error, errorInfo);

			const errorContext = {
				baseConfig,
				config,
				error: generalErrorResult?.error as never,
				options,
				request,
				response: generalErrorResult?.response as never,
			} satisfies ErrorContext<unknown>;

			const shouldThrowOnError = isFunction(options.throwOnError)
				? options.throwOnError(errorContext)
				: options.throwOnError;

			const hookInfo = {
				errorInfo,
				shouldThrowOnError,
			} satisfies ExecuteHookInfo;

			const handleRetryOrGetErrorResult = async () => {
				const { currentAttemptCount, getDelay, shouldAttemptRetry } =
					createRetryStrategy(errorContext);

				const shouldRetry = !combinedSignal.aborted && (await shouldAttemptRetry());

				if (shouldRetry) {
					const retryContext = {
						...errorContext,
						retryAttemptCount: currentAttemptCount,
					} satisfies RetryContext<unknown>;

					const hookError = await executeHooksInCatchBlock(
						[options.onRetry?.(retryContext)],
						hookInfo
					);

					if (hookError) {
						return hookError;
					}

					const delay = getDelay();

					await waitFor(delay);

					const updatedOptions = {
						...config,
						"~retryAttemptCount": currentAttemptCount + 1,
					} satisfies typeof config;

					return callApi(initURLOrURLObject as never, updatedOptions as never) as never;
				}

				if (shouldThrowOnError) {
					throw error;
				}

				return generalErrorResult;
			};

			if (isHTTPErrorInstance<TErrorData>(error)) {
				const hookError = await executeHooksInCatchBlock(
					[
						options.onResponseError?.(errorContext),
						options.onError?.(errorContext),
						options.onResponse?.({ ...errorContext, data: null }),
					],
					hookInfo
				);

				return (hookError ?? (await handleRetryOrGetErrorResult())) as never;
			}

			if (isValidationErrorInstance(error)) {
				const hookError = await executeHooksInCatchBlock(
					[
						options.onValidationError?.(errorContext),
						options.onRequestError?.(errorContext),
						options.onError?.(errorContext),
					],
					hookInfo
				);

				return (hookError ?? (await handleRetryOrGetErrorResult())) as never;
			}

			let message: string | undefined = (error as Error | undefined)?.message;

			if (error instanceof DOMException && error.name === "AbortError") {
				message = getAbortErrorMessage(options.dedupeKey, options.fullURL);

				!shouldThrowOnError && console.error(`${error.name}:`, message);
			}

			if (error instanceof DOMException && error.name === "TimeoutError") {
				message = `Request timed out after ${options.timeout}ms`;

				!shouldThrowOnError && console.error(`${error.name}:`, message);
			}

			const hookError = await executeHooksInCatchBlock(
				[options.onRequestError?.(errorContext), options.onError?.(errorContext)],
				hookInfo
			);

			return (hookError
				?? getCustomizedErrorResult(await handleRetryOrGetErrorResult(), { message })) as never;

			// == Removing the now unneeded AbortController from store
		} finally {
			removeDedupeKeyFromCache();
		}
	};

	return callApi;
};

export const callApi = createFetchClient();
