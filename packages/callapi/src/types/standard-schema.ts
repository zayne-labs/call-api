/* eslint-disable ts-eslint/consistent-type-definitions -- Allow */
/* eslint-disable ts-eslint/no-namespace -- Allow */

/**
 * The Standard Schema interface.
 * @see https://github.com/standard-schema/standard-schema
 */
interface StandardSchemaV1<Input = unknown, Output = Input> {
	/**
	 * The Standard Schema properties.
	 */
	readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

declare namespace StandardSchemaV1 {
	/**
	 * The Standard Schema properties interface.
	 */
	export interface Props<Input = unknown, Output = Input> {
		/**
		 * Inferred types associated with the schema.
		 */
		readonly types?: Types<Input, Output> | undefined;
		/**
		 * Validates unknown input values.
		 */
		readonly validate: (value: unknown) => Promise<Result<Output>> | Result<Output>;
		/**
		 * The vendor name of the schema library.
		 */
		readonly vendor: string;
		/**
		 * The version number of the standard.
		 */
		readonly version: 1;
	}

	/**
	 * The result interface of the validate function.
	 */
	export type Result<Output> = FailureResult | SuccessResult<Output>;

	/**
	 * The result interface if validation succeeds.
	 */
	export interface SuccessResult<Output> {
		/**
		 * The non-existent issues.
		 */
		readonly issues?: undefined;
		/**
		 * The typed output value.
		 */
		readonly value: Output;
	}

	/**
	 * The result interface if validation fails.
	 */
	export interface FailureResult {
		/**
		 * The issues of failed validation.
		 */
		readonly issues: readonly Issue[];
	}

	/**
	 * The issue interface of the failure output.
	 */
	export interface Issue {
		/**
		 * The error message of the issue.
		 */
		readonly message: string;
		/**
		 * The path of the issue, if any.
		 */
		readonly path?: ReadonlyArray<PathSegment | PropertyKey> | undefined;
	}

	/**
	 * The path segment interface of the issue.
	 */
	export interface PathSegment {
		/**
		 * The key representing a path segment.
		 */
		readonly key: PropertyKey;
	}

	/**
	 * The Standard Schema types interface.
	 */
	export interface Types<Input = unknown, Output = Input> {
		/** The input type of the schema. */
		readonly input: Input;
		/** The output type of the schema. */
		readonly output: Output;
	}

	/**
	 * Infers the input type of a Standard Schema.
	 */
	export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
		Schema["~standard"]["types"]
	>["input"];

	/**
	 * Infers the output type of a Standard Schema.
	 */
	export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
		Schema["~standard"]["types"]
	>["output"];
}

export type { StandardSchemaV1 };
