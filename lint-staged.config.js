export default {
	"*.{js,ts}": ["prettier --write --cache", "pnpm test:lint"],
	"*.ts": () => "pnpm test:check-types",
	"*.{json,yaml}": "prettier --write --cache",
};
