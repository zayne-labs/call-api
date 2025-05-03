import { responseDefaults } from "./constants/default-options";
import type { CallApiExtraOptions, CallApiResultErrorVariant, CallApiResultSuccessVariant } from "./types";
import type { DefaultDataType } from "./types/default-types";
import { omitKeys } from "./utils/common";
import type { Awaitable, UnmaskType } from "./utils/type-helpers";

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
		| CallApiResultSuccessVariant<TComputedData>["data" | "error"]
		| CallApiResultErrorVariant<TComputedErrorData>["data" | "error"];

	onlyError:
		| CallApiResultSuccessVariant<TComputedData>["error"]
		| CallApiResultErrorVariant<TComputedErrorData>["error"];

	onlyResponse:
		| CallApiResultErrorVariant<TComputedErrorData>["response"]
		| CallApiResultSuccessVariant<TComputedData>["response"];

	onlyResponseWithException: CallApiResultSuccessVariant<TComputedData>["response"];

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
			? TResultMode extends "onlySuccess"
				? ResultModeMap<TData, TErrorData, TResponseType>["onlySuccessWithException"]
				: TResultMode extends "onlyResponse"
					? ResultModeMap<TData, TErrorData, TResponseType>["onlyResponseWithException"]
					: ResultModeMap<TData, TErrorData, TResponseType>[TResultMode]
			: never;

type SuccessInfo = {
	data: unknown;
	response: Response;
	resultMode: CallApiExtraOptions["resultMode"];
};

// == The CallApiResult type is used to cast all return statements due to a design limitation in ts.
// LINK - See https://www.zhenghao.io/posts/type-functions for more info
export const resolveSuccessResult = <TCallApiResult>(info: SuccessInfo): TCallApiResult => {
	const { data, response, resultMode } = info;

	const apiDetails = { data, error: null, response } satisfies CallApiResultSuccessVariant<unknown>;

	if (!resultMode) {
		return apiDetails as TCallApiResult;
	}

	const resultModeMap = {
		all: apiDetails,
		allWithException: apiDetails,
		allWithoutResponse: omitKeys(apiDetails, ["response"]),
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlyResponseWithException: apiDetails.response,
		onlySuccess: apiDetails.data,
		onlySuccessWithException: apiDetails.data,
	} satisfies ResultModeMap;

	return resultModeMap[resultMode] as TCallApiResult;
};
