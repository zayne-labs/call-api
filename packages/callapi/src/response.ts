import type { CallApiExtraOptions, ResultModeMap } from "./types";
import type { Awaitable } from "./utils/type-helpers";
import { type CallApiSchemas, type CallApiValidators, standardSchemaParser } from "./validation";

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

export type ResponseTypeUnion = keyof InitResponseTypeMap | undefined;

export type ResponseTypeMap<TResponse> = {
	[Key in keyof InitResponseTypeMap<TResponse>]: Awaited<ReturnType<InitResponseTypeMap<TResponse>[Key]>>;
};

export type GetResponseType<
	TResponse,
	TResponseType extends ResponseTypeUnion,
	TComputedMap extends ResponseTypeMap<TResponse> = ResponseTypeMap<TResponse>,
> = undefined extends TResponseType
	? TComputedMap["json"]
	: TResponseType extends NonNullable<ResponseTypeUnion>
		? TComputedMap[TResponseType]
		: never;

export const resolveResponseData = async <TResponse>(
	response: Response,
	responseType: keyof ResponseTypeMap<TResponse>,
	parser: Parser | undefined,
	schema?: NonNullable<CallApiSchemas>[keyof NonNullable<CallApiSchemas>],
	validator?: NonNullable<CallApiValidators>[keyof NonNullable<CallApiValidators>]
) => {
	const RESPONSE_TYPE_LOOKUP = getResponseType<TResponse>(response, parser);

	if (!Object.hasOwn(RESPONSE_TYPE_LOOKUP, responseType)) {
		throw new Error(`Invalid response type: ${responseType}`);
	}

	const responseData = await RESPONSE_TYPE_LOOKUP[responseType]();

	const validResponseData = validator ? validator(responseData) : responseData;

	const schemaValidResponseData = schema
		? await standardSchemaParser(schema, validResponseData)
		: validResponseData;

	return schemaValidResponseData;
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

	const apiDetails = { data, error: null, response };

	if (!resultMode) {
		return apiDetails as TCallApiResult;
	}

	const resultModeMap: ResultModeMap = {
		all: apiDetails,
		onlyError: apiDetails.error,
		onlyResponse: apiDetails.response,
		onlySuccess: apiDetails.data,
		onlySuccessWithException: apiDetails.data,
	};

	return resultModeMap[resultMode] as TCallApiResult;
};
