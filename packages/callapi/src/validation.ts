/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { CombinedCallApiExtraOptions } from "./types";

export const standardSchemaParser = async <TSchema extends StandardSchemaV1>(
	schema: TSchema,
	inputData: StandardSchemaV1.InferInput<TSchema>
): Promise<StandardSchemaV1.InferOutput<TSchema>> => {
	const result = await schema["~standard"].validate(inputData);

	// == If the `issues` field exists, it means the validation failed
	if (result.issues) {
		throw new Error(JSON.stringify(result.issues, null, 2));
	}

	return result.value;
};

export interface Schemas {
	/**
	 *  The schema to use for validating the response data.
	 */
	data?: StandardSchemaV1;

	/**
	 *  The schema to use for validating the response error data.
	 */
	errorData?: StandardSchemaV1;
}

export interface Validators<TData = unknown, TErrorData = unknown> {
	/**
	 * Custom function to validate the response data.
	 */
	data?: (data: unknown) => TData;

	/**
	 * Custom function to validate the response error data, stemming from the api.
	 * This only runs if the api actually sends back error status codes, else it will be ignored, in which case you should only use the `responseValidator` option.
	 */
	errorData?: (data: unknown) => TErrorData;
}

export type InferSchemaResult<
	TSchema extends StandardSchemaV1 | undefined,
	TData,
> = TSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<TSchema> : TData;

export const createExtensibleSchemasAndValidators = (options: CombinedCallApiExtraOptions) => {
	const schemas = options.schemas
		? ({ ...options.schemas, ...options.extend?.schemas } as Schemas)
		: undefined;

	const validators = options.validators
		? { ...options.validators, ...options.extend?.validators }
		: undefined;

	return { schemas, validators };
};
