/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { ResultModeUnion } from "../result";
import type {
	AnyString,
	CommonAuthorizationHeaders,
	CommonContentTypes,
	CommonRequestHeaders,
	UnmaskType,
} from "../utils/type-helpers";
import type { CallApiSchemas, InferSchemaResult } from "../validation";
import type { StandardSchemaV1 } from "./standard-schema";

/**
 * @description Makes a type required if TSchema type is undefined or if the output type of TSchema contains undefined, otherwise keeps it as is
 */
type MakeSchemaOptionRequired<
	TSchema extends StandardSchemaV1 | undefined,
	TObject,
> = undefined extends TSchema
	? TObject
	: undefined extends InferSchemaResult<TSchema>
		? TObject
		: Required<TObject>;

type JsonPrimitive = boolean | number | string | null | undefined;

export type SerializableObject = Record<keyof object, unknown>;

export type SerializableArray =
	| Array<JsonPrimitive | SerializableArray | SerializableObject>
	| ReadonlyArray<JsonPrimitive | SerializableArray | SerializableObject>;

export type Body = UnmaskType<RequestInit["body"] | SerializableArray | SerializableObject>;

export type BodyOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["body"],
	{
		/**
		 * Body of the request, can be a object or any other supported body type.
		 */
		body?: InferSchemaResult<TSchemas["body"], Body>;
	}
>;

export type Method = UnmaskType<
	"CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE" | AnyString
>;

export type MethodOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["method"],
	{
		/**
		 * HTTP method for the request.
		 * @default "GET"
		 */
		method?: InferSchemaResult<TSchemas["method"], Method>;
	}
>;

export type Headers = UnmaskType<
	| Record<"Authorization", CommonAuthorizationHeaders>
	| Record<"Content-Type", CommonContentTypes>
	| Record<CommonRequestHeaders, string | undefined>
	| Record<string, string | undefined>
	| RequestInit["headers"]
>;

export type HeadersOption<TSchemas extends CallApiSchemas> = MakeSchemaOptionRequired<
	TSchemas["headers"],
	{
		/**
		 * Headers to be used in the request.
		 */
		headers?: InferSchemaResult<TSchemas["headers"], Headers>;
	}
>;

// eslint-disable-next-line ts-eslint/no-empty-object-type -- This needs to be empty to allow users to register their own meta
export interface Register {
	// == meta: Meta
}

export type GlobalMeta = Register extends { meta?: infer TMeta extends Record<string, unknown> }
	? TMeta
	: never;

export type MetaOption<TSchemas extends CallApiSchemas> = {
	/**
	 * - An optional field you can fill with additional information,
	 * to associate with the request, typically used for logging or tracing.
	 *
	 * - A good use case for this, would be to use the info to handle specific cases in any of the shared interceptors.
	 *
	 * @example
	 * ```ts
	 * const callMainApi = callApi.create({
	 * 	baseURL: "https://main-api.com",
	 * 	onResponseError: ({ response, options }) => {
	 * 		if (options.meta?.userId) {
	 * 			console.error(`User ${options.meta.userId} made an error`);
	 * 		}
	 * 	},
	 * });
	 *
	 * const response = await callMainApi({
	 * 	url: "https://example.com/api/data",
	 * 	meta: { userId: "123" },
	 * });
	 * ```
	 */
	meta?: InferSchemaResult<TSchemas["meta"], GlobalMeta>;
};

export type ResultModeOption<TErrorData, TResultMode extends ResultModeUnion> = TErrorData extends false
	? { resultMode: "onlySuccessWithException" }
	: TErrorData extends false | undefined
		? { resultMode?: "onlySuccessWithException" }
		: null extends TResultMode
			? { resultMode?: TResultMode }
			: { resultMode: TResultMode };
