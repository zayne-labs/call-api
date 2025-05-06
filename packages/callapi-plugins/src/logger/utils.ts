import { statusTextMap } from "./constants";

export const getStatusText = (status: number) => statusTextMap.get(status) ?? "Unknown";
