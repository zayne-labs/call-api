import type { CallApiResultModeUnion } from "@/types";
import type { CallApiConfigWithRequiredURL } from "./types";

const defineCallApiOptions = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends CallApiResultModeUnion = CallApiResultModeUnion,
>(
	config: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { defineCallApiOptions };
