// prettier-ignore
export const createCombinedSignal = (...signals: Array<AbortSignal | null | undefined>) => AbortSignal.any(signals.filter(Boolean));

export const createTimeoutSignal = (milliseconds: number) => AbortSignal.timeout(milliseconds);
