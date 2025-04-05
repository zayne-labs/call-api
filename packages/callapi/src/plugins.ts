/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
	BaseCallApiExtraOptions,
	CallApiExtraOptions,
	CallApiRequestOptions,
	CallApiRequestOptionsForHooks,
	CombinedCallApiExtraOptions,
	Interceptors,
	InterceptorsOrInterceptorArray,
	WithMoreOptions,
} from "./types/common";
import type { DefaultMoreOptions } from "./types/default-types";
import type { InitURL } from "./url";
import { isPlainObject, isString } from "./utils/type-guards";
import type { AnyFunction, Awaitable } from "./utils/type-helpers";
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

export type PluginInitContext<TMoreOptions = DefaultMoreOptions> = WithMoreOptions<TMoreOptions> & {
	baseConfig: BaseCallApiExtraOptions & CallApiRequestOptions;
	config: CallApiExtraOptions & CallApiRequestOptions;
	defaultOptions: CallApiExtraOptions;
	initURL: InitURL | undefined;
	options: CombinedCallApiExtraOptions;
	request: CallApiRequestOptionsForHooks;
};

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
	hooks?: InterceptorsOrInterceptorArray<TData, TErrorData>;

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

const createMergedHook = (
	hooks: Array<AnyFunction | undefined>,
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

export type Plugins<TPluginArray extends CallApiPlugin[]> = TPluginArray;

const getPluginArray = (plugins: Plugins<CallApiPlugin[]> | undefined) => {
	if (!plugins) {
		return [];
	}

	return plugins;
};

export const initializePlugins = async (
	context: Omit<PluginInitContext, "request"> & { request: CallApiRequestOptions }
) => {
	const { baseConfig, config, defaultOptions, initURL, options, request } = context;

	const hookRegistries = structuredClone(hooksEnum);

	const addMainHooks = () => {
		for (const key of Object.keys(hooksEnum)) {
			const mainHook = options[key as keyof Interceptors] as never;

			hookRegistries[key as keyof Interceptors].add(mainHook);
		}
	};

	const addPluginHooks = (pluginHooks: Required<CallApiPlugin>["hooks"]) => {
		for (const key of Object.keys(hooksEnum)) {
			const pluginHook = pluginHooks[key as keyof Interceptors] as never;

			hookRegistries[key as keyof Interceptors].add(pluginHook);
		}
	};

	if (options.mergedHooksExecutionOrder === "mainHooksBeforePlugins") {
		addMainHooks();
	}

	const resolvedPlugins = [
		...getPluginArray(options.plugins),
		...getPluginArray(options.extend?.plugins),
	];

	let resolvedUrl = initURL;
	let resolvedOptions = options;
	let resolvedRequestOptions = request;

	const executePluginInit = async (pluginInit: CallApiPlugin["init"]) => {
		if (!pluginInit) return;

		const initResult = await pluginInit({
			baseConfig,
			config,
			defaultOptions,
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
		url: resolvedUrl?.toString(),
	};
};
