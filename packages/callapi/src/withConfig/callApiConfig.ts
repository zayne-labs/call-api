import type { CallApiConfigWithRequiredURL, ResultModeUnion } from "@/types";

const callApiConfig = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	config: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { callApiConfig };
