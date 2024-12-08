/* eslint-disable ts-eslint/consistent-type-definitions */
import type { CallApiConfig, ResultModeUnion } from "@/types";

// prettier-ignore
export interface CallApiConfigWithRequiredURL<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
> extends CallApiConfig<TData, TErrorData, TResultMode> {
	url: string;
}
