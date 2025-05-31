/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { ResultModeUnion } from "../result";
import type { AllowedQueryParamValues, Params, Query } from "../url";
import type {
	BaseCallApiSchemas,
	CallApiSchemas,
	InferSchemaResult,
	RouteKeyMethods,
} from "../validation";
import type { StandardSchemaV1 } from "./standard-schema";
import type {
	AnyString,
	CommonAuthorizationHeaders,
	CommonContentTypes,
	CommonRequestHeaders,
	LiteralUnion,
	UnmaskType,
} from "./type-helpers";

/**
 * @description Makes a type required if the output type of TSchema contains undefined, otherwise keeps it as is
 */
type MakeSchemaOptionRequired<TSchema extends StandardSchemaV1 | undefined, TObject> =
	undefined extends InferSchemaResult<TSchema, undefined> ? TObject : Required<TObject>;

type ExtractString<TValue> = Extract<TValue, string>;

export type InferKey<TBaseSchema extends BaseCallApiSchemas> =
	// Get the config type with NonNullable to handle undefined
	NonNullable<TBaseSchema["config"]>["strict"] extends true
		? NonNullable<TBaseSchema["config"]>["baseURL"] extends string
			? `${NonNullable<TBaseSchema["config"]>["baseURL"]}${keyof NonNullable<
					TBaseSchema["routes"]
				> extends string
					? ExtractString<keyof NonNullable<TBaseSchema["routes"]>>
					: never}`
			: keyof NonNullable<TBaseSchema["routes"]> extends string
				? keyof NonNullable<TBaseSchema["routes"]>
				: never
		: NonNullable<TBaseSchema["config"]>["baseURL"] extends string
			? LiteralUnion<`${NonNullable<TBaseSchema["config"]>["baseURL"]}${keyof TBaseSchema["routes"] extends string
					? keyof TBaseSchema["routes"]
					: never}`>
			: LiteralUnion<
					keyof NonNullable<TBaseSchema["routes"]> extends string
						? keyof NonNullable<TBaseSchema["routes"]>
						: never
				>;

export type InferInitURL<TBaseSchema extends BaseCallApiSchemas> = InferKey<TBaseSchema> | URL;

export type ExtractKey<TBaseSchema extends BaseCallApiSchemas, TPath> = NonNullable<
	TBaseSchema["config"]
>["baseURL"] extends string
	? TPath extends `${NonNullable<TBaseSchema["config"]>["baseURL"]}${infer TMainRoute}`
		? TMainRoute extends string
			? TMainRoute
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

export type InferBodyOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["body"],
	{
		/**
		 * Body of the request, can be a object or any other supported body type.
		 */
		body?: InferSchemaResult<TSchemas["body"], Body>;
	}
>;

type AllMethods = UnmaskType<
	"CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE"
>;

export type Method = UnmaskType<AllMethods | AnyString>;

type InferMethodFromURL<TInitURL> =
	TInitURL extends `@${infer TMethod extends Lowercase<RouteKeyMethods>}/${string}`
		? Uppercase<TMethod>
		: Method;

type MakeMethodOptionRequiredViaURL<TMethod, TObject> = TMethod extends RouteKeyMethods
	? Required<TObject>
	: TObject;

export type InferMethodOption<
	TSchemas extends CallApiSchemas,
	_IgnoredTBaseSchema extends BaseCallApiSchemas,
	TInitURL,
> = MakeSchemaOptionRequired<
	TSchemas["method"],
	MakeMethodOptionRequiredViaURL<
		Lowercase<InferMethodFromURL<TInitURL>>,
		{
			/**
			 * HTTP method for the request.
			 * @default "GET"
			 */
			method?: InferSchemaResult<TSchemas["method"], InferMethodFromURL<TInitURL>>;
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

export type InferHeadersOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["headers"],
	{
		/**
		 * Headers to be used in the request.
		 */
		headers?: InferSchemaResult<TSchemas["headers"], Headers>;
	}
>;

export type InferRequestOptions<
	TSchemas extends CallApiSchemas,
	TInitURL extends InferInitURL<BaseCallApiSchemas>,
	TBaseSchema extends BaseCallApiSchemas,
> = InferBodyOption<TSchemas>
	& InferHeadersOption<TSchemas>
	& InferMethodOption<TSchemas, TBaseSchema, TInitURL>;

// eslint-disable-next-line ts-eslint/no-empty-object-type -- This needs to be empty to allow users to register their own meta
export interface Register {
	// == meta: Meta
}

export type GlobalMeta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export type InferMetaOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["meta"],
	{ meta?: InferSchemaResult<TSchemas["meta"], GlobalMeta> }
>;

export type InferQueryOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["query"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		query?: InferSchemaResult<TSchemas["query"], Query>;
	}
>;

export type RemoveEmptyString<TString> = Exclude<TString, "">;

export type InferParamFromPath<TPath> =
	TPath extends `${infer IgnoredPrefix}:${infer TCurrentParam}/${infer TRemainingPath}`
		? TRemainingPath extends `${string}:${string}`
			?
					| [AllowedQueryParamValues, ...Extract<InferParamFromPath<TRemainingPath>, unknown[]>]
					| {
							[Param in
								| TCurrentParam
								| keyof Extract<
										InferParamFromPath<TRemainingPath>,
										Record<string, unknown>
								  > as RemoveEmptyString<Param>]: AllowedQueryParamValues;
					  }
			: [AllowedQueryParamValues] | { [ParamKey in TCurrentParam]: AllowedQueryParamValues }
		: TPath extends `${infer IgnoredPrefix}:${infer TCurrentParam}`
			? [AllowedQueryParamValues] | { [ParamKey in TCurrentParam]: AllowedQueryParamValues }
			: TPath extends `${infer IgnoredPrefix}/${infer TRemainingPath}`
				? InferParamFromPath<TRemainingPath>
				: Params;

export type InferParamsOption<TPath, TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["params"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		params?: InferSchemaResult<TSchemas["params"], InferParamFromPath<TPath>>;
	}
>;

export type InferExtraOptions<TSchemas extends CallApiSchemas, TPath> = InferMetaOption<TSchemas>
	& InferParamsOption<TPath, TSchemas>
	& InferQueryOption<TSchemas>;

type ExtractKeys<T, U extends T> = Extract<T, U>;

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
