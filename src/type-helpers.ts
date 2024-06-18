// == These two types allows for adding arbitrary literal types, while still provided autocomplete for defaults.
// == Usually intersection with "{}" or "NonNullable<unknown>" would make it work fine, but the placeholder with never type is added to make the AnyWhatever type appear last in a given union.
export type AnyString = string & { placeholder?: never };
export type AnyNumber = number & { placeholder?: never };

/* eslint-disable @typescript-eslint/no-explicit-any */
// == `Any` is required here so that one can pass custom function type without type errors
export type AnyFunction = (...args: any[]) => any;

export const isArray = <TArray>(value: unknown): value is TArray[] => Array.isArray(value);

export const isFormData = (value: unknown) => value instanceof FormData;

export const isObject = <TObject extends Record<string, unknown>>(value: unknown): value is TObject => {
	return typeof value === "object" && value !== null && !isFormData(value) && !Array.isArray(value);
};

export const isFunction = <TFunction extends AnyFunction>(value: unknown): value is TFunction =>
	typeof value === "function";
