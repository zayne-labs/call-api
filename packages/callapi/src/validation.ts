/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { Body, GlobalMeta, Headers, MethodUnion } from "./types";
import type { StandardSchemaV1 } from "./types/standard-schema";
import { type AnyString, defineEnum } from "./types/type-helpers";
import type { Params, Query } from "./url";

export const standardSchemaParser = async <TSchema extends StandardSchemaV1>(
	schema: TSchema,
	inputData: StandardSchemaV1.InferInput<TSchema>
): Promise<StandardSchemaV1.InferOutput<TSchema>> => {
	const result = await schema["~standard"].validate(inputData);

	// == If the `issues` field exists, it means the validation failed
	if (result.issues) {
		throw new Error(JSON.stringify(result.issues, null, 2), { cause: result.issues });
	}

	return result.value;
};

export interface CallApiSchemaConfig {
	/**
	 * The base url of the schema. By default it's the baseURL of the fetch instance.
	 */
	baseURL?: string;

	/**
	 * Controls the inference of the method option based on the route modifiers (`@get/`, `@post/`, `@put/`, `@patch/`, `@delete/`).
	 *
	 * - When `true`, the method option is made required on the type level.
	 * - When `false` or `undefined`, the method option is not required on the type level.
	 *
	 * By default, the method modifier is automatically added to the request options.
	 *
	 */
	requireMethodOption?: boolean;

	/**
	 * Controls the strictness of API route validation.
	 *
	 * When true:
	 * - Only routes explicitly defined in the schema will be considered valid to typescript
	 * - Attempting to call undefined routes will result in type errors
	 * - Useful for ensuring API calls conform exactly to your schema definition
	 *
	 * When false or undefined (default):
	 * - All routes will be allowed, whether they are defined in the schema or not
	 * - Provides more flexibility but less type safety
	 *
	 * @default false
	 */
	strict?: boolean;
}

export const routeKeyMethods = defineEnum(["delete", "get", "patch", "post", "put"]);

export type RouteKeyMethods = (typeof routeKeyMethods)[number];

type RouteKey = `@${RouteKeyMethods}/${AnyString}` | AnyString;

export interface CallApiSchema {
	/**
	 *  The schema to use for validating the request body.
	 */
	body?: StandardSchemaV1<Body>;

	/**
	 *  The schema to use for validating the response data.
	 */
	data?: StandardSchemaV1;

	/**
	 *  The schema to use for validating the response error data.
	 */
	errorData?: StandardSchemaV1;

	/**
	 *  The schema to use for validating the request headers.
	 */
	headers?: StandardSchemaV1<Headers | undefined>;

	/**
	 *  The schema to use for validating the meta option.
	 */
	meta?: StandardSchemaV1<GlobalMeta | undefined>;

	/**
	 *  The schema to use for validating the request method.
	 */
	method?: StandardSchemaV1<MethodUnion | undefined>;

	/**
	 *  The schema to use for validating the request url parameters.
	 */
	params?: StandardSchemaV1<Params | undefined>;

	/**
	 *  The schema to use for validating the request url queries.
	 */
	query?: StandardSchemaV1<Query | undefined>;
}

type BaseSchemaRoutes = {
	[key in RouteKey]?: CallApiSchema;
};

export interface BaseCallApiSchema {
	/**
	 * Base schema configuration options
	 */
	config?: CallApiSchemaConfig;

	/**
	 * Schema routes
	 */
	routes: BaseSchemaRoutes;
}

export interface CallApiValidators<TData = unknown, TErrorData = unknown> {
	/**
	 * Custom function to validate the response data.
	 */
	data?: (value: unknown) => TData;

	/**
	 * Custom function to validate the response error data, stemming from the api.
	 * This only runs if the api actually sends back error status codes, else it will be ignored, in which case you should only use the `responseValidator` option.
	 */
	errorData?: (value: unknown) => TErrorData;
}

export type InferSchemaResult<TSchema, TData = NonNullable<unknown>> = TSchema extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<TSchema>
	: TData;

export const handleValidation = async (
	responseData: unknown,
	schema: CallApiSchema[keyof NonNullable<CallApiSchema>]
) => {
	const schemaValidResponseData = schema
		? await standardSchemaParser(schema, responseData)
		: responseData;

	return schemaValidResponseData;
};
