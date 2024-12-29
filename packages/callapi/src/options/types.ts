/* eslint-disable ts-eslint/consistent-type-definitions -- This needs to be interfaces to allow users to override */
import type { CallApiConfig, CallApiResultModeUnion } from "@/types";

// prettier-ignore
export interface CallApiConfigWithRequiredURL<
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
> extends CallApiConfig<TData, TErrorData, TResultMode> {
	url: string;
}
