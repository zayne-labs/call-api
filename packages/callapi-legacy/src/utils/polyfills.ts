export const createCombinedSignal = (...signals: Array<AbortSignal | null | undefined>) => {
	const actualSignalArray = signals.filter(Boolean);

	// eslint-disable-next-line ts-eslint/no-unnecessary-condition -- This is a polyfill
	if (AbortSignal && "any" in AbortSignal) {
		return AbortSignal.any(actualSignalArray);
	}

	const controller = new AbortController();

	const handleAbort = (actualSignal: AbortSignal) => {
		if (controller.signal.aborted) return;

		controller.abort(actualSignal.reason);
	};

	for (const actualSignal of actualSignalArray) {
		if (actualSignal.aborted) {
			handleAbort(actualSignal);
			break;
		}

		actualSignal.addEventListener("abort", () => handleAbort(actualSignal), {
			signal: controller.signal,
		});
	}

	return controller.signal;
};

export const createTimeoutSignal = (milliseconds: number) => {
	// eslint-disable-next-line ts-eslint/no-unnecessary-condition -- This is a polyfill
	if (AbortSignal && "timeout" in AbortSignal) {
		return AbortSignal.timeout(milliseconds);
	}

	const controller = new AbortController();

	const reason = new DOMException("Request timed out", "TimeoutError");

	const timeout = setTimeout(() => controller.abort(reason), milliseconds);

	controller.signal.addEventListener("abort", () => clearTimeout(timeout));

	return controller.signal;
};
