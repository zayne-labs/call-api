export default {
	"*.{js,ts}": ["pnpm test:format", "pnpm test:lint"],
	"*.ts": () => "pnpm test:check-types",
	"*.{json,yaml}": ["prettier --write"],
};
