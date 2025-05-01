import type { CallApiResultErrorVariant } from "@/types";
import { HTTPError, type PossibleHTTPError } from "../error";
import type { AnyFunction } from "./type-helpers";

export const isHTTPError = <TErrorData>(
	error: CallApiResultErrorVariant<TErrorData>["error"] | null
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

// FIXME: Outsource to type-helpers later as a peer dependency

export const isArray = <TArrayItem>(value: unknown): value is TArrayItem[] => Array.isArray(value);

export const isObject = (value: unknown) => typeof value === "object" && value !== null;

const hasObjectPrototype = (value: unknown) => {
	return Object.prototype.toString.call(value) === "[object Object]";
};

/**
 * @description Copied from TanStack Query's isPlainObject
 * @see https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L321
 */
export const isPlainObject = <TPlainObject extends Record<string, unknown>>(
	value: unknown
): value is TPlainObject => {
	if (!hasObjectPrototype(value)) {
		return false;
	}

	// If has no constructor
	const constructor = (value as object | undefined)?.constructor;
	if (constructor === undefined) {
		return true;
	}

	// If has modified prototype
	const prototype = constructor.prototype as object;
	if (!hasObjectPrototype(prototype)) {
		return false;
	}

	// If constructor does not have an Object-specific method
	if (!Object.hasOwn(prototype, "isPrototypeOf")) {
		return false;
	}

	// Handles Objects created by Object.create(<arbitrary prototype>)
	if (Object.getPrototypeOf(value) !== Object.prototype) {
		return false;
	}

	// It's probably a plain object at this point
	return true;
};

export const isJsonString = (value: unknown): value is string => {
	if (!isString(value)) {
		return false;
	}

	try {
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
};

export const isSerializable = (value: unknown) => {
	return (
		isPlainObject(value)
		|| isArray(value)
		|| typeof (value as { toJSON: unknown } | undefined)?.toJSON === "function"
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
		(value?.constructor && value.constructor.name === "Object")
		// eslint-disable-next-line ts-eslint/prefer-nullish-coalescing -- Nullish coalescing makes no sense in this boolean context
		|| typeof (value as { toJSON: () => unknown } | null)?.toJSON === "function"
	);
};

export const isReadableStream = (value: unknown): value is ReadableStream<unknown> => {
	return value instanceof ReadableStream;
};
