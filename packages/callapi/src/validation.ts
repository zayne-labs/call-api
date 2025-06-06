/* eslint-disable ts-eslint/consistent-type-definitions -- I need to use interfaces for the sake of user overrides */
import type {
	Body,
	CallApiExtraOptions,
	CallApiRequestOptions,
	GlobalMeta,
	HeadersOption,
	MethodUnion,
} from "./types";
import type { StandardSchemaV1 } from "./types/standard-schema";
import {
	type AnyFunction,
	type AnyString,
	type Awaitable,
	type Prettify,
	type UnionToIntersection,
	type Writeable,
	defineEnum,
} from "./types/type-helpers";
import type { Params, Query } from "./url";
import { isFunction, isObject } from "./utils/guards";

type InferSchemaInput<TSchema extends CallApiSchema[keyof CallApiSchema]> =
	TSchema extends StandardSchemaV1
		? StandardSchemaV1.InferInput<TSchema>
		: TSchema extends (value: infer TInput) => unknown
			? TInput
			: never;

export type InferSchemaResult<TSchema, TFallbackResult = NonNullable<unknown>> = undefined extends TSchema
	? TFallbackResult
	: TSchema extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<TSchema>
		: TSchema extends AnyFunction<infer TResult>
			? Awaited<TResult>
			: TFallbackResult;

const validationErrorSymbol = Symbol("validationErrorSymbol");

type ValidationErrorDetails = {
	issues: readonly StandardSchemaV1.Issue[];
	response: Response | null;
};

const formatPath = (path: StandardSchemaV1.Issue["path"]) => {
	if (!path || path.length === 0) {
		return "";
	}

	return ` → at ${path.map((segment) => (isObject(segment) ? segment.key : String(segment))).join(".")}`;
};

const formatValidationIssues = (issues: ValidationError["errorData"]) => {
	return issues.map((issue) => `✖ ${issue.message}${formatPath(issue.path)}`).join(" | ");
};

export class ValidationError extends Error {
	errorData: readonly StandardSchemaV1.Issue[];

	override name = "ValidationError";

	response: Response | null;

	validationErrorSymbol = validationErrorSymbol;

