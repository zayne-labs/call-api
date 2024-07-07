import type { SizeLimitConfig } from "size-limit";

const sizeLimitConfig = [
	{
		path: "./src/index.ts",
		limit: "2 kb",
	},
] satisfies SizeLimitConfig;

export default sizeLimitConfig;
