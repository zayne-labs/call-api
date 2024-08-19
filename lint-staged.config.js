export default {
	"*.{js,ts,jsx,tsx}": ["pnpm test:lint", "pnpm test:format"],
	"*.{json,yaml}": "pnpm test:format",
	"*.{ts,tsx}": () => "pnpm test:check-types",
};
