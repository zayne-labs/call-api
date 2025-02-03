import type {
	CallApiExtraOptions,
	CallApiResultErrorVariant,
	PossibleJavascriptErrorNames,
	ResultModeMap,
} from "./types";
import { isHTTPErrorInstance } from "./utils/type-guards";

type ErrorInfo = {
	defaultErrorMessage: Required<CallApiExtraOptions>["defaultErrorMessage"];
	error?: unknown;
	message?: string;
	resultMode: CallApiExtraOptions["resultMode"];
};

export const resolveErrorResult = <TCallApiResult = never>(info: ErrorInfo) => {
	const { defaultErrorMessage, error, message: customErrorMessage, resultMode } = info;

	let apiDetails: CallApiResultErrorVariant<unknown> = {
		data: null,
		error: {
			errorData: error as Error,
			message: customErrorMessage ?? (error as Error).message,
			name: (error as Error).name as PossibleJavascriptErrorNames,
		},
		response: null,
	};

	if (isHTTPErrorInstance(error)) {
		const { errorData, message = defaultErrorMessage, name, response } = error;

		apiDetails = {
			data: null,
			error: {
				errorData,
				message,
				name,
			},
			response,
		};
	}

	const resultModeMap: ResultModeMap = {
		all: apiDetails,
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
		onlySuccessWithException: apiDetails.data,
	};

	const generalErrorResult = resultModeMap[resultMode ?? "all"] as TCallApiResult;

	// prettier-ignore
	const resolveCustomErrorInfo = ({ message }: Pick<ErrorInfo, "message">) => {
		const errorResult = resolveErrorResult<TCallApiResult>({ ...info, message });

		return errorResult.generalErrorResult;
	};

	return { apiDetails, generalErrorResult, resolveCustomErrorInfo };
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
