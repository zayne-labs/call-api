/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type { Body, GlobalMeta, Headers, MethodUnion } from "./types";
import type { StandardSchemaV1 } from "./types/standard-schema";
import { type AnyFunction, type AnyString, type Awaitable, defineEnum } from "./types/type-helpers";
import type { Params, Query } from "./url";
import { isFunction, isObject } from "./utils/guards";

type InferSchemaInput<TSchema extends SchemaShape[keyof SchemaShape]> = TSchema extends StandardSchemaV1
	? StandardSchemaV1.InferInput<TSchema>
	: TSchema extends (value: infer TInput) => unknown
		? TInput
		: never;

export type InferSchemaResult<TSchema, TFallbackResult = NonNullable<unknown>> = undefined extends TSchema
	? TFallbackResult
	: TSchema extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<TSchema>
		: TSchema extends AnyFunction<infer TResult>
			? TResult
			: TFallbackResult;

const handleValidatorFunction = async <TInput>(
	validator: Extract<SchemaShape[keyof SchemaShape], AnyFunction>,
	inputData: TInput
): Promise<StandardSchemaV1.Result<TInput>> => {
	try {
		const result = await validator(inputData as never);

		return { issues: undefined, value: result as never };
	} catch (error) {
		return { issues: error as never, value: undefined };
	}
};

const validationErrorSymbol = Symbol("validationErrorSymbol");

type ValidationErrorDetails = {
	issues: readonly StandardSchemaV1.Issue[];
	response: Response | null;
};

export class ValidationError extends Error {
	issues: readonly StandardSchemaV1.Issue[];

	override name = "ValidationError";

	response: Response | null;

	validationErrorSymbol = validationErrorSymbol;

	constructor(details: ValidationErrorDetails, errorOptions?: ErrorOptions) {
		const { issues, response } = details;

		super(`Validation failed: ${JSON.stringify(issues, null, 2)}`, errorOptions);

		this.issues = issues;
		this.response = response;

		Error.captureStackTrace(this, this.constructor);
	}

	/**
	 * @description Checks if the given error is an instance of HTTPError
	 * @param error - The error to check
	 * @returns true if the error is an instance of HTTPError, false otherwise
	 */
	static isError(error: unknown): error is ValidationError {
		if (!isObject<Record<string, unknown>>(error)) {
			return false;
		}

		if (error instanceof ValidationError) {
			return true;
		}

		return error.validationErrorSymbol === validationErrorSymbol && error.name === "ValidationError";
	}
}

export const standardSchemaParser = async <TSchema extends NonNullable<SchemaShape[keyof SchemaShape]>>(
	schema: TSchema,
	inputData: InferSchemaInput<TSchema>,
	response?: Response | null
): Promise<InferSchemaResult<TSchema>> => {
	const result = isFunction(schema)
		? await handleValidatorFunction(schema, inputData)
		: await schema["~standard"].validate(inputData);

	// == If the `issues` field exists, it means the validation failed
	if (result.issues) {
		throw new ValidationError(
			{ issues: result.issues, response: response ?? null },
			{ cause: result.issues }
		);
	}

	return result.value as never;
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

export interface SchemaShape {
	/**
	 *  The schema to use for validating the request body.
	 */
	body?: StandardSchemaV1<Body> | ((body: Body) => Awaitable<Body>);

	/**
	 *  The schema to use for validating the response data.
	 */
	data?: StandardSchemaV1 | ((data: unknown) => unknown);

	/**
	 *  The schema to use for validating the response error data.
	 */
	errorData?: StandardSchemaV1 | ((errorData: unknown) => unknown);

	/**
	 *  The schema to use for validating the request headers.
	 */
	headers?: StandardSchemaV1<Headers | undefined> | ((headers: Headers) => Awaitable<Headers>);

	/**
	 *  The schema to use for validating the meta option.
	 */
	meta?: StandardSchemaV1<GlobalMeta | undefined> | ((meta: GlobalMeta) => Awaitable<GlobalMeta>);

	/**
	 *  The schema to use for validating the request method.
	 */
	method?: StandardSchemaV1<MethodUnion | undefined> | ((method: MethodUnion) => Awaitable<MethodUnion>);

	/**
	 *  The schema to use for validating the request url parameters.
	 */
	params?: StandardSchemaV1<Params | undefined> | ((params: Params) => Awaitable<Params>);

	/**
	 *  The schema to use for validating the request url queries.
	 */
	query?: StandardSchemaV1<Query | undefined> | ((query: Query) => Awaitable<Query>);
}

type BaseSchemaRoutes = {
	[key in RouteKey]?: SchemaShape;
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

export type CallApiSchema = SchemaShape;

export const handleValidation = async <TSchema extends SchemaShape[keyof SchemaShape]>(
	schema: TSchema | undefined,
	inputValue: InferSchemaInput<TSchema>,
	response?: Response | null
) => {
	const validResult = schema ? await standardSchemaParser(schema, inputValue, response) : inputValue;

	return validResult as InferSchemaResult<TSchema>;
};
