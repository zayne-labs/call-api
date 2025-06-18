import { executeHooksInTryBlock, type RequestContext } from "./hooks";
import { isObject } from "./utils/guards";

export type StreamProgressEvent = {
	/**
	 * Current chunk of data being streamed
	 */
	chunk: Uint8Array;
	/**
	 * Progress in percentage
	 */
	progress: number;
	/**
	 * Total size of data in bytes
	 */
	totalBytes: number;
	/**
	 * Amount of data transferred so far
	 */
	transferredBytes: number;
};

declare global {
	interface ReadableStream<R> {
		[Symbol.asyncIterator]: () => AsyncIterableIterator<R>;
	}
}

const createProgressEvent = (options: {
	chunk: Uint8Array;
	totalBytes: number;
	transferredBytes: number;
}): StreamProgressEvent => {
	const { chunk, totalBytes, transferredBytes } = options;

	return {
		chunk,
		progress: Math.round((transferredBytes / totalBytes) * 100) || 0,
		totalBytes,
		transferredBytes,
	};
};

const calculateTotalBytesFromBody = async (
	requestBody: Request["body"] | null,
	existingTotalBytes: number
) => {
	let totalBytes = existingTotalBytes;

	if (!requestBody) {
		return totalBytes;
	}

	for await (const chunk of requestBody) {
		totalBytes += chunk.byteLength;
	}

	return totalBytes;
};

type ToStreamableRequestContext = RequestContext & { requestInstance: Request };

export const toStreamableRequest = async (context: ToStreamableRequestContext) => {
	const { baseConfig, config, options, request, requestInstance } = context;

	if (!options.onRequestStream || !requestInstance.body) return;

	const contentLength =
		requestInstance.headers.get("content-length")
		?? new Headers(request.headers as HeadersInit).get("content-length")
		?? (request.body as Blob | null)?.size;

	let totalBytes = Number(contentLength ?? 0);

	const shouldForcefullyCalcStreamSize =
		isObject(options.forcefullyCalculateStreamSize) ?
			options.forcefullyCalculateStreamSize.request
		:	options.forcefullyCalculateStreamSize;

	// If no content length is present, we read the total bytes from the body
	if (!contentLength && shouldForcefullyCalcStreamSize) {
		totalBytes = await calculateTotalBytesFromBody(requestInstance.clone().body, totalBytes);
	}

	let transferredBytes = 0;

	await executeHooksInTryBlock(
		options.onRequestStream({
			baseConfig,
			config,
			event: createProgressEvent({ chunk: new Uint8Array(), totalBytes, transferredBytes }),
			options,
			request,
			requestInstance,
		})
	);

	const body = requestInstance.body as ReadableStream<Uint8Array> | null;

	void new ReadableStream({
		start: async (controller) => {
			if (!body) return;

			for await (const chunk of body) {
				transferredBytes += chunk.byteLength;

				totalBytes = Math.max(totalBytes, transferredBytes);

				await executeHooksInTryBlock(
					options.onRequestStream?.({
						baseConfig,
						config,
						event: createProgressEvent({ chunk, totalBytes, transferredBytes }),
						options,
						request,
						requestInstance,
					})
				);
				controller.enqueue(chunk);
			}
			controller.close();
		},
	});
};

type StreamableResponseContext = RequestContext & { response: Response };

export const toStreamableResponse = async (context: StreamableResponseContext): Promise<Response> => {
	const { baseConfig, config, options, request, response } = context;

	if (!options.onResponseStream || !response.body) {
		return response;
	}

	const contentLength = response.headers.get("content-length");

	let totalBytes = Number(contentLength ?? 0);

	const shouldForceContentLengthCalc =
		isObject(options.forcefullyCalculateStreamSize) ?
			options.forcefullyCalculateStreamSize.response
		:	options.forcefullyCalculateStreamSize;

	// If no content length is present and `forceContentLengthCalculation` is enabled, we read the total bytes from the body
	if (!contentLength && shouldForceContentLengthCalc) {
		totalBytes = await calculateTotalBytesFromBody(response.clone().body, totalBytes);
	}

	let transferredBytes = 0;

	await executeHooksInTryBlock(
		options.onResponseStream({
			baseConfig,
			config,
			event: createProgressEvent({ chunk: new Uint8Array(), totalBytes, transferredBytes }),
			options,
			request,
			response,
		})
	);

	const body = response.body as ReadableStream<Uint8Array> | null;

	const stream = new ReadableStream({
		start: async (controller) => {
			if (!body) return;

			for await (const chunk of body) {
				transferredBytes += chunk.byteLength;

				totalBytes = Math.max(totalBytes, transferredBytes);

				await executeHooksInTryBlock(
					options.onResponseStream?.({
						baseConfig,
						config,
						event: createProgressEvent({ chunk, totalBytes, transferredBytes }),
						options,
						request,
						response,
					})
				);

				controller.enqueue(chunk);
			}

			controller.close();
		},
	});

	return new Response(stream, response);
};
