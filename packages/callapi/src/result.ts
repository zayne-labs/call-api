import { commonDefaults, responseDefaults } from "./constants/default-options";
import type { HTTPError } from "./error";
import type { CallApiExtraOptions } from "./types";
import type { DefaultDataType } from "./types/default-types";
import { omitKeys } from "./utils/common";
import { isHTTPErrorInstance } from "./utils/guards";
import type { Awaitable, Prettify, UnmaskType } from "./utils/type-helpers";

type Parser = (responseString: string) => Awaitable<Record<string, unknown>>;

export const getResponseType = <TResponse>(response: Response, parser: Parser) => ({
	arrayBuffer: () => response.arrayBuffer(),
	blob: () => response.blob(),
	formData: () => response.formData(),
	json: async () => {
		const text = await response.text();
		return parser(text) as TResponse;
	},
	stream: () => response.body,
	text: () => response.text(),
});

type InitResponseTypeMap<TResponse = unknown> = ReturnType<typeof getResponseType<TResponse>>;

export type ResponseTypeUnion = keyof InitResponseTypeMap | null;

export type ResponseTypeMap<TResponse> = {
	[Key in keyof InitResponseTypeMap<TResponse>]: Awaited<ReturnType<InitResponseTypeMap<TResponse>[Key]>>;
};

export type GetResponseType<
	TResponse,
	TResponseType extends ResponseTypeUnion,
	TComputedResponseTypeMap extends ResponseTypeMap<TResponse> = ResponseTypeMap<TResponse>,
> = null extends TResponseType
	? TComputedResponseTypeMap["json"]
	: TResponseType extends NonNullable<ResponseTypeUnion>
		? TComputedResponseTypeMap[TResponseType]
		: never;

export const resolveResponseData = <TResponse>(
	response: Response,
	responseType?: ResponseTypeUnion,
	parser?: Parser
) => {
	const selectedParser = parser ?? responseDefaults.responseParser;
	const selectedResponseType = responseType ?? responseDefaults.responseType;

	const RESPONSE_TYPE_LOOKUP = getResponseType<TResponse>(response, selectedParser);

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, selectedResponseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	return RESPONSE_TYPE_LOOKUP[selectedResponseType]();
};

export type CallApiResultSuccessVariant<TData> = {
	data: TData;
	error: null;
	response: Response;
};

export type PossibleJavaScriptError = UnmaskType<{
	errorData: PossibleJavaScriptError["originalError"];
	message: string;
	name: "AbortError" | "Error" | "SyntaxError" | "TimeoutError" | "TypeError" | (`${string}Error` & {});
	originalError: DOMException | Error | SyntaxError | TypeError;
}>;

export type PossibleHTTPError<TErrorData> = Prettify<
	UnmaskType<{
		errorData: TErrorData;
		message: string;
		name: "HTTPError";
		originalError: HTTPError;
	}>
>;

export type CallApiResultErrorVariant<TErrorData> =
	| {
			data: null;
			error: PossibleHTTPError<TErrorData>;
			response: Response;
	  }
	| {
			data: null;
			error: PossibleJavaScriptError;
			response: null;
	  };

export type ResultModeMap<
	TData = DefaultDataType,
	TErrorData = DefaultDataType,
	TResponseType extends ResponseTypeUnion = ResponseTypeUnion,
	TComputedData = GetResponseType<TData, TResponseType>,
	TComputedErrorData = GetResponseType<TErrorData, TResponseType>,
> = UnmaskType<{
	/* eslint-disable perfectionist/sort-union-types -- I need the first one to be first */
	all: CallApiResultSuccessVariant<TComputedData> | CallApiResultErrorVariant<TComputedErrorData>;

	allWithException: CallApiResultSuccessVariant<TComputedData>;

	allWithoutResponse:
		| Omit<CallApiResultSuccessVariant<TComputedData>, "response">
		| Omit<CallApiResultErrorVariant<TComputedErrorData>, "response">;

	allWithoutResponseWithException: Omit<CallApiResultSuccessVariant<TComputedData>, "response">;

	onlySuccess:
		| CallApiResultErrorVariant<TComputedErrorData>["data"]
		| CallApiResultSuccessVariant<TComputedData>["data"];

	onlySuccessWithException: CallApiResultSuccessVariant<TComputedData>["data"];
	/* eslint-enable perfectionist/sort-union-types -- I need the first one to be first */
}>;

export type ResultModeUnion = keyof ResultModeMap | null;

export type GetCallApiResult<
	TData,
	TErrorData,
	TResultMode extends ResultModeUnion,
	TThrowOnError extends boolean,
	TResponseType extends ResponseTypeUnion,
