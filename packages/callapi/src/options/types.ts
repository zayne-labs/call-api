/* eslint-disable ts-eslint/consistent-type-definitions */
import type { CallApiConfig, CallApiResultModeUnion } from "@/types";

// prettier-ignore
export interface CallApiConfigWithRequiredURL<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends CallApiConfig<TData, TErrorData, TResultMode> {
	url: string;
}
