/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import {
	type Hooks,
	type SharedHookContext,
	type WithMoreOptions,
	composeTwoHooks,
	hookRegistries,
	type hooksOrHooksArray,
} from "./hooks";
import type {
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
} from "./types/common";
import type { DefaultMoreOptions } from "./types/default-types";
import type { StandardSchemaV1 } from "./types/standard-schema";
import type { InitURL } from "./url";
import { isFunction, isPlainObject, isString } from "./utils/guards";
import type { AnyFunction, Awaitable, Prettify } from "./utils/type-helpers";
import type { InferSchemaResult } from "./validation";

type UnionToIntersection<TUnion> = (TUnion extends unknown ? (param: TUnion) => void : never) extends (
	param: infer TParam
) => void
	? TParam
	: never;

type InferSchema<TResult> = TResult extends StandardSchemaV1
	? InferSchemaResult<TResult, NonNullable<unknown>>
	: TResult;

export type InferPluginOptions<TPluginArray extends CallApiPlugin[]> = UnionToIntersection<
	InferSchema<ReturnType<NonNullable<TPluginArray[number]["createExtraOptions"]>>>
>;

export type PluginInitContext<TMoreOptions = DefaultMoreOptions> = Prettify<
	SharedHookContext & WithMoreOptions<TMoreOptions> & { initURL: InitURL | undefined }
>;

export type PluginInitResult = Partial<
	Omit<PluginInitContext, "request"> & { request: CallApiRequestOptions }
>;

export interface CallApiPlugin<TData = never, TErrorData = never> {
	/**
	 * Defines additional options that can be passed to callApi
	 */
	createExtraOptions?: (...params: never[]) => unknown;

	/**
	 * A description for the plugin
	 */
	description?: string;

	/**
	 * Hooks / Interceptors for the plugin
	 */
	hooks?: hooksOrHooksArray<TData, TErrorData>;

	/**
	 *  A unique id for the plugin
	 */
	id: string;

	/**
	 * A function that will be called when the plugin is initialized. This will be called before the any of the other internal functions.
	 */
	init?: (context: PluginInitContext) => Awaitable<PluginInitResult> | Awaitable<void>;

	/**
	 * A name for the plugin
	 */
	name: string;

	/**
	 *  A version for the plugin
	 */
	version?: string;
}

export const definePlugin = <
	// eslint-disable-next-line perfectionist/sort-union-types -- Let the first one be first
	TPlugin extends CallApiPlugin | AnyFunction<CallApiPlugin>,
>(
	plugin: TPlugin
) => {
	return plugin;
};

export type Plugins<TPluginArray extends CallApiPlugin[]> = TPluginArray;

const resolvePluginArray = (
	plugins: CallApiExtraOptions["plugins"] | undefined,
	basePlugins: BaseCallApiExtraOptions["plugins"] | undefined
) => {
	if (!plugins) {
		return [];
	}

	if (isFunction(plugins)) {
		return plugins({ basePlugins: basePlugins ?? [] });
	}

	return plugins;
};

export const initializePlugins = async (
	context: Omit<PluginInitContext, "request"> & { request: CallApiRequestOptions }
) => {
	const { baseConfig, config, initURL, options, request } = context;

	const clonedHookRegistries = structuredClone(hookRegistries);

	const addMainHooks = () => {
		for (const key of Object.keys(clonedHookRegistries)) {
			const mainHook = options[key as keyof Hooks] as never;

			clonedHookRegistries[key as keyof Hooks].add(mainHook);
		}
	};

	const addPluginHooks = (pluginHooks: Required<CallApiPlugin>["hooks"]) => {
		for (const key of Object.keys(clonedHookRegistries)) {
			const pluginHook = pluginHooks[key as keyof Hooks] as never;

			clonedHookRegistries[key as keyof Hooks].add(pluginHook);
		}
	};

	if (options.mergedHooksExecutionOrder === "mainHooksBeforePlugins") {
		addMainHooks();
	}

	const resolvedPlugins = resolvePluginArray(options.plugins, baseConfig.plugins);

	let resolvedUrl = initURL;
	let resolvedOptions = options;
	let resolvedRequestOptions = request;

	const executePluginInit = async (pluginInit: CallApiPlugin["init"]) => {
		if (!pluginInit) return;

		const initResult = await pluginInit({
			baseConfig,
			config,
			initURL,
			options,
			request: request as CallApiRequestOptionsForHooks,
		});

		if (!isPlainObject(initResult)) return;

		if (isString(initResult.initURL)) {
			resolvedUrl = initResult.initURL;
		}

		if (isPlainObject(initResult.request)) {
			resolvedRequestOptions = initResult.request as CallApiRequestOptionsForHooks;
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
		!options.mergedHooksExecutionOrder
		|| options.mergedHooksExecutionOrder === "mainHooksAfterPlugins"
	) {
		addMainHooks();
	}

	const resolvedHooks: Hooks = {};

	for (const [key, hookRegistry] of Object.entries(clonedHookRegistries)) {
		const flattenedHookArray = [...hookRegistry].flat().filter(Boolean);

		const composedHook = composeTwoHooks(flattenedHookArray, options.mergedHooksExecutionMode);

		resolvedHooks[key as keyof Hooks] = composedHook;
	}

	return {
		resolvedHooks,
		resolvedOptions,
		resolvedRequestOptions,
		url: resolvedUrl?.toString(),
	};
};
