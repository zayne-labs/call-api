/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { Body, GlobalMeta, Headers, Method } from "./types";
import type { StandardSchemaV1 } from "./types/standard-schema";
import type { InitURL, Params, Query } from "./url";

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

export interface CallApiSchemas {
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
	headers?: StandardSchemaV1<Headers>;

	/**
	 *  The schema to use for validating the request url.
	 */
	initURL?: StandardSchemaV1<InitURL>;

	/**
	 *  The schema to use for validating the meta option.
	 */
	meta?: StandardSchemaV1<GlobalMeta>;

	/**
	 *  The schema to use for validating the request method.
	 */
	method?: StandardSchemaV1<Method>;

	/**
	 *  The schema to use for validating the request url parameter.
	 */
	params?: StandardSchemaV1<Params>;

	/**
	 *  The schema to use for validating the request url querys.
	 */
	query?: StandardSchemaV1<Query>;
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

export type InferSchemaResult<TSchema, TData> = TSchema extends StandardSchemaV1
	? StandardSchemaV1.InferOutput<TSchema>
	: TData;

export const handleValidation = async (
	responseData: unknown,
	schema: CallApiSchemas[keyof NonNullable<CallApiSchemas>],
	validator?: CallApiValidators[keyof NonNullable<CallApiValidators>]
) => {
	const validResponseData = validator ? validator(responseData) : responseData;

	const schemaValidResponseData = schema
		? await standardSchemaParser(schema, validResponseData)
		: validResponseData;

	return schemaValidResponseData;
};
