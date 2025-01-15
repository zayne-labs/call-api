import type {
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
	Interceptors,
	InterceptorsArray,
} from "./types";
import { isFunction, isPlainObject, isString } from "./utils/type-guards";
import type { AnyFunction, Awaitable } from "./utils/type-helpers";

export type PluginInitContext<TData = unknown, TErrorData = unknown> = {
	initURL: string;
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

const createMergedInterceptor = (
	interceptors: Array<AnyFunction<Awaitable<unknown>> | undefined>,
	mergedInterceptorsExecutionMode: CombinedCallApiExtraOptions["mergedInterceptorsExecutionMode"]
) => {
	return async (ctx: Record<string, unknown>) => {
		if (mergedInterceptorsExecutionMode === "sequential") {
			for (const interceptor of interceptors) {
				// eslint-disable-next-line no-await-in-loop -- This is necessary in this case
				await interceptor?.(ctx);
			}

			return;
		}

		if (mergedInterceptorsExecutionMode === "parallel") {
			const interceptorArray = [...interceptors];

			await Promise.all(interceptorArray.map((uniqueInterceptor) => uniqueInterceptor?.(ctx)));
		}
	};
};

type InterceptorsOrInterceptorsArray<TData, TErrorData> =
	| Interceptors<TData, TErrorData>
	| InterceptorsArray<TData, TErrorData>;

// prettier-ignore
type PluginHooks<TData, TErrorData> = {
	[Key in keyof Interceptors<TData, TErrorData>]: Set<InterceptorsOrInterceptorsArray<TData, TErrorData>[Key]>;
};

export const initializePlugins = async <TData, TErrorData>(
	context: PluginInitContext<TData, TErrorData>
) => {
	const { initURL, options, request } = context;

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
		? [options.plugins({ initURL, options, request }), options.extend?.plugins ?? []].flat()
		: [options.plugins ?? [], options.extend?.plugins ?? []].flat();

	let resolvedUrl = initURL;
	let resolvedOptions = options;
	let resolvedRequestOptions = request;

	const executePluginInit = async (pluginInit: CallApiPlugin<TData, TErrorData>["init"]) => {
		if (!pluginInit) return;

		const pluginInitResult = await pluginInit({ initURL, options, request });

		if (!isPlainObject(pluginInitResult)) return;

		if (isString(pluginInitResult.url)) {
			resolvedUrl = pluginInitResult.url;
		}

		if (isPlainObject(pluginInitResult.request)) {
			resolvedRequestOptions = pluginInitResult.request;
		}

		if (isPlainObject(pluginInitResult.options)) {
			resolvedOptions = pluginInitResult.options;
		}
	};

	for (const plugin of options.override?.plugins ?? resolvedPlugins) {
		// eslint-disable-next-line no-await-in-loop -- Await is necessary in this case.
		await executePluginInit(plugin.init);

		if (!plugin.hooks) continue;

		addPluginInterceptors(plugin.hooks);
	}

	if (
		!options.mergedInterceptorsExecutionOrder ||
		options.mergedInterceptorsExecutionOrder === "mainInterceptorLast"
	) {
		addMainInterceptors();
	}

	const handleInterceptorsMerge = (interceptors: Array<AnyFunction<Awaitable<unknown>> | undefined>) => {
		const mergedInterceptor = createMergedInterceptor(
			interceptors,
			options.mergedInterceptorsExecutionMode
		);

		return mergedInterceptor;
	};

	const interceptors = {
		onError: handleInterceptorsMerge([...hookRegistry.onError].flat()),
		onRequest: handleInterceptorsMerge([...hookRegistry.onRequest].flat()),
		onRequestError: handleInterceptorsMerge([...hookRegistry.onRequestError].flat()),
		onResponse: handleInterceptorsMerge([...hookRegistry.onResponse].flat()),
		onResponseError: handleInterceptorsMerge([...hookRegistry.onResponseError].flat()),
		onSuccess: handleInterceptorsMerge([...hookRegistry.onSuccess].flat()),
	} satisfies Interceptors<TData, TErrorData>;

	return {
		interceptors,
		resolvedOptions,
		resolvedRequestOptions,
		url: resolvedUrl,
	};
};

export const definePlugin = <
	// eslint-disable-next-line perfectionist/sort-union-types -- I want the first one to be first
	TPlugin extends CallApiPlugin<never, never> | AnyFunction<CallApiPlugin<never, never>>,
>(
	plugin: TPlugin
) => {
	return plugin;
};
