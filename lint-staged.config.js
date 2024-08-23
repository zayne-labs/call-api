export default {
	"*.{js,ts,jsx,tsx}": () => ["pnpm test:format", "pnpm test:lint"],
	"*.{json,yaml}": "pnpm test:format",
	"*.{ts,tsx}": () => "pnpm test:check-types",
	"package.json": ["pnpm test:publint", "pnpm test:attw"],
};