	constructor(details: ValidationErrorDetails, errorOptions?: ErrorOptions) {
		const { issues, response } = details;

		const message = formatValidationIssues(issues);

		super(message, errorOptions);

		this.errorData = issues;
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

const handleValidatorFunction = async <TInput>(
	validator: Extract<CallApiSchema[keyof CallApiSchema], AnyFunction>,
	inputData: TInput
): Promise<StandardSchemaV1.Result<TInput>> => {
	try {
		const result = await validator(inputData as never);

		return { issues: undefined, value: result as never };
	} catch (error) {
		return { issues: error as never, value: undefined };
	}
};

export const standardSchemaParser = async <
	TSchema extends NonNullable<CallApiSchema[keyof CallApiSchema]>,
>(
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
	 * Disables runtime validation for the schema.
	 */
	disableRuntimeValidation?: boolean;

	/**
	 * If `true`, the original input value will be used instead of the transformed/validated output.
	 *
	 * This is useful when you want to validate the input but don't want any transformations
	 * applied by the validation schema (e.g., type coercion, default values, etc).
	 */
	disableValidationOutputApplication?: boolean;

	/**
	 * Controls the inference of the method option based on the route modifiers (`@get/`, `@post/`, `@put/`, `@patch/`, `@delete/`).
	 *
	 * - When `true`, the method option is made required on the type level and is not automatically added to the request options.
	 * - When `false` or `undefined` (default), the method option is not required on the type level, and is automatically added to the request options.
	 *
	 */
	requireHttpMethodProvision?: boolean;

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

export interface CallApiSchema {
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
	headers?:
		| StandardSchemaV1<HeadersOption | undefined>
		| ((headers: HeadersOption) => Awaitable<HeadersOption>);

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

export const routeKeyMethods = defineEnum(["delete", "get", "patch", "post", "put"]);

export type RouteKeyMethods = (typeof routeKeyMethods)[number];

type PossibleRouteKey = `@${RouteKeyMethods}/` | AnyString;

export type BaseCallApiSchema = {
	[Key in PossibleRouteKey]?: CallApiSchema;
};

export const defineSchema = <const TBaseSchema extends BaseCallApiSchema>(baseSchema: TBaseSchema) => {
	return baseSchema as Writeable<typeof baseSchema, "deep">;
};

type ValidationOptions<
	TSchema extends CallApiSchema[keyof CallApiSchema] = CallApiSchema[keyof CallApiSchema],
> = {
	inputValue: InferSchemaInput<TSchema>;
	response?: Response | null;
	schemaConfig: CallApiSchemaConfig | undefined;
};

export const handleValidation = async <TSchema extends CallApiSchema[keyof CallApiSchema]>(
	schema: TSchema | undefined,
	validationOptions: ValidationOptions<TSchema>
): Promise<InferSchemaResult<TSchema>> => {
	const { inputValue, response, schemaConfig } = validationOptions;

	if (!schema || schemaConfig?.disableRuntimeValidation) {
		return inputValue as never;
	}

	const validResult = await standardSchemaParser(schema, inputValue, response);

	return validResult as never;
};

type LastOf<TValue> =
	UnionToIntersection<TValue extends unknown ? () => TValue : never> extends () => infer R ? R : never;

type Push<TArray extends unknown[], TArrayItem> = [...TArray, TArrayItem];

type UnionToTuple<
	TUnion,
	TComputedLastUnion = LastOf<TUnion>,
	TComputedIsUnionEqualToNever = [TUnion] extends [never] ? true : false,
> = true extends TComputedIsUnionEqualToNever
	? []
	: Push<UnionToTuple<Exclude<TUnion, TComputedLastUnion>>, TComputedLastUnion>;

export type Tuple<
	TTuple,
	TArray extends TTuple[] = [],
> = UnionToTuple<TTuple>["length"] extends TArray["length"]
	? [...TArray]
	: Tuple<TTuple, [TTuple, ...TArray]>;

const extraOptionsToBeValidated = ["meta", "params", "query"] satisfies Tuple<
	Extract<keyof CallApiSchema, keyof CallApiExtraOptions>
>;

type ExtraOptionsValidationOptions = {
	extraOptions: CallApiExtraOptions;
	schema: CallApiSchema | undefined;
	schemaConfig: CallApiSchemaConfig | undefined;
};

const handleExtraOptionsValidation = async (validationOptions: ExtraOptionsValidationOptions) => {
	const { extraOptions, schema, schemaConfig } = validationOptions;

	const validationResultArray = await Promise.all(
		extraOptionsToBeValidated.map((propertyKey) =>
			handleValidation(schema?.[propertyKey], {
				inputValue: extraOptions[propertyKey],
				schemaConfig,
			})
		)
	);

	const validatedResultObject: Prettify<
		Pick<CallApiExtraOptions, (typeof extraOptionsToBeValidated)[number]>
	> = {};

	for (const [index, propertyKey] of extraOptionsToBeValidated.entries()) {
		const validationResult = validationResultArray[index];

		if (validationResult === undefined) continue;

		validatedResultObject[propertyKey] = validationResult as never;
	}

	return validatedResultObject;
};

const requestOptionsToBeValidated = ["body", "headers", "method"] satisfies Tuple<
	Extract<keyof CallApiSchema, keyof CallApiRequestOptions>
>;

type RequestOptionsValidationOptions = {
	requestOptions: CallApiRequestOptions;
	schema: CallApiSchema | undefined;
	schemaConfig: CallApiSchemaConfig | undefined;
};

const handleRequestOptionsValidation = async (validationOptions: RequestOptionsValidationOptions) => {
	const { requestOptions, schema, schemaConfig } = validationOptions;

	const validationResultArray = await Promise.all(
		requestOptionsToBeValidated.map((propertyKey) =>
			handleValidation(schema?.[propertyKey], {
				inputValue: requestOptions[propertyKey],
				schemaConfig,
			})
		)
	);

	const validatedResultObject: Prettify<
		Pick<CallApiRequestOptions, (typeof requestOptionsToBeValidated)[number]>
	> = {};

	for (const [index, propertyKey] of requestOptionsToBeValidated.entries()) {
		const validationResult = validationResultArray[index];

		if (validationResult === undefined) continue;

		validatedResultObject[propertyKey] = validationResult as never;
	}

	return validatedResultObject;
};

export const handleOptionsValidation = async (
	validationOptions: ExtraOptionsValidationOptions & RequestOptionsValidationOptions
) => {
	const { extraOptions, requestOptions, schema, schemaConfig } = validationOptions;

	if (schemaConfig?.disableRuntimeValidation) {
		return {
			extraOptionsValidationResult: null,
			requestOptionsValidationResult: null,
		};
	}

	const [extraOptionsValidationResult, requestOptionsValidationResult] = await Promise.all([
		handleExtraOptionsValidation({ extraOptions, schema, schemaConfig }),
		handleRequestOptionsValidation({ requestOptions, schema, schemaConfig }),
	]);

	return { extraOptionsValidationResult, requestOptionsValidationResult };
};
