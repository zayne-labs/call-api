import { commonDefaults } from "./constants/default-options";
import type { CallApiExtraOptions } from "./types";
import { isObject } from "./utils/guards";

type ErrorDetails<TErrorData> = {
	defaultErrorMessage: CallApiExtraOptions["defaultErrorMessage"];
	errorData: TErrorData;
	response: Response;
};

const httpErrorSymbol = Symbol("HTTPError");

export class HTTPError<TErrorData = Record<string, unknown>> extends Error {
	errorData: ErrorDetails<TErrorData>["errorData"];

	httpErrorSymbol = httpErrorSymbol;

	isHTTPError = true;

	override name = "HTTPError" as const;

	response: ErrorDetails<TErrorData>["response"];

	constructor(errorDetails: ErrorDetails<TErrorData>, errorOptions?: ErrorOptions) {
		const { defaultErrorMessage, errorData, response } = errorDetails;

		const selectedDefaultErrorMessage =
			defaultErrorMessage ?? (response.statusText || commonDefaults.defaultErrorMessage);

		const message =
			(errorData as { message?: string } | undefined)?.message ?? selectedDefaultErrorMessage;

		super(message, errorOptions);

		this.errorData = errorData;
		this.response = response;
		Error.captureStackTrace(this, this.constructor);
	}

	/**
	 * @description Checks if the given error is an instance of HTTPError
	 * @param error - The error to check
	 * @returns true if the error is an instance of HTTPError, false otherwise
	 */
	static isError<TErrorData>(error: unknown): error is HTTPError<TErrorData> {
		if (!isObject<Record<string, unknown>>(error)) {
			return false;
		}

		if (error instanceof HTTPError) {
			return true;
		}

		return error.httpErrorSymbol === httpErrorSymbol && error.isHTTPError === true;
	}
}
