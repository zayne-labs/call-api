import { type Options, defineConfig } from "tsup";

const isDevMode = process.env.NODE_ENV === "development";

const commonOptions = {
	clean: true, // clean up dist folder,
	dts: true,
	entry: ["src/index.ts", "src/utils/index.ts", "src/withConfig/index.ts"],
	minify: isDevMode ? false : "terser",
	sourcemap: !isDevMode,
	tsconfig: "tsconfig.json",
} satisfies Options;

export default defineConfig([
	{
		...commonOptions,

		format: ["esm"],
		outDir: "./dist/esm",
		platform: "browser",
		splitting: true,
		target: "esnext",
		treeshake: true,
	},
	{
		...commonOptions,
		format: ["cjs"],
		outDir: "./dist/cjs",
		platform: "node",
	},
]);
