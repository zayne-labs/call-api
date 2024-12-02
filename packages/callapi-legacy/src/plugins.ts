/* eslint-disable no-await-in-loop */
import type { CallApiConfig, CallApiExtraOptions, Interceptors } from "./types";
import type { AnyFunction, Awaitable } from "./utils/type-helpers";
import { isObject } from "./utils/typeof";

export type PluginInitContext<TBaseData = unknown, TBaseErrorData = unknown> = {
	config: CallApiConfig<TBaseData, TBaseErrorData>;
	initUrl: string;
};

export type CallApiPlugin<TBaseData = unknown, TBaseErrorData = unknown> = {
	/**
	 *  @description A description for the plugin
	 */
	description?: string;

	/**
	 * Hooks/Interceptors for the plugin
	 */
	hooks?: Interceptors;

	/**
	 * @description A unique id for the plugin
	 */
	id: string;

	/**
	 * @description A function that will be called when the plugin is
	 * initialized. This will be called before the any
	 * of the other internal functions.
	 */
	init?: (
		context: PluginInitContext<TBaseData, TBaseErrorData>
	) => Awaitable<{ url?: string }> | Awaitable<void>;

	/**
	 * @description A name for the plugin
	 */
	name: string;

	/**
	 * @description A version for the plugin
	 */
	version?: string;
};

// eslint-disable-next-line perfectionist/sort-union-types
export const defineCallApiPlugin = <TPlugin extends CallApiPlugin | AnyFunction<CallApiPlugin>>(
	plugin: TPlugin
) => {
	return plugin;
};

export type PluginHooks<TBaseData, TBaseErrorData> = {
	onError?: Array<Interceptors<TBaseData, TBaseErrorData>["onError"]>;

	onRequest?: Array<Interceptors<TBaseData, TBaseErrorData>["onRequest"]>;

	onRequestError?: Array<Interceptors<TBaseData, TBaseErrorData>["onRequestError"]>;

	onResponse?: Array<Interceptors<TBaseData, TBaseErrorData>["onResponse"]>;

	onResponseError?: Array<Interceptors<TBaseData, TBaseErrorData>["onResponseError"]>;

	onSuccess?: Array<Interceptors<TBaseData, TBaseErrorData>["onSuccess"]>;
};

export const initializePlugins = async <TBaseData, TBaseErrorData>(
	initUrl: string,
	config: CallApiConfig<TBaseData, TBaseErrorData>
) => {
	let url: string = initUrl;

	const hooks = {
		onError: [config.onError],
		onRequest: [config.onRequest],
		onRequestError: [config.onRequestError],
		onResponse: [config.onResponse],
		onResponseError: [config.onResponseError],
		onSuccess: [config.onSuccess],
	} satisfies PluginHooks<TBaseData, TBaseErrorData>;

	for (const plugin of config.plugins ?? []) {
		if (plugin.init) {
			const pluginInitResult = await plugin.init({ config, initUrl });

			isObject(pluginInitResult) && pluginInitResult.url && (url = pluginInitResult.url);
		}

		plugin.hooks?.onRequest && hooks.onRequest.push(plugin.hooks.onRequest);
		plugin.hooks?.onRequestError && hooks.onRequestError.push(plugin.hooks.onRequestError);
		plugin.hooks?.onResponse && hooks.onResponse.push(plugin.hooks.onResponse);
		plugin.hooks?.onResponseError && hooks.onResponseError.push(plugin.hooks.onResponseError);
		plugin.hooks?.onSuccess && hooks.onSuccess.push(plugin.hooks.onSuccess);
		plugin.hooks?.onError && hooks.onError.push(plugin.hooks.onError);
	}

	const combine = (interceptors: Array<AnyFunction<Awaitable<void>> | undefined>) => {
		const mergedInterceptor = createMergedInterceptor(
			interceptors,
			config.mergeInterceptors,
			config.mergedInterceptorsExecutionMode
		);

		return mergedInterceptor;
	};

	const resolvedInterceptors = {
		onError: combine(hooks.onError),
		onRequest: combine(hooks.onRequest),
		onRequestError: combine(hooks.onRequestError),
		onResponse: combine(hooks.onResponse),
		onResponseError: combine(hooks.onResponseError),
		onSuccess: combine(hooks.onSuccess),
	};

	return {
		resolvedInterceptors,
		url,
	};
};

const createMergedInterceptor = (
	interceptors: Array<AnyFunction<Awaitable<void>> | undefined>,
	mergeInterceptors: CallApiExtraOptions["mergeInterceptors"],
	mergedInterceptorsExecutionMode: CallApiExtraOptions["mergedInterceptorsExecutionMode"]
) => {
	if (!mergeInterceptors) {
		return interceptors[0];
	}

	return async (ctx: Record<string, unknown>) => {
		const uniqueInterceptorArray = [...new Set(interceptors)];

		if (mergedInterceptorsExecutionMode === "sequential") {
			for (const uniqueInterceptor of uniqueInterceptorArray) {
				await uniqueInterceptor?.(ctx);
			}
		}

		if (mergedInterceptorsExecutionMode === "parallel") {
			await Promise.all(uniqueInterceptorArray.map((uniqueInterceptor) => uniqueInterceptor?.(ctx)));
		}
	};
};
