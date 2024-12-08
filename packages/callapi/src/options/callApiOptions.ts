import type { ResultModeUnion } from "@/types";
import type { CallApiConfigWithRequiredURL } from "./types";

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
