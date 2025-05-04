/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import { hookDefaults } from "./constants/default-options";
import {
	type Hooks,
	type HooksOrHooksArray,
	type SharedHookContext,
	composeTwoHooks,
	hookRegistries,
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
import { isArray, isFunction, isPlainObject, isString } from "./utils/guards";
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
	SharedHookContext<TMoreOptions> & { initURL: InitURL | undefined }
>;

export type PluginInitResult = Partial<
	Omit<PluginInitContext, "request"> & { request: CallApiRequestOptions }
>;

export type PluginHooksWithMoreOptions<TMoreOptions = DefaultMoreOptions> = HooksOrHooksArray<
	never,
	never,
	TMoreOptions
>;

export type PluginHooks<
	TData = never,
	TErrorData = never,
	TMoreOptions = DefaultMoreOptions,
> = HooksOrHooksArray<TData, TErrorData, TMoreOptions>;

export interface CallApiPlugin {
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
	hooks?: PluginHooks;

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

export const initializePlugins = async (context: PluginInitContext) => {
	const { baseConfig, config, initURL, options, request } = context;

	const clonedHookRegistries = structuredClone(hookRegistries);

	const addMainHooks = () => {
		for (const key of Object.keys(clonedHookRegistries) as Array<keyof Hooks>) {
			const baseHook = baseConfig[key];
			const instanceHook = config[key];

			const overriddenHook = options[key] as HooksOrHooksArray[typeof key];

			// If the base hook is an array and instance hook is defined, we need to compose it with the overridden hook
			const mainHook =
				isArray(baseHook) && Boolean(instanceHook) ? [baseHook, instanceHook].flat() : overriddenHook;

			if (!mainHook) continue;

			clonedHookRegistries[key].add(mainHook as never);
		}
	};

	const addPluginHooks = (pluginHooks: Required<CallApiPlugin>["hooks"]) => {
		for (const key of Object.keys(clonedHookRegistries) as Array<keyof Hooks>) {
			const pluginHook = pluginHooks[key];

			if (!pluginHook) continue;

			clonedHookRegistries[key].add(pluginHook as never);
		}
	};

	const mergedHooksExecutionOrder =
		options.mergedHooksExecutionOrder ?? hookDefaults.mergedHooksExecutionOrder;

	if (mergedHooksExecutionOrder === "mainHooksBeforePlugins") {
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
			request,
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

	if (mergedHooksExecutionOrder === "mainHooksAfterPlugins") {
		addMainHooks();
	}

	const resolvedHooks: Hooks = {};

	for (const [key, hookRegistry] of Object.entries(clonedHookRegistries)) {
		const flattenedHookArray = [...hookRegistry].flat();

		const mergedHooksExecutionMode =
			options.mergedHooksExecutionMode ?? hookDefaults.mergedHooksExecutionMode;

		const composedHook = composeTwoHooks(flattenedHookArray, mergedHooksExecutionMode);

		composedHook && (resolvedHooks[key as keyof Hooks] = composedHook);
	}

	return {
		resolvedHooks,
		resolvedOptions,
		resolvedRequestOptions,
		url: resolvedUrl?.toString(),
	};
};
