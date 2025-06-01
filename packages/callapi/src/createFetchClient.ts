import { commonDefaults, requestOptionDefaults } from "./constants/default-options";
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
import { getMainURL, getMethodFromURL } from "./url";
import {
	createCombinedSignal,
	createTimeoutSignal,
	getHeaders,
	splitBaseConfig,
	splitConfig,
	waitFor,
} from "./utils/common";
import {
	isFunction,
	isHTTPErrorInstance,
	isSerializable,
	isValidationErrorInstance,
} from "./utils/guards";
import {
	type BaseCallApiSchema,
	type CallApiSchema,
	type CallApiSchemaConfig,
	type InferSchemaResult,
	type SchemaShape,
	handleValidation,
} from "./validation";

export const createFetchClient = <
	TBaseData = DefaultDataType,
	TBaseErrorData = DefaultDataType,
	TBaseResultMode extends ResultModeUnion = ResultModeUnion,
	TBaseThrowOnError extends boolean = DefaultThrowOnError,
	TBaseResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	const TBaseSchema extends BaseCallApiSchema = BaseCallApiSchema,
	TBasePluginArray extends CallApiPlugin[] = DefaultPluginArray,
>(
	initBaseConfig: BaseCallApiConfig<
		TBaseData,
		TBaseErrorData,
		TBaseResultMode,
		TBaseThrowOnError,
		TBaseResponseType,
		TBasePluginArray,
		TBaseSchema
	> = {} as never
) => {
	const $RequestInfoCache: RequestInfoCache = new Map();

	const callApi = async <
		TData = TBaseData,
		TErrorData = TBaseErrorData,
		TResultMode extends ResultModeUnion = TBaseResultMode,
		TThrowOnError extends boolean = TBaseThrowOnError,
		TResponseType extends ResponseTypeUnion = TBaseResponseType,
		const TSchemaConfig extends CallApiSchemaConfig = NonNullable<TBaseSchema["config"]>,
		TInitURL extends InferInitURL<TBaseSchema, TSchemaConfig> = InferInitURL<TBaseSchema, TSchemaConfig>,
		TCurrentRouteKey extends GetCurrentRouteKey<TSchemaConfig, TInitURL> = GetCurrentRouteKey<
			TSchemaConfig,
			TInitURL
		>,
		TComputedRouteSchema extends SchemaShape = NonNullable<TBaseSchema["routes"][TCurrentRouteKey]>,
		TSchema extends CallApiSchema = Omit<SchemaShape, keyof TComputedRouteSchema> & TComputedRouteSchema,
		TPluginArray extends CallApiPlugin[] = TBasePluginArray,
	>(
		...parameters: CallApiParameters<
			InferSchemaResult<TSchema["data"], TData>,
			InferSchemaResult<TSchema["errorData"], TErrorData>,
			TResultMode,
			TThrowOnError,
			TResponseType,
			TBasePluginArray,
			TPluginArray,
			TBaseSchema,
			TSchema,
			TSchemaConfig,
			TInitURL,
			TCurrentRouteKey
		>
	): CallApiResult<
		InferSchemaResult<TSchema["data"], TData>,
		InferSchemaResult<TSchema["errorData"], TErrorData>,
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

		const { resolvedHooks, resolvedOptions, resolvedRequestOptions, url } = await initializePlugins({
			baseConfig,
			config,
			initURL,
			options: mergedExtraOptions as CombinedCallApiExtraOptions,
			request: mergedRequestOptions as CallApiRequestOptionsForHooks,
		});

		const fullURL = `${resolvedOptions.baseURL ?? ""}${getMainURL(url, resolvedOptions.params, resolvedOptions.query)}`;

		// FIXME -  Consider adding an option for refetching a callApi request
		const options = {
			...resolvedOptions,
			...resolvedHooks,
			fullURL,
			initURL: url,
			rawInitURL: initURL.toString(),
		} satisfies CombinedCallApiExtraOptions;

		const newFetchController = new AbortController();

		const timeoutSignal = options.timeout != null ? createTimeoutSignal(options.timeout) : null;

		const combinedSignal = createCombinedSignal(
			resolvedRequestOptions.signal,
			timeoutSignal,
			newFetchController.signal
		);

		const bodySerializer = options.bodySerializer ?? commonDefaults.bodySerializer;

		const request = {
			...resolvedRequestOptions,

			body: isSerializable(resolvedRequestOptions.body)
				? bodySerializer(resolvedRequestOptions.body)
				: resolvedRequestOptions.body,

			headers: await getHeaders({
				auth: options.auth,
				baseHeaders: baseFetchOptions.headers,
				body: resolvedRequestOptions.body,
				headers: fetchOptions.headers,
			}),

			method: resolvedRequestOptions.method ?? getMethodFromURL(url) ?? requestOptionDefaults.method,

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

		await handleRequestCancelStrategy();

		try {
			await executeHooksInTryBlock(options.onRequest?.({ baseConfig, config, options, request }));

			// == Apply determined headers again after onRequest incase they were modified
			request.headers = await getHeaders({
				auth: options.auth,
				body: request.body,
				headers: request.headers,
			});

			const response = await handleRequestDeferStrategy();

			// == Also clone response when dedupeStrategy is set to "defer" or when onRequestStream is set, to avoid error thrown from reading response.(whatever) more than once
			const shouldCloneResponse = dedupeStrategy === "defer" || options.cloneResponse;

			// FIXME - Utilize a better way of handling this
			// prettier-ignore
			const schema = (
				// isFunction(options.schema)
					// ? options.schema({ baseSchema: baseExtraOptions.schema, routeSchema: baseExtraOptions.schema?.routes?.["."] })
					options.schema
			) as CallApiSchema | undefined;

			if (!response.ok) {
				const errorData = await resolveResponseData<TErrorData>(
					shouldCloneResponse ? response.clone() : response,
					options.responseType,
					options.responseParser
				);

				const validErrorData = await handleValidation(schema?.errorData, errorData, response);

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

			const validSuccessData = await handleValidation(schema?.data, successData, response);

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

					return callApi(initURL, updatedOptions as never) as never;
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
