/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { CallApiPlugin, CallApiSchema } from "..";
import type { ResultModeUnion } from "../result";
import type { AllowedQueryParamValues, Params, Query } from "../url";
import type {
	BaseCallApiSchema,
	CallApiSchemaConfig,
	InferSchemaResult,
	RouteKeyMethods,
	SchemaShape,
} from "../validation";
import type {
	AnyFunction,
	AnyString,
	CommonAuthorizationHeaders,
	CommonContentTypes,
	CommonRequestHeaders,
	LiteralUnion,
	Prettify,
	UnmaskType,
} from "./type-helpers";

/**
 * @description Makes a type required if the output type of TSchema contains undefined, otherwise keeps it as is
 */
type MakeSchemaOptionRequired<TSchema extends SchemaShape[keyof SchemaShape], TObject> =
	undefined extends InferSchemaResult<TSchema, undefined> ? TObject : Required<TObject>;

export type ApplyURLBasedConfig<
	TSchemaConfig extends CallApiSchemaConfig,
	TCurrentRouteKeys extends string,
> = TSchemaConfig["baseURL"] extends string
	? `${TSchemaConfig["baseURL"]}${TCurrentRouteKeys}`
	: TCurrentRouteKeys;

export type ApplyStrictConfig<
	TSchemaConfig extends CallApiSchemaConfig,
	TCurrentRouteKeys extends string,
> = TSchemaConfig["strict"] extends true ? TCurrentRouteKeys : LiteralUnion<TCurrentRouteKeys>;

export type ApplySchemaConfiguration<
	TSchemaConfig extends CallApiSchemaConfig,
	TCurrentRouteKeys extends string,
> = ApplyStrictConfig<TSchemaConfig, ApplyURLBasedConfig<TSchemaConfig, TCurrentRouteKeys>>;

export type InferAllRouteKeys<
	TBaseSchema extends BaseCallApiSchema,
	TSchemaConfig extends CallApiSchemaConfig,
> = ApplySchemaConfiguration<
	TSchemaConfig,
	keyof TBaseSchema["routes"] extends string ? keyof TBaseSchema["routes"] : never
>;

export type InferInitURL<
	TBaseSchema extends BaseCallApiSchema,
	TSchemaConfig extends CallApiSchemaConfig,
> = InferAllRouteKeys<TBaseSchema, TSchemaConfig> | URL;

export type GetCurrentRouteKey<
	TSchemaConfig extends CallApiSchemaConfig,
	TPath,
> = TSchemaConfig["baseURL"] extends string
	? TPath extends `${TSchemaConfig["baseURL"]}${infer TCurrentRoute}`
		? TCurrentRoute extends string
			? TCurrentRoute
			: string
		: string
	: TPath extends URL
		? string
		: TPath;

type JsonPrimitive = boolean | number | string | null | undefined;

export type SerializableObject = Record<keyof object, unknown>;

export type SerializableArray =
	| Array<JsonPrimitive | SerializableArray | SerializableObject>
	| ReadonlyArray<JsonPrimitive | SerializableArray | SerializableObject>;

export type Body = UnmaskType<RequestInit["body"] | SerializableArray | SerializableObject>;

export type InferBodyOption<TSchema extends CallApiSchema> = MakeSchemaOptionRequired<
	TSchema["body"],
	{
		/**
		 * Body of the request, can be a object or any other supported body type.
		 */
		body?: InferSchemaResult<TSchema["body"], Body>;
	}
>;

export type MethodUnion = UnmaskType<
	"CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE" | AnyString
>;

type InferMethodFromURL<TInitURL> = TInitURL extends `@${infer TMethod extends RouteKeyMethods}/${string}`
	? Uppercase<TMethod>
	: MethodUnion;

type MakeMethodOptionRequired<
	TInitURL,
	TRequireMethodOption extends CallApiSchemaConfig["requireMethodOption"],
	TObject,
> = TInitURL extends `@${string}/${string}`
	? TRequireMethodOption extends true
		? Required<TObject>
		: TObject
	: TObject;

export type InferMethodOption<
	TSchema extends CallApiSchema,
	TSchemaConfig extends CallApiSchemaConfig,
	TInitURL,
> = MakeSchemaOptionRequired<
	TSchema["method"],
	MakeMethodOptionRequired<
		TInitURL,
		TSchemaConfig["requireMethodOption"],
		{
			/**
			 * HTTP method for the request.
			 * @default "GET"
			 */
			method?: InferSchemaResult<TSchema["method"], InferMethodFromURL<TInitURL>>;
		}
	>
>;

