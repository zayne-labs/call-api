import type { AnyFunction } from "./type-helpers";

export const isArray = <TArray>(value: unknown): value is TArray[] => Array.isArray(value);

export const isFormData = (value: unknown) => value instanceof FormData;

export const isObject = <TObject extends Record<string, unknown>>(value: unknown): value is TObject => {
	return (
		typeof value === "object" && value !== null && !(value instanceof FormData) && !Array.isArray(value)
	);
};

export const isFunction = <TFunction extends AnyFunction>(value: unknown): value is TFunction =>
	typeof value === "function";

export const isString = (value: unknown) => typeof value === "string";
