import type {
	CallApiRequestOptionsForHooks,
	CallApiResultModeUnion,
	CombinedCallApiExtraOptions,
	DefaultDataType,
	DefaultMoreOptions,
	ExtraOptions,
	Interceptors,
	InterceptorsOrInterceptorArray,
} from "./types";
import { isFunction, isPlainObject, isString } from "./utils/type-guards";
import type { AnyFunction, AnyObject, Awaitable } from "./utils/type-helpers";

type $CombinedCallApiExtraOptions<TMoreOptions extends AnyObject = DefaultMoreOptions> =
	CombinedCallApiExtraOptions<DefaultDataType, DefaultDataType, CallApiResultModeUnion, TMoreOptions>;

export type PluginInitContext<TMoreOptions extends AnyObject = DefaultMoreOptions> = {
	initURL: string;
	options: $CombinedCallApiExtraOptions<TMoreOptions>;
	request: CallApiRequestOptionsForHooks;
};

type CreateExtraOptions<TMoreOptions> = (...params: never[]) => TMoreOptions;

export type CallApiPlugin<TMoreOptions extends AnyObject = DefaultMoreOptions> = {
	/**
	 * @description Defines additional options that can be passed to callApi
	 */
	createExtraOptions?: CreateExtraOptions<TMoreOptions>;

	/**
	 *  @description A description for the plugin
	 */
	description?: string;

	/**
	 * Hooks / Interceptors for the plugin
	 */
	hooks?: InterceptorsOrInterceptorArray;

	/**
	 * @description A unique id for the plugin
	 */
	id: string;

	/**
	 * @description A function that will be called when the plugin is
	 * initialized. This will be called before the any
	 * of the other internal functions.
	 */
	init?: (context: PluginInitContext) => Awaitable<Partial<PluginInitContext>> | Awaitable<void>;

	/**
	 * @description A name for the plugin
	 */
	name: string;

	/**
	 * @description A version for the plugin
	 */
	version?: string;
};

export const definePlugin = <
	TMoreOptions extends AnyObject = DefaultMoreOptions,
	TPlugin extends
		| AnyFunction<CallApiPlugin<TMoreOptions>>
		| CallApiPlugin<TMoreOptions> = CallApiPlugin<TMoreOptions>,
>(
	plugin: TPlugin
) => {
	return plugin;
};

const createMergedHook = (
	hooks: Array<AnyFunction<Awaitable<unknown>> | undefined>,
	mergedHooksExecutionMode: CombinedCallApiExtraOptions["mergedHooksExecutionMode"]
) => {
	return async (ctx: Record<string, unknown>) => {
		if (mergedHooksExecutionMode === "sequential") {
			for (const hook of hooks) {
				// eslint-disable-next-line no-await-in-loop -- This is necessary in this case
				await hook?.(ctx);
			}

			return;
		}

		if (mergedHooksExecutionMode === "parallel") {
			const hookArray = [...hooks];

			await Promise.all(hookArray.map((uniqueHook) => uniqueHook?.(ctx)));
		}
	};
};

// prettier-ignore
type HookRegistries = {
	[Key in keyof Interceptors]: Set<Interceptors[Key]>;
};

export const hooksEnum = {
	onError: new Set(),
	onRequest: new Set(),
	onRequestError: new Set(),
	onResponse: new Set(),
	onResponseError: new Set(),
	onRetry: new Set(),
	onSuccess: new Set(),
} satisfies HookRegistries;

export const initializePlugins = async (context: PluginInitContext) => {
	const { initURL, options, request } = context;

	const hookRegistries = structuredClone(hooksEnum);

	const addMainHooks = () => {
		for (const key of Object.keys(hooksEnum)) {
			const mainHook = options[key as keyof Interceptors] as never;

			hookRegistries[key as keyof Interceptors].add(mainHook);
		}
	};

	const addPluginHooks = (pluginHooks: InterceptorsOrInterceptorArray) => {
		for (const key of Object.keys(hooksEnum)) {
			const pluginHook = pluginHooks[key as keyof Interceptors] as never;

			hookRegistries[key as keyof Interceptors].add(pluginHook);
		}
	};

	if (options.mergedHooksExecutionOrder === "mainHooksBeforePlugins") {
		addMainHooks();
	}

	const getPluginArray = (plugins: ExtraOptions["plugins"]) => {
		if (!plugins) {
			return [];
		}

		return isFunction(plugins) ? plugins({ initURL, options, request }) : plugins;
	};

	const resolvedPlugins = [
		...getPluginArray(options.plugins),
		...getPluginArray(options.extend?.plugins),
	];

	let resolvedUrl = initURL;
	let resolvedOptions = options;
	let resolvedRequestOptions = request;

	const executePluginInit = async (pluginInit: CallApiPlugin["init"]) => {
		if (!pluginInit) return;

		const initResult = await pluginInit({ initURL, options, request });

		if (!isPlainObject(initResult)) return;

		if (isString(initResult.initURL)) {
			resolvedUrl = initResult.initURL;
		}

		if (isPlainObject(initResult.request)) {
			resolvedRequestOptions = initResult.request;
		}

		if (isPlainObject(initResult.options)) {
			resolvedOptions = initResult.options;
		}
	};

	for (const plugin of resolvedPlugins) {
		// eslint-disable-next-line no-await-in-loop -- Await is necessary in this case.
		await executePluginInit(plugin.init);

		if (!plugin.hooks) continue;

		addPluginHooks(plugin.hooks);
	}

	if (
		!options.mergedHooksExecutionOrder ||
		options.mergedHooksExecutionOrder === "mainHooksAfterPlugins"
	) {
		addMainHooks();
	}

	const resolvedHooks = {} as Required<Interceptors>;

	for (const [key, hookRegistry] of Object.entries(hookRegistries)) {
		const flattenedHookArray = [...hookRegistry].flat();

		const mergedHook = createMergedHook(flattenedHookArray, options.mergedHooksExecutionMode);

		resolvedHooks[key as keyof Interceptors] = mergedHook;
	}

	return {
		resolvedHooks,
		resolvedOptions,
		resolvedRequestOptions,
		url: resolvedUrl,
	};
};
