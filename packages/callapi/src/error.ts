import type {
	CallApiExtraOptions,
	CallApiResultErrorVariant,
	PossibleJavascriptErrorNames,
	ResultModeMap,
} from "./types/common";
import { isHTTPErrorInstance, isObject } from "./utils/type-guards";

type ErrorInfo = {
	cloneResponse: CallApiExtraOptions["cloneResponse"];
	defaultErrorMessage: Required<CallApiExtraOptions>["defaultErrorMessage"];
	error?: unknown;
	message?: string;
	resultMode: CallApiExtraOptions["resultMode"];
};

export const resolveErrorResult = <TCallApiResult = never>(info: ErrorInfo) => {
	const { cloneResponse, defaultErrorMessage, error, message: customErrorMessage, resultMode } = info;

	let errorVariantDetails: CallApiResultErrorVariant<unknown> = {
		data: null,
		error: {
			errorData: error as Error,
			message: customErrorMessage ?? (error as Error).message,
			name: (error as Error).name as PossibleJavascriptErrorNames,
		},
		response: null,
	};

	if (isHTTPErrorInstance<never>(error)) {
		const { errorData, message = defaultErrorMessage, name, response } = error;

		errorVariantDetails = {
			data: null,
			error: {
				errorData,
				message,
				name,
			},
			response: cloneResponse ? response.clone() : response,
		};
	}

	const resultModeMap = {
		all: errorVariantDetails,
		allWithException: errorVariantDetails as never,
		onlyError: errorVariantDetails.error,
		onlyResponse: errorVariantDetails.response,
		onlyResponseWithException: errorVariantDetails.response as never,
		onlySuccess: errorVariantDetails.data,
		onlySuccessWithException: errorVariantDetails.data,
	} satisfies ResultModeMap;

	const getErrorResult = (customInfo?: Pick<ErrorInfo, "message">) => {
		const errorResult = resultModeMap[resultMode ?? "all"] as TCallApiResult;

		return isObject(customInfo) ? { ...errorResult, ...customInfo } : errorResult;
	};

	return { errorVariantDetails, getErrorResult };
};

type ErrorDetails<TErrorResponse> = {
	defaultErrorMessage: string;
	errorData: TErrorResponse;
	response: Response;
};

type ErrorOptions = {
	cause?: unknown;
};

export class HTTPError<TErrorResponse = Record<string, unknown>> extends Error {
	errorData: ErrorDetails<TErrorResponse>["errorData"];

	isHTTPError = true;

	override name = "HTTPError" as const;

	response: ErrorDetails<TErrorResponse>["response"];

	constructor(errorDetails: ErrorDetails<TErrorResponse>, errorOptions?: ErrorOptions) {
		const { defaultErrorMessage, errorData, response } = errorDetails;

		super((errorData as { message?: string } | undefined)?.message ?? defaultErrorMessage, errorOptions);

		this.errorData = errorData;
		this.response = response;

		Error.captureStackTrace(this, this.constructor);
	}
}