export type Headers = UnmaskType<
	| Record<"Authorization", CommonAuthorizationHeaders>
	| Record<"Content-Type", CommonContentTypes>
	| Record<CommonRequestHeaders, string | undefined>
	| Record<string, string | undefined>
	| RequestInit["headers"]
>;

export type InferHeadersOption<TSchema extends CallApiSchema> = MakeSchemaOptionRequired<
	TSchema["headers"],
	{
		/**
		 * Headers to be used in the request.
		 */
		headers?: InferSchemaResult<TSchema["headers"], Headers>;
	}
>;

export type InferRequestOptions<
	TSchema extends CallApiSchema,
	TSchemaConfig extends CallApiSchemaConfig,
	TInitURL extends InferInitURL<BaseCallApiSchema, CallApiSchemaConfig>,
> = InferBodyOption<TSchema>
	& InferHeadersOption<TSchema>
	& InferMethodOption<TSchema, TSchemaConfig, TInitURL>;

// eslint-disable-next-line ts-eslint/no-empty-object-type -- This needs to be empty to allow users to register their own meta
export interface Register {
	// == meta: Meta
}

export type GlobalMeta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export type InferMetaOption<TSchema extends CallApiSchema> = MakeSchemaOptionRequired<
	TSchema["meta"],
	{ meta?: InferSchemaResult<TSchema["meta"], GlobalMeta> }
>;

export type InferQueryOption<TSchema extends CallApiSchema> = MakeSchemaOptionRequired<
	TSchema["query"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		query?: InferSchemaResult<TSchema["query"], Query>;
	}
>;

export type RemoveEmptyString<TString> = Exclude<TString, "">;

/* eslint-disable perfectionist/sort-union-types -- I need to preserve the order of the types */
export type InferParamFromPath<TPath> =
	TPath extends `${infer IgnoredPrefix}:${infer TCurrentParam}/${infer TRemainingPath}`
		? TCurrentParam extends ""
			? InferParamFromPath<TRemainingPath>
			:
					| Prettify<
							Record<
								| TCurrentParam
								| (Params extends InferParamFromPath<TRemainingPath>
										? never
										: keyof Extract<
												InferParamFromPath<TRemainingPath>,
												Record<string, unknown>
											>),
								AllowedQueryParamValues
							>
					  >
					| [
							AllowedQueryParamValues,
							...(Params extends InferParamFromPath<TRemainingPath>
								? []
								: Extract<InferParamFromPath<TRemainingPath>, unknown[]>),
					  ]
		: TPath extends `${infer IgnoredPrefix}:${infer TCurrentParam}`
			? TCurrentParam extends ""
				? Params
				: Prettify<Record<TCurrentParam, AllowedQueryParamValues>> | [AllowedQueryParamValues]
			: Params;
/* eslint-enable perfectionist/sort-union-types -- I need to preserve the order of the types */

export type InferParamsOption<TPath, TSchema extends CallApiSchema> = MakeSchemaOptionRequired<
	TSchema["params"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		params?: InferSchemaResult<TSchema["params"], InferParamFromPath<TPath>>;
	}
>;

export type InferExtraOptions<TSchema extends CallApiSchema, TPath> = InferMetaOption<TSchema>
	& InferParamsOption<TPath, TSchema>
	& InferQueryOption<TSchema>;

type UnionToIntersection<TUnion> = (TUnion extends unknown ? (param: TUnion) => void : never) extends (
	param: infer TParam
) => void
	? TParam
	: never;

export type InferPluginOptions<TPluginArray extends CallApiPlugin[]> = UnionToIntersection<
	TPluginArray extends Array<infer TPlugin>
		? TPlugin extends CallApiPlugin
			? TPlugin["defineExtraOptions"] extends AnyFunction<infer TResult>
				? InferSchemaResult<TResult>
				: never
			: never
		: never
>;

// == DID THIS FOR AUTOCOMPLETION
type ExtractKeys<TUnion, TSelectedUnion extends TUnion> = Extract<TUnion, TSelectedUnion>;

export type ResultModeOption<TErrorData, TResultMode extends ResultModeUnion> = TErrorData extends false
	? { resultMode: "onlySuccessWithException" }
	: TErrorData extends false | undefined
		? { resultMode?: "onlySuccessWithException" }
		: TErrorData extends false | null
			? { resultMode?: ExtractKeys<ResultModeUnion, "onlySuccess" | "onlySuccessWithException"> }
			: null extends TResultMode
				? { resultMode?: TResultMode }
				: { resultMode: TResultMode };

export type ThrowOnErrorOption<TErrorData> = TErrorData extends false
	? { throwOnError: true }
	: TErrorData extends false | undefined
		? { throwOnError?: true }
		: NonNullable<unknown>;
