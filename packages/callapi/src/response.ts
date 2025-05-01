import type { CallApiExtraOptions, CallApiResultSuccessVariant, ResultModeMap } from "./types";
import { omitKeys } from "./utils/common";
import type { Awaitable } from "./utils/type-helpers";

type Parser = (responseString: string) => Awaitable<Record<string, unknown>>;

export const getResponseType = <TResponse>(response: Response, parser?: Parser) => ({
	arrayBuffer: () => response.arrayBuffer(),
	blob: () => response.blob(),
	formData: () => response.formData(),
	json: async () => {
		if (parser) {
			const text = await response.text();
			return parser(text) as TResponse;
		}

		return response.json() as Promise<TResponse>;
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
	responseType: ResponseTypeUnion,
	parser: Parser | undefined
) => {
	const RESPONSE_TYPE_LOOKUP = getResponseType<TResponse>(response, parser);

	if (!responseType) {
		return RESPONSE_TYPE_LOOKUP.json();
	}

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, responseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	return RESPONSE_TYPE_LOOKUP[responseType]();
};

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