> = TErrorData extends false | undefined
	? ResultModeMap<TData, TErrorData, TResponseType>["onlySuccessWithException"]
	: null extends TResultMode
		? TThrowOnError extends true
			? ResultModeMap<TData, TErrorData, TResponseType>["allWithException"]
			: ResultModeMap<TData, TErrorData, TResponseType>["all"]
		: TResultMode extends NonNullable<ResultModeUnion>
			? ResultModeMap<TData, TErrorData, TResponseType>[TResultMode]
			: never;

type SuccessInfo = {
	response: Response;
	resultMode: CallApiExtraOptions["resultMode"];
};

type LazyResultModeMap = {
	[key in keyof ResultModeMap]: () => ResultModeMap[key];
};

const getResultModeMap = (
	details: CallApiResultErrorVariant<unknown> | CallApiResultSuccessVariant<unknown>
) => {
	const resultModeMap = {
		all: () => details,
		allWithException: () => resultModeMap.all() as never,
		allWithoutResponse: () => omitKeys(details, ["response"]) as never,
		allWithoutResponseWithException: () => resultModeMap.allWithoutResponse() as never,
		onlySuccess: () => details.data,
		onlySuccessWithException: () => resultModeMap.onlySuccess(),
	} satisfies LazyResultModeMap as LazyResultModeMap;

	return resultModeMap;
};

type SuccessResult = CallApiResultSuccessVariant<unknown> | null;

// == The CallApiResult type is used to cast all return statements due to a design limitation in ts.
// LINK - See https://www.zhenghao.io/posts/type-functions for more info
export const resolveSuccessResult = (data: unknown, info: SuccessInfo): SuccessResult => {
	const { response, resultMode } = info;

	const details = {
		data,
		error: null,
		response,
	} satisfies CallApiResultSuccessVariant<unknown>;

	const resultModeMap = getResultModeMap(details);

	const successResult = resultModeMap[resultMode ?? "all"]();

	return successResult as SuccessResult;
};

// export const resolveErrorResultAndContextForHooks = (info: ErrorInfo) => {
// 	const { baseConfig, config, error, message: customErrorMessage, options, request } = info;

// 	const errorContext = {
// 		baseConfig,
// 		config,
// 		error: errorResult?.error as never,
// 		options,
// 		request,
// 		response: errorResult?.response as never,
// 	} satisfies ErrorContext<unknown>;

// 	const shouldThrowOnError = isFunction(options.throwOnError)
// 		? options.throwOnError(errorContext)
// 		: options.throwOnError;

// 	const executeHooksInCatchBlock = async (...hookResults: Array<Awaitable<unknown>>) => {
// 		try {
// 			await Promise.all(hookResults);

// 			return null;
// 		} catch (hookError) {
// 			if (shouldThrowOnError) {
// 				throw hookError;
// 			}

// 			const { errorResult: hookErrorResult } = resolveErrorResult({ ...info, error: hookError });

// 			return hookErrorResult;
// 		}
// 	};

// 	return { errorContext, errorResult, executeHooksInCatchBlock, shouldThrowOnError };
// };

export type ErrorInfo = {
	cloneResponse: CallApiExtraOptions["cloneResponse"];
	defaultErrorMessage: CallApiExtraOptions["defaultErrorMessage"];
	message?: string;
	resultMode: CallApiExtraOptions["resultMode"];
};

type ErrorResult = CallApiResultErrorVariant<unknown> | null;

export const resolveErrorResult = (error: unknown, info: ErrorInfo): ErrorResult => {
	const { cloneResponse, defaultErrorMessage, message: customErrorMessage, resultMode } = info;

	let details = {
		data: null,
		error: {
			errorData: error as Error,
			message: customErrorMessage ?? (error as Error).message,
			name: (error as Error).name as PossibleJavaScriptError["name"],
			originalError: error as Error,
		},
		response: null,
	} satisfies CallApiResultErrorVariant<unknown> as CallApiResultErrorVariant<unknown>;

	if (isHTTPErrorInstance<never>(error)) {
		const selectedDefaultErrorMessage = defaultErrorMessage ?? commonDefaults.defaultErrorMessage;

		const { errorData, message = selectedDefaultErrorMessage, name, response } = error;

		details = {
			data: null,
			error: {
				errorData,
				message,
				name,
				originalError: error,
			},
			response: cloneResponse ? response.clone() : response,
		};
	}

	const resultModeMap = getResultModeMap(details);

	const errorResult = resultModeMap[resultMode ?? "all"]();

	return errorResult as ErrorResult;
};

export const getCustomizedErrorResult = (
	errorResult: ErrorResult,
	customErrorInfo: { message: string }
): ErrorResult => {
	if (!errorResult) {
		return null;
	}

	const { message = errorResult.error.message } = customErrorInfo;

	return {
		...errorResult,
		error: {
			...errorResult.error,
			message,
		} satisfies NonNullable<ErrorResult>["error"] as never,
	};
};
