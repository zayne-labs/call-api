import type { ResultModeUnion } from "@/types";
import type { CallApiExtraOptionsWithRequiredURL } from "./types";

const defineOptions = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	config: CallApiExtraOptionsWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { defineOptions };
