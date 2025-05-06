import { commonDefaults } from "./constants/default-options";
import type { CallApiExtraOptions } from "./types";

type ErrorDetails<TErrorResponse> = {
	defaultErrorMessage: CallApiExtraOptions["defaultErrorMessage"];
	errorData: TErrorResponse;
	response: Response;
};

// export const httpErrorSymbol = Symbol("HTTPError");

export class HTTPError<TErrorResponse = Record<string, unknown>> extends Error {
	errorData: ErrorDetails<TErrorResponse>["errorData"];

	isHTTPError = true;

	override name = "HTTPError" as const;

	response: ErrorDetails<TErrorResponse>["response"];

	constructor(errorDetails: ErrorDetails<TErrorResponse>, errorOptions?: ErrorOptions) {
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
}
