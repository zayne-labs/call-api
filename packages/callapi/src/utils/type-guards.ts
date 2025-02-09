import { HTTPError } from "@/error";
import type { PossibleHTTPError, PossibleJavaScriptError } from "@/types/common";
import type { AnyFunction } from "./type-helpers";

type ErrorObjectUnion<TErrorData = unknown> = PossibleHTTPError<TErrorData> | PossibleJavaScriptError;

export const isHTTPError = <TErrorData>(
	error: ErrorObjectUnion<TErrorData> | null
): error is PossibleHTTPError<TErrorData> => {
	return isPlainObject(error) && error.name === "HTTPError";
};

export const isHTTPErrorInstance = <TErrorResponse>(
	error: unknown
): error is HTTPError<TErrorResponse> => {
	return (
		// prettier-ignore
		error instanceof HTTPError|| (isPlainObject(error) && error.name === "HTTPError" && error.isHTTPError === true)
	);
};

export const isArray = <TArrayItem>(value: unknown): value is TArrayItem[] => Array.isArray(value);

export const isObject = (value: unknown) => typeof value === "object" && value !== null;

export const isPlainObject = <TPlainObject extends Record<string, unknown>>(
	value: unknown
): value is TPlainObject => {
	if (!isObject(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value) as unknown;

	// Check if it's a plain object
	return (
		// prettier-ignore
		(prototype == null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value)
	);
};

export const isFunction = <TFunction extends AnyFunction>(value: unknown): value is TFunction =>
	typeof value === "function";

export const isQueryString = (value: unknown): value is string => isString(value) && value.includes("=");

export const isString = (value: unknown) => typeof value === "string";

// https://github.com/unjs/ofetch/blob/main/src/utils.ts
// TODO Find a way to incorporate this function in checking when to apply the bodySerializer on the body and also whether to add the content type application/json
export const isJSONSerializable = (value: unknown) => {
	if (value === undefined) {
		return false;
	}
	const t = typeof value;
	// eslint-disable-next-line ts-eslint/no-unnecessary-condition -- No time to make this more type-safe
	if (t === "string" || t === "number" || t === "boolean" || t === null) {
		return true;
	}
	if (t !== "object") {
		return false;
	}
	if (isArray(value)) {
		return true;
	}
	if ((value as Buffer | null)?.buffer) {
		return false;
	}

	return (
		// eslint-disable-next-line ts-eslint/prefer-nullish-coalescing -- Nullish coalescing makes no sense in this boolean context
		(value?.constructor && value.constructor.name === "Object") ||
		typeof (value as { toJSON: () => unknown } | null)?.toJSON === "function"
	);
};
