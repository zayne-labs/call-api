import type { CallApiConfigWithRequiredURL, ResultModeUnion } from "@/types";

const callApiOptions = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	config: CallApiConfigWithRequiredURL<TData, TErrorData, TResultMode>
) => {
	return config;
};

export { callApiOptions };
