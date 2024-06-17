export default {
	"*.{js,ts}": ["pnpm format", "pnpm lint"],
	// "*.ts": "pnpm check-types",
	"*.{json,yaml}": ["prettier --write"],
};
