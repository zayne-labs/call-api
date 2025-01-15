import type { CallApiResultModeUnion } from "@/types";
import type { CallApiConfigWithRequiredURL } from "./types";

const defineOptions = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
>(
	config: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { defineOptions };
