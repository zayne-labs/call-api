/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { Body, GlobalMeta, Headers, Method } from "./types";
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

export interface SchemaConfig {
	/**
	 * The base url of the schema. By default it's the baseURL of the fetch instance.
	 */
	baseURL?: string;

	/**
	 * When true, requires the appropriate method option to be specified as obtained from the route modifiers (`@get/`, `@post/`, `@put/`, `@patch/`, `@delete/`).
	 *
	 * By default, the method option is automatically added to the request options.
	 *
	 * @default false
	 */
	requireMethodFromRouteModifier?: boolean;

	/**
	 * Controls the strictness of API route validation.
	 *
	 * When true:
	 * - Only routes explicitly defined in the schema will be considered valid
	 * - Attempting to call undefined routes will result in validation errors
	 * - Useful for ensuring API calls conform exactly to your schema definition
	 *
	 * When false (default):
	 * - Routes not defined in the schema will be allowed
	 * - Provides more flexibility but less type safety
	 *
	 * @default false
	 */
	strict?: boolean;
}

export const routeKeyMethods = defineEnum(["delete", "get", "patch", "post", "put"]);

export type RouteKeyMethods = (typeof routeKeyMethods)[number];

type RouteKey = `@${RouteKeyMethods}/${AnyString}` | AnyString;

type SchemaShape = {
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
	method?: StandardSchemaV1<Method | undefined>;

	/**
	 *  The schema to use for validating the request url parameter.
	 */
	params?: StandardSchemaV1<Params | undefined>;

	/**
	 *  The schema to use for validating the request url querys.
	 */
	query?: StandardSchemaV1<Query | undefined>;
};

type BaseSchemaRoutes = {
	[key in RouteKey]?: SchemaShape;
};

export interface BaseCallApiSchemas {
	/**
	 * Base schema configuration options
	 */
	config?: SchemaConfig;

	/**
	 * Schema routes
	 */
	routes: BaseSchemaRoutes;
}

export interface CallApiSchemas {
	config?: SchemaConfig;
	currentRoute: SchemaShape;
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

const identity = <T>(value: T) => value;

export const handleValidation = async (
	responseData: unknown,
	schema: CallApiSchemas["currentRoute"][keyof NonNullable<CallApiSchemas>["currentRoute"]],
	validator: CallApiValidators[keyof NonNullable<CallApiValidators>] = identity
) => {
	const validResponseData = validator(responseData);

	const schemaValidResponseData = schema
		? await standardSchemaParser(schema, validResponseData)
		: validResponseData;

	return schemaValidResponseData;
};
