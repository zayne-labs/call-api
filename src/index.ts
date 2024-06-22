import { createFetchClient } from "./createFetchClient";

export const callApi = createFetchClient();

export type {
	FetchConfig,
	$RequestOptions,
	ExtraOptions,
	ResponseContext,
	ResponseErrorContext,
} from "./types";

export { HTTPError, isHTTPError, isHTTPErrorInstance, toQueryString } from "./utils";
