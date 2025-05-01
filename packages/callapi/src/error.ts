import type { CallApiExtraOptions, CallApiResultErrorVariant, ResultModeMap } from "./types/common";
import { omitKeys } from "./utils/common";
import { isHTTPErrorInstance } from "./utils/guards";
import type { UnmaskType } from "./utils/type-helpers";

type ErrorInfo = {
	cloneResponse: CallApiExtraOptions["cloneResponse"];
	defaultErrorMessage: Required<CallApiExtraOptions>["defaultErrorMessage"];
	error?: unknown;
	message?: string;
	resultMode: CallApiExtraOptions["resultMode"];
};

export const resolveErrorResult = <TCallApiResult = never>(info: ErrorInfo) => {
	const { cloneResponse, defaultErrorMessage, error, message: customErrorMessage, resultMode } = info;

	let apiDetails: CallApiResultErrorVariant<unknown> = {
		data: null,
		error: {
			errorData: error as Error,
			message: customErrorMessage ?? (error as Error).message,
			name: (error as Error).name as PossibleJavaScriptError["name"],
		},
		response: null,
	};

	if (isHTTPErrorInstance<never>(error)) {
		const { errorData, message = defaultErrorMessage, name, response } = error;

		apiDetails = {
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
		all: apiDetails,
		allWithException: apiDetails as never,
		allWithoutResponse: omitKeys(apiDetails, ["response"]),
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlyResponseWithException: apiDetails.response as never,
		onlySuccess: apiDetails.data,
		onlySuccessWithException: apiDetails.data,
	} satisfies ResultModeMap;

	const getErrorResult = (customErrorInfo?: Pick<ErrorInfo, "message">) => {
		const errorVariantResult = resultModeMap[resultMode ?? "all"] as TCallApiResult;

		return customErrorInfo
			? {
					...errorVariantResult,
					error: {
						...(errorVariantResult as CallApiResultErrorVariant<unknown>).error,
						...customErrorInfo,
					},
				}
			: errorVariantResult;
	};

	return { apiDetails, getErrorResult };
};

type ErrorDetails<TErrorResponse> = {
	defaultErrorMessage: string;
	errorData: TErrorResponse;
	response: Response;
};

type ErrorOptions = {
	cause?: unknown;
};

export class HTTPError<TErrorResponse = Record<string, unknown>> {
	cause: ErrorOptions["cause"];

	errorData: ErrorDetails<TErrorResponse>["errorData"];

	isHTTPError = true;

	message: string;

	name = "HTTPError" as const;

	response: ErrorDetails<TErrorResponse>["response"];

	constructor(errorDetails: ErrorDetails<TErrorResponse>, errorOptions?: ErrorOptions) {
		const { defaultErrorMessage, errorData, response } = errorDetails;

		this.message = (errorData as { message?: string } | undefined)?.message ?? defaultErrorMessage;
		errorOptions?.cause && (this.cause = errorOptions.cause);
		this.errorData = errorData;
		this.response = response;
		Error.captureStackTrace(this, this.constructor);
	}
}

export type PossibleJavaScriptError = UnmaskType<{
	errorData: DOMException | Error | SyntaxError | TypeError;
	message: string;
	name: "AbortError" | "Error" | "SyntaxError" | "TimeoutError" | "TypeError" | (`${string}Error` & {});
}>;

export type PossibleHTTPError<TErrorData> = UnmaskType<{
	errorData: TErrorData;
	message: string;
	name: "HTTPError";
}>;
