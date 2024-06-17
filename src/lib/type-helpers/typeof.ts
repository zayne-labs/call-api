import type { AnyFunction } from "./global";

export const isArray = <TArray>(value: unknown): value is TArray[] => Array.isArray(value);

export const isFormData = (value: unknown) => value instanceof FormData;

export const isObject = <TObject extends Record<string, unknown>>(value: unknown): value is TObject => {
	return typeof value === "object" && value !== null && !isFormData(value) && !Array.isArray(value);
};

// prettier-ignore
export const isFunction = <TFunction extends AnyFunction>(value: unknown): value is TFunction => typeof value === "function";
