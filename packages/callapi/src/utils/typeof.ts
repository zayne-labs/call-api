import type { AnyFunction } from "./type-helpers";

export const isArray = <TArrayItem>(value: unknown): value is TArrayItem[] => Array.isArray(value);

export const isObject = <TObject extends object>(value: unknown): value is TObject => {
	return typeof value === "object" && value !== null && !isArray(value);
};

export const isPlainObject = <TPlainObject extends Record<string, unknown>>(
	value: unknown,
	// eslint-disable-next-line ts-eslint/no-unsafe-function-type
	Class?: Function
): value is TPlainObject => {
	if (!isObject(value)) {
		return false;
	}

	if (Class && value instanceof Class) {
		return true;
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
