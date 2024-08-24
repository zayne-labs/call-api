export default {
	"*.{js,ts,jsx,tsx}": () => "pnpm test:lint",
	"*.{ts,tsx}": () => "pnpm test:check-types",
	"package.json": ["pnpm test:publint", "pnpm test:attw"],
};
