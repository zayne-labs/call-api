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
	Prettify,
	UnmaskType,
} from "./type-helpers";

/**
 * @description Makes a type required if the output type of TSchema contains undefined, otherwise keeps it as is
 */
type MakeSchemaOptionRequired<TSchema extends StandardSchemaV1 | undefined, TObject> =
	undefined extends InferSchemaResult<TSchema, undefined> ? TObject : Required<TObject>;

type ExtractString<TValue> = Extract<TValue, string>;

export type InferRouteKeys<TBaseSchema extends BaseCallApiSchemas> = NonNullable<
	TBaseSchema["config"]
>["baseURL"] extends string
	? `${NonNullable<TBaseSchema["config"]>["baseURL"]}${keyof TBaseSchema["routes"] extends string
			? ExtractString<keyof TBaseSchema["routes"]>
			: never}`
	: keyof TBaseSchema["routes"] extends string
		? keyof TBaseSchema["routes"]
		: never;

export type InferInitURL<TBaseSchema extends BaseCallApiSchemas> = InferRouteKeys<TBaseSchema> | URL;

export type ExtractMainRouteKey<TBaseSchemas extends BaseCallApiSchemas, TPath> = NonNullable<
	TBaseSchemas["config"]
>["baseURL"] extends string
	? TPath extends `${NonNullable<TBaseSchemas["config"]>["baseURL"]}${infer TMainRoute}`
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
	TSchemas["currentRoute"]["body"],
	{
		/**
		 * Body of the request, can be a object or any other supported body type.
		 */
		body?: InferSchemaResult<TSchemas["currentRoute"]["body"], Body>;
	}
>;

export type MethodUnion = UnmaskType<
	"CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE" | AnyString
>;

type InferMethodFromURL<TInitURL> =
	TInitURL extends `@${infer TMethod extends Lowercase<RouteKeyMethods>}/${string}`
		? Uppercase<TMethod>
		: MethodUnion;

type MakeMethodOptionRequired<TInitURL, TMakeMethodRequired, TObject> =
	TInitURL extends `@${string}/${string}`
		? TMakeMethodRequired extends true
			? Required<TObject>
			: TObject
		: TObject;

export type InferMethodOption<TSchemas extends CallApiSchemas, TInitURL> = MakeSchemaOptionRequired<
	TSchemas["currentRoute"]["method"],
	MakeMethodOptionRequired<
		TInitURL,
		NonNullable<TSchemas["config"]>["requireMethodFromRouteModifier"],
		{
			/**
			 * HTTP method for the request.
			 * @default "GET"
			 */
			method?: InferSchemaResult<TSchemas["currentRoute"]["method"], InferMethodFromURL<TInitURL>>;
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
	TSchemas["currentRoute"]["headers"],
	{
		/**
		 * Headers to be used in the request.
		 */
		headers?: InferSchemaResult<TSchemas["currentRoute"]["headers"], Headers>;
	}
>;

export type InferRequestOptions<
	TSchemas extends CallApiSchemas,
	TInitURL extends InferInitURL<BaseCallApiSchemas>,
> = InferBodyOption<TSchemas> & InferHeadersOption<TSchemas> & InferMethodOption<TSchemas, TInitURL>;

// eslint-disable-next-line ts-eslint/no-empty-object-type -- This needs to be empty to allow users to register their own meta
export interface Register {
	// == meta: Meta
}

export type GlobalMeta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export type InferMetaOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["currentRoute"]["meta"],
	{ meta?: InferSchemaResult<TSchemas["currentRoute"]["meta"], GlobalMeta> }
>;

export type InferQueryOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["currentRoute"]["query"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		query?: InferSchemaResult<TSchemas["currentRoute"]["query"], Query>;
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

export type InferParamsOption<TPath, TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["currentRoute"]["params"],
	{
		/**
		 * Parameters to be appended to the URL (i.e: /:id)
		 */
		params?: InferSchemaResult<TSchemas["currentRoute"]["params"], InferParamFromPath<TPath>>;
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
