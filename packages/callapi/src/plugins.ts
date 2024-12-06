import type { CallApiRequestOptionsForHooks, CombinedCallApiExtraOptions, Interceptors } from "./types";
import type { AnyFunction, Awaitable } from "./utils/type-helpers";
import { isFunction, isObject } from "./utils/typeof";

export type PluginInitContext<TData = unknown, TErrorData = unknown> = {
	initUrl: string;
	options: CombinedCallApiExtraOptions<TData, TErrorData>;
	request: Omit<CallApiRequestOptionsForHooks, "fullURL">;
};

export type CallApiPlugin<TData = unknown, TErrorData = unknown> = {
	/**
	 *  @description A description for the plugin
	 */
	description?: string;

	/**
	 * Hooks/Interceptors for the plugin
	 */
	hooks?: Interceptors<TData, TErrorData>;

	/**
	 * @description A unique id for the plugin
	 */
	id: string;

	/**
	 * @description A function that will be called when the plugin is
	 * initialized. This will be called before the any
	 * of the other internal functions.
	 */
	init?: (context: PluginInitContext<TData, TErrorData>) =>
		| Awaitable<{
				options?: CombinedCallApiExtraOptions<TData, TErrorData>;
				request: CallApiRequestOptionsForHooks;
				url?: string;
		  }>
		| Awaitable<void>;

	/**
	 * @description A name for the plugin
	 */
	name: string;

	/**
	 * @description A version for the plugin
	 */
	version?: string;
};

export const defineCallApiPlugin = <
	// eslint-disable-next-line perfectionist/sort-union-types
	TPlugin extends CallApiPlugin<never, never> | AnyFunction<CallApiPlugin<never, never>>,
>(
	plugin: TPlugin
) => {
	return plugin;
};

const createMergedInterceptor = (
	interceptors: Set<AnyFunction<Awaitable<void>> | undefined>,
	mergedInterceptorsExecutionMode: CombinedCallApiExtraOptions["mergedInterceptorsExecutionMode"]
) => {
	return async (ctx: Record<string, unknown>) => {
		if (mergedInterceptorsExecutionMode === "parallel") {
			const interceptorArray = [...interceptors];

			await Promise.all(interceptorArray.map((uniqueInterceptor) => uniqueInterceptor?.(ctx)));
		}

		if (mergedInterceptorsExecutionMode === "sequential") {
			for (const interceptor of interceptors) {
				// eslint-disable-next-line no-await-in-loop
				await interceptor?.(ctx);
			}
		}
	};
};

type PluginHooks<TData, TErrorData> = {
	[Key in keyof Interceptors<TData, TErrorData>]: Set<Interceptors<TData, TErrorData>[Key]>;
};

export const initializePlugins = async <TData, TErrorData>(
	context: PluginInitContext<TData, TErrorData>
) => {
	const { initUrl, options, request } = context;

	const hookRegistry = {
		onError: new Set([]),
		onRequest: new Set([]),
		onRequestError: new Set([]),
		onResponse: new Set([]),
		onResponseError: new Set([]),
		onSuccess: new Set([]),
	} satisfies PluginHooks<TData, TErrorData> as Required<PluginHooks<TData, TErrorData>>;

	const addMainInterceptors = () => {
		hookRegistry.onRequest.add(options.onRequest);
		hookRegistry.onRequestError.add(options.onRequestError);
		hookRegistry.onResponse.add(options.onResponse);
		hookRegistry.onResponseError.add(options.onResponseError);
		hookRegistry.onSuccess.add(options.onSuccess);
		hookRegistry.onError.add(options.onError);
	};

	const addPluginInterceptors = (pluginHooks: Interceptors<TData, TErrorData>) => {
		hookRegistry.onRequest.add(pluginHooks.onRequest);
		hookRegistry.onRequestError.add(pluginHooks.onRequestError);
		hookRegistry.onResponse.add(pluginHooks.onResponse);
		hookRegistry.onResponseError.add(pluginHooks.onResponseError);
		hookRegistry.onSuccess.add(pluginHooks.onSuccess);
		hookRegistry.onError.add(pluginHooks.onError);
	};

	if (options.mergedInterceptorsExecutionOrder === "mainInterceptorFirst") {
		addMainInterceptors();
	}

	const resolvedPlugins = isFunction(options.plugins)
		? options.plugins({ initUrl, options, request })
		: options.plugins;

	let resolvedUrl = initUrl;
	let resolvedOptions = options;
	let resolvedRequestOptions = request;

	const executePluginInit = async (pluginInit: CallApiPlugin<TData, TErrorData>["init"]) => {
		if (!pluginInit) return;

		const pluginInitResult = await pluginInit(context);

		if (!isObject(pluginInitResult)) return;

		if (pluginInitResult.url) {
			resolvedUrl = pluginInitResult.url;
		}

		if (isObject(pluginInitResult.request)) {
			resolvedRequestOptions = pluginInitResult.request;
		}

		if (isObject(pluginInitResult.options)) {
			resolvedOptions = pluginInitResult.options;
		}
	};

	for (const plugin of resolvedPlugins ?? []) {
		// eslint-disable-next-line no-await-in-loop
		await executePluginInit(plugin.init);

		if (!plugin.hooks) continue;

		addPluginInterceptors(plugin.hooks);
	}

	if (options.mergedInterceptorsExecutionOrder === "mainInterceptorLast") {
		addMainInterceptors();
	}

	const handleInterceptorsMerge = (interceptors: Set<AnyFunction<Awaitable<void>> | undefined>) => {
		const mergedInterceptor = createMergedInterceptor(
			interceptors,
			options.mergedInterceptorsExecutionMode
		);

		return mergedInterceptor;
	};

	const interceptors = {
		onError: handleInterceptorsMerge(hookRegistry.onError),
		onRequest: handleInterceptorsMerge(hookRegistry.onRequest),
		onRequestError: handleInterceptorsMerge(hookRegistry.onRequestError),
		onResponse: handleInterceptorsMerge(hookRegistry.onResponse),
		onResponseError: handleInterceptorsMerge(hookRegistry.onResponseError),
		onSuccess: handleInterceptorsMerge(hookRegistry.onSuccess),
	} satisfies Interceptors<TData, TErrorData>;

	return {
		interceptors,
		resolvedOptions,
		resolvedRequestOptions,
		url: resolvedUrl,
	};
};
