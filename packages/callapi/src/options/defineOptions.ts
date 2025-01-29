import type { ResultModeUnion } from "@/types";
import type { CallApiConfigWithRequiredURL } from "./types";

const defineOptions = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	config: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { defineOptions };
